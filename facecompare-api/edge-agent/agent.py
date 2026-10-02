import os
import time
from collections import defaultdict
from datetime import datetime, timezone
import cv2
import httpx

BEVISION_INGEST_URL=os.environ["BEVISION_INGEST_URL"].rstrip("/")
BEVISION_AGENT_TOKEN=os.environ["BEVISION_AGENT_TOKEN"]
TENANT_ID=os.environ["TENANT_ID"]
CAMERA_ID=os.environ["CAMERA_ID"]
SOURCE_URI=os.environ["SOURCE_URI"]
FACECOMPARE_URL=os.environ.get("FACECOMPARE_URL","http://facecompare-api:8000").rstrip("/")
ZONE=os.environ.get("ZONE","")
CAMERA_ROLE=os.environ.get("CAMERA_ROLE","entry")
FRAME_INTERVAL=float(os.environ.get("FRAME_INTERVAL_SECONDS","1.5"))
EVENT_COOLDOWN=float(os.environ.get("EVENT_COOLDOWN_SECONDS","20"))
HEARTBEAT_INTERVAL=float(os.environ.get("HEARTBEAT_INTERVAL_SECONDS","30"))
VERSION=os.environ.get("AGENT_VERSION","0.1.0")

HEADERS={"Authorization":f"Bearer {BEVISION_AGENT_TOKEN}","X-Agent-Version":VERSION}
last_sent=defaultdict(float)

def now():
    return datetime.now(timezone.utc).isoformat()

def post_json(path,payload,timeout=8):
    with httpx.Client(timeout=timeout) as client:
        r=client.post(BEVISION_INGEST_URL+path,json=payload,headers=HEADERS)
        r.raise_for_status()
        return r.json()

def heartbeat():
    return post_json("/api/edge/heartbeat",{},timeout=5)

def send_event(event_type,subject_id=None,confidence=None,metadata=None):
    key=subject_id or event_type
    if time.time()-last_sent[key]<EVENT_COOLDOWN:return
    payload={"type":event_type,"camera_id":CAMERA_ID,"subject_id":subject_id,"confidence":confidence,"occurred_at":now(),"metadata":{"zone":ZONE,"camera_role":CAMERA_ROLE,"source":"edge-agent",**(metadata or {})},"model":"insightface","model_version":"current"}
    post_json("/api/edge/events",payload,timeout=8)
    last_sent[key]=time.time()

def recognize(frame):
    ok,jpeg=cv2.imencode(".jpg",frame,[int(cv2.IMWRITE_JPEG_QUALITY),88])
    if not ok:return
    files={"image":("frame.jpg",jpeg.tobytes(),"image/jpeg")}
    data={"tenant_id":TENANT_ID,"limit":"3"}
    with httpx.Client(timeout=15) as client:
        r=client.post(FACECOMPARE_URL+"/api/v1/search",files=files,data=data)
        r.raise_for_status()
        body=r.json()
    matches=body.get("matches",[])
    if matches:
        top=matches[0]
        send_event("face_recognized",top.get("person_id"),top.get("similarity"),{"name":top.get("name")})
    else:
        send_event("unknown_person")

def main():
    print(f"Be.Vision edge agent {VERSION} starting")
    last_heartbeat=0;capture=None;last_frame=0
    while True:
        try:
            if time.time()-last_heartbeat>=HEARTBEAT_INTERVAL:
                heartbeat();last_heartbeat=time.time()
            if capture is None or not capture.isOpened():
                if capture is not None:capture.release()
                capture=cv2.VideoCapture(SOURCE_URI);capture.set(cv2.CAP_PROP_BUFFERSIZE,1)
                if not capture.isOpened():
                    send_event("camera_offline",metadata={"reason":"stream_unavailable"});time.sleep(5);continue
            ok,frame=capture.read()
            if not ok:
                send_event("camera_offline",metadata={"reason":"frame_read_failed"});capture.release();capture=None;time.sleep(2);continue
            if time.time()-last_frame>=FRAME_INTERVAL:
                last_frame=time.time()
                try:recognize(frame)
                except Exception as exc:print("recognition error:",exc)
        except Exception as exc:
            print("agent loop error:",exc);time.sleep(3)

if __name__=="__main__":main()
