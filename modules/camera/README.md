# Camera Module

Normalizes camera inputs into frames and camera-health events.

## Supported sources

- Phone browser — the Be.Vision `/camera/phone` page captures the rear camera and uploads JPEG frames to the control center.
- RTSP/IP camera — supports standard RTSP URLs, including phones running an IP-camera app.
- USB/local webcam — OpenCV device indexes such as `0`, `1`, etc.

## Runtime flow

```text
Phone / RTSP / USB webcam
          ↓
     CameraManager
          ↓
   frame sampling
          ↓
 InsightFace + Qdrant
          ↓
      VisionEvent
          ↓
 Supabase / Policies / Products
```

The control center is available at `/camera/control`.

### Phone browser

The browser camera API requires a secure context (HTTPS) on mobile browsers. For a local HTTP deployment, use the RTSP/IP mode with a phone IP-camera application instead.

### RTSP

Create a camera with `source_type=rtsp` and an RTSP `source_uri`. The control center starts the source automatically and displays the MJPEG preview.

### USB webcam

Use `source_type=webcam` and `source_uri=0` (or another OpenCV device index). The webcam must be accessible to the API runtime/container.

Camera credentials must be stored as secrets and never emitted in logs or API responses.
