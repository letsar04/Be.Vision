"""Runtime camera manager for phone/browser, USB webcam and RTSP/IP cameras."""
from __future__ import annotations

import asyncio
import time
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
        self.persistence = persistence
        self.pipeline = pipeline
        self.analysis_interval = analysis_interval
        self.cameras: dict[str, CameraState] = {}

    def state(self, camera_id: str, source_type: str = "phone") -> CameraState:
        return self.cameras.setdefault(
            camera_id, CameraState(camera_id=camera_id, source_type=source_type)
        )

    async def ingest(
        self,
        camera_id: str,
        frame: bytes,
        source_type: str = "phone",
        tenant_id: str = "default",
        analyze: bool = True,
    ):
        if not frame:
            raise ValueError("Empty camera frame")
        state = self.state(camera_id, source_type)
        state.latest_jpeg = frame
        state.updated_at = time.time()
        state.frames += 1

        now = time.time()
        if (
            analyze
            and self.pipeline
            and now - state.last_analysis >= self.analysis_interval
            and not state.analyzing
        ):
            state.analyzing = True
            state.last_analysis = now
            state.task = asyncio.create_task(self._analyze(state, frame, tenant_id))
        return self.status(camera_id)

    async def _analyze(self, state: CameraState, frame: bytes, tenant_id: str):
        try:
            event, details = await self.pipeline.process(
                frame, camera_id=state.camera_id, tenant_id=tenant_id
            )
            state.last_event = {
                "event": event.model_dump(mode="json"),
                "details": details,
            }
        except Exception as exc:
            state.last_event = {"error": str(exc)}
        finally:
            state.analyzing = False

    def status(self, camera_id: str) -> dict[str, Any]:
        state = self.cameras.get(camera_id)
        if not state:
            return {"camera_id": camera_id, "online": False, "running": False}

        running = bool(state.task and not state.task.done())
        online = time.time() - state.updated_at < 5
        return {
            "camera_id": state.camera_id,
            "source_type": state.source_type,
            "online": online,
            "running": running,
            "updated_at": state.updated_at,
            "frames": state.frames,
            "analyzing": state.analyzing,
            "last_event": state.last_event,
        }

    def jpeg(self, camera_id: str) -> bytes | None:
        state = self.cameras.get(camera_id)
        return state.latest_jpeg if state else None

    async def start_opencv(
        self, camera_id: str, source: str | int, tenant_id: str = "default"
    ):
        if cv2 is None:
            raise RuntimeError("OpenCV is not installed")

        source_type = "rtsp" if isinstance(source, str) else "webcam"
        state = self.state(camera_id, source_type)
        if state.task and not state.task.done():
            return self.status(camera_id)

        async def loop():
            cap = await asyncio.to_thread(cv2.VideoCapture, source)
            try:
                if not cap.isOpened():
                    raise RuntimeError(f"Unable to open camera source: {source}")

                while True:
                    ok, frame = await asyncio.to_thread(cap.read)
                    if not ok:
                        await asyncio.sleep(0.5)
                        continue

                    ok, encoded = await asyncio.to_thread(
                        cv2.imencode,
                        ".jpg",
                        frame,
                        [int(cv2.IMWRITE_JPEG_QUALITY), 80],
                    )
                    if ok:
                        await self.ingest(
                            camera_id,
                            encoded.tobytes(),
                            source_type,
                            tenant_id,
                            True,
                        )
                    await asyncio.sleep(0.03)
            finally:
                await asyncio.to_thread(cap.release)

        state.task = asyncio.create_task(loop())
        await asyncio.sleep(0)
        return self.status(camera_id)

    async def stop(self, camera_id: str):
        state = self.cameras.get(camera_id)
        if state and state.task:
            state.task.cancel()
            try:
                await state.task
            except asyncio.CancelledError:
                pass
            state.task = None
        return self.status(camera_id)

    def stream(self, camera_id: str):
        async def generator():
            last = 0.0
            while True:
                state = self.cameras.get(camera_id)
                if state and state.latest_jpeg and state.updated_at > last:
                    last = state.updated_at
                    frame = state.latest_jpeg
                    yield (
                        b"--frame\r\n"
                        b"Content-Type: image/jpeg\r\n"
                        + f"Content-Length: {len(frame)}\r\n\r\n".encode()
                        + frame
                        + b"\r\n"
                    )
                await asyncio.sleep(0.08)

        return generator()
