# Be.Vision Core API

Initial product-neutral API surface.

## Health

- GET /health
- GET /ready

## Cameras

- POST /api/v1/cameras
- GET /api/v1/cameras
- GET /api/v1/cameras/{camera_id}
- GET /api/v1/cameras/{camera_id}/status
- GET /api/v1/cameras/{camera_id}/stream — MJPEG preview for the control center.
- POST /api/v1/cameras/{camera_id}/frames — browser/phone frame ingestion.
- POST /api/v1/cameras/{camera_id}/start
- POST /api/v1/cameras/{camera_id}/stop
- DELETE /api/v1/cameras/{camera_id}

Camera sources: `phone` (browser camera), `rtsp` (IP/RTSP stream), and `webcam` (local USB camera). The browser phone mode requires HTTPS on the phone.\n
Camera credentials must never be returned by the API.

## Identities

- POST /api/v1/identities
- GET /api/v1/identities
- GET /api/v1/identities/{identity_id}
- POST /api/v1/identities/{identity_id}/enroll
- DELETE /api/v1/identities/{identity_id}

Metadata lives in PostgreSQL; vectors live in Qdrant.

## Recognition

- POST /api/v1/recognition/verify — 1:1 verification
- POST /api/v1/recognition/search — 1:N search
- POST /api/v1/recognition/quality — quality assessment

Example search response:

```json
{
  "matches": [{"identity_id": "emp_123", "score": 0.82}],
  "model": "insightface",
  "model_version": "configured-version"
}
```

Applications should receive score and quality and apply an explicit acceptance policy.

## Events

- POST /api/v1/events
- GET /api/v1/events
- GET /api/v1/events/{event_id}
- GET /api/v1/events/stream — Server-Sent Events for live control-center updates.\n
Canonical fields include type, occurred_at, camera_id, subject_id, confidence, signals, model and model_version.

## Policies

- POST /api/v1/policies
- GET /api/v1/policies
- PUT /api/v1/policies/{policy_id}
- DELETE /api/v1/policies/{policy_id}

Policies combine observable events with context such as schedules, zones and cooldowns.

## Actions

- POST /api/v1/actions/notify
- POST /api/v1/actions/webhook

Actions should be idempotent where possible and linked to the event/policy that caused them.

## Product APIs

Product-specific APIs live above Core:

- /api/v1/attendance/*
- /api/v1/security/*
- /api/v1/analytics/*


## First Core pipeline endpoint

The legacy FaceCompare API now exposes the first reusable pipeline:

`POST /api/v1/events/recognize`

Multipart fields:
- `image`: camera frame or image.
- `camera_id`: source camera identifier.
- `tenant_id`: tenant isolation key.
- `threshold`: optional recognition threshold.

Pipeline:

`image -> InsightFace -> embedding -> Qdrant(vector memory) -> identity -> VisionEvent`

The endpoint returns the canonical event plus recognition details. Product applications such as attendance and site monitoring should consume this event instead of duplicating recognition logic.

The vector-memory adapter filters searches by `tenant_id`, and enrollment payloads carry the model and model-version metadata needed for later evaluation and migration.

## Attendance

`GET /api/v1/attendance?tenant_id=default&work_date=YYYY-MM-DD`

Returns tenant-scoped daily attendance sessions. A recognized face creates an `arrival` event on the first observation of the day and `presence` events thereafter.

## Policies

```
GET    /api/v1/policies
POST   /api/v1/policies
PATCH  /api/v1/policies/{policy_id}
DELETE /api/v1/policies/{policy_id}
```

Policy definitions are deterministic and may use `event_types`, `allowed_identity_ids`, `schedule`, `required_signals`, `forbidden_signals`, `zones` and `actions`.

Example:
```json
{
  "name": "Restricted area after hours",
  "tenant_id": "default",
  "definition": {
    "event_types": ["person.detected", "face.recognized"],
    "schedule": {"start_hour": 18, "end_hour": 7},
    "zones": ["restricted"],
    "actions": [
      {"type": "notify", "payload": {"channel": "operator"}}
    ]
  }
}
```

## Actions

`POST /api/v1/actions/notify` stores an auditable action request. Provider-specific delivery (push/SMS/siren) is intentionally implemented as an adapter layer rather than embedded in the Core.
