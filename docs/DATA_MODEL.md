# Be.Vision Data Model

## PostgreSQL

PostgreSQL is the durable source of truth.

Core tables:

- tenants
- cameras
- zones
- identities
- identity_enrollments
- events
- policies
- policy_evaluations
- actions
- audit_logs

Attendance adds:

- employees
- attendance_events
- attendance_sessions

## Qdrant

Qdrant stores embeddings and searchable vector payloads.

Initial collection:

- face_embeddings

Payload should contain only what is needed for filtering and traceability:

```json
{
  "tenant_id": "tenant_01",
  "identity_id": "emp_123",
  "enrollment_id": "enr_456",
  "model": "insightface",
  "model_version": "configured-version"
}
```

Do not put sensitive business records into Qdrant when PostgreSQL can hold them.

## Retention

Retention is configurable by tenant/product. Raw images and video should have shorter default retention than event metadata. Biometric vectors require explicit access controls and deletion workflows.
