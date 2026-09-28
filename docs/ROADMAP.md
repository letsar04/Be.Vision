# Be.Vision Roadmap

## Phase 1 — Core foundation

- [x] Normalize repository structure
- [x] Extract InsightFace adapter from facecompare-api
- [x] Define Identity service
- [x] Define Qdrant repository
- [x] Add PostgreSQL/Supabase persistence
- [x] Define canonical event schema
- [x] Add camera abstraction
- [x] Add deterministic policy engine
- [x] Add audit/action persistence
- [ ] Add API authentication and tenant isolation for user-facing endpoints

## Phase 2 — Attendance MVP

- [x] Camera stream worker
- [x] Face detection/quality
- [x] Recognition against tenant-scoped identity vectors
- [x] Arrival/presence session logic
- [x] Daily attendance API
- [x] Shared event pipeline
- [ ] Web dashboard dedicated to attendance
- [ ] Provider-specific push/SMS notification delivery

## Phase 3 — Site monitoring MVP

- [x] Zones and schedules as policy inputs
- [x] Observable event/policy foundation
- [x] Policy evaluation persistence
- [x] Auditable action creation
- [ ] Alert cooldowns/deduplication
- [ ] Mobile/web notification provider
- [ ] Operator incident timeline
- [ ] Optional controlled webhook execution

## Phase 4 — Agent layer

- [ ] Event summarization
- [ ] Multi-camera correlation
- [ ] Natural-language investigation
- [ ] Explainable incident reports
- [ ] Tool-based agent actions with permissions

## Phase 5 — Continuous learning and scale

- [x] Versioned learning contracts and controlled promotion design
- [ ] Event broker
- [ ] GPU workers
- [ ] Distributed camera workers
- [ ] Model registry/versioning implementation
- [ ] Observability
- [ ] Per-tenant quotas
- [ ] HA Qdrant/PostgreSQL strategy
- [ ] Dataset collection/feedback UI
- [ ] Automated evaluation and promotion gates

## Current vertical slice

`Phone / RTSP / USB webcam → CameraManager → InsightFace → Qdrant → VisionEvent → Supabase → Attendance / Policy → Action`

The Core is intentionally product-neutral: attendance, security monitoring and future AI-agent workflows consume the same canonical events and reusable modules.
