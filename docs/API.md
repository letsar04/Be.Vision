# Be.Vision Core API

Initial product-neutral API surface.

## Health

- GET /health
- GET /ready

## Cameras

- POST /api/v1/cameras
- GET /api/v1/cameras
- GET /api/v1/cameras/{camera_id}
- DELETE /api/v1/cameras/{camera_id}

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
