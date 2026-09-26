"""Runtime camera manager: browser/phone frames plus RTSP/OpenCV sources."""
from __future__ import annotations
import asyncio, time
from dataclasses import dataclass, field
from typing import Any
try:
    import cv2
except ImportError:
    cv2 = None

@dataclass
class CameraState:
    camera_id: str
    source_type: str
    latest_jpeg: bytes | None = None
    updated_at: float = 0.0
    frames: int = 0
    analyzing: bool = False
    last_analysis: float = 0.0
    last_event: dict[str, Any] | None = None
    task: asyncio.Task | None = field(default=None, repr=False)

class CameraManager:
    def __init__(self, persistence=None, pipeline=None, analysis_interval: float = 1.0):
        self.persistence=persistence; self.pipeline=pipeline; self.analysis_interval=analysis_interval
        self.cameras: dict[str, CameraState]={}

    def state(self,camera_id:str,source_type="phone")->CameraState:
        return self.cameras.setdefault(camera_id,CameraState(camera_id,source_type))

    async def ingest(self,camera_id:str,frame:bytes,source_type="phone",tenant_id="default",analyze=True):
        if not frame: raise ValueError("Empty camera frame")
        state=self.state(camera_id,source_type); state.latest_jpeg=frame; state.updated_at=time.time(); state.frames+=1
        if analyze and self.pipeline and time.time()-state.last_analysis>=self.analysis_interval and not state.analyzing:
            state.analyzing=True; state.last_analysis=time.time()
            state.task=asyncio.create_task(self._analyze(state,frame,tenant_id))
        return self.status(camera_id)

    async def _analyze(self,state:CameraState,frame:bytes,tenant_id:str):
        try:
            event,details=await self.pipeline.process(frame,camera_id=state.camera_id,tenant_id=tenant_id)
            state.last_event={"event":event.model_dump(mode="json"),"details":details}
        except Exception as exc:
            state.last_event={"error":str(exc)}
        finally: state.analyzing=False

    def status(self,camera_id:str)->dict[str,Any]:
        s=self.cameras.get(camera_id)
        if not s:return {"camera_id":camera_id,"online":False}
        return {"camera_id":s.camera_id,"source_type":s.source_type,"online":time.time()-s.updated_at<5,
                "updated_at":s.updated_at,"frames":s.frames,"analyzing":s.analyzing,"last_event":s.last_event}

    def jpeg(self,camera_id:str)->bytes|None:
        s=self.cameras.get(camera_id); return s.latest_jpeg if s else None

    async def start_opencv(self,camera_id:str,source:str|int,tenant_id="default"):
        if cv2 is None: raise RuntimeError("OpenCV is not installed")
        state=self.state(camera_id,"rtsp" if isinstance(source,str) else "webcam")
        async def loop():
            cap=await asyncio.to_thread(cv2.VideoCapture,source)
            try:
                while True:
                    ok,frame=await asyncio.to_thread(cap.read)
                    if ok:
                        ok,encoded=await asyncio.to_thread(cv2.imencode,".jpg",frame,[int(cv2.IMWRITE_JPEG_QUALITY),80])
                        if ok: await self.ingest(camera_id,encoded.tobytes(),state.source_type,tenant_id,True)
                    await asyncio.sleep(.05)
            finally:
                await asyncio.to_thread(cap.release)
        state.task=asyncio.create_task(loop())
        return self.status(camera_id)

    async def stop(self,camera_id:str):
        s=self.cameras.get(camera_id)
        if s and s.task:s.task.cancel();s.task=None
        return self.status(camera_id)

    def stream(self,camera_id:str):
        async def generator():
            last=0.0
            while True:
                state=self.cameras.get(camera_id)
                if state and state.latest_jpeg and state.updated_at>last:
                    last=state.updated_at
                    yield b"--frame\r\nContent-Type: image/jpeg\r\nContent-Length: "+str(len(state.latest_jpeg)).encode()+b"\r\n\r\n"+state.latest_jpeg+b"\r\n"
                await asyncio.sleep(.08)
        return generator()
