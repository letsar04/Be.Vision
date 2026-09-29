# Be.Vision Cameras

Be.Vision supports three camera sources with one common runtime:

- **phone**: browser camera uploads JPEG frames to the Be.Vision API.
- **rtsp**: RTSP/IP camera or a phone camera application exposing RTSP.
- **webcam**: USB webcam attached to the machine running the API.

## Control center

Open:

`/camera/control`

The control center registers cameras, displays their MJPEG stream, shows online/offline state and the latest recognition event.

## Phone browser

Create a camera with `source_type=phone`, then open:

`/camera/phone?camera_id=<CAMERA_ID>&tenant_id=default`

The phone captures frames locally and uploads them about twice per second. The backend keeps the latest frame and sends approximately one recognition analysis per second.

**Browser requirement:** mobile browsers require a secure context (HTTPS) for camera access. For a phone on the local network, serve Be.Vision through HTTPS.

## RTSP/IP

Create a camera with `source_type=rtsp` and a server-side `source_uri`, for example:

`rtsp://user:password@192.168.1.50:8554/live`

Start it with:

`POST /api/v1/cameras/{camera_id}/start`

RTSP credentials are never returned by the camera API.

## Webcam USB

Create a camera with `source_type=webcam` and `source_uri=0` (or another device index), then start it. OpenCV capture runs outside the FastAPI event loop.

## Vision pipeline

Every analyzed frame follows the reusable Core path:

`camera -> frame -> InsightFace -> Qdrant -> identity -> VisionEvent -> Supabase`

Products such as attendance and security consume the resulting events instead of implementing their own camera/recognition pipeline.

## Important first-release limitation

Frames are kept in runtime memory for live viewing. Durable business records are stored in Supabase and vectors in Qdrant. A future recording module can add object storage and configurable video retention without changing the camera contracts.
