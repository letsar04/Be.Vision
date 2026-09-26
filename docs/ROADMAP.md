# Be.Vision Roadmap

## Phase 1 — Core foundation

- [ ] Normalize repository structure
- [ ] Extract InsightFace adapter from facecompare-api
- [ ] Define Identity service
- [ ] Define Qdrant repository
- [ ] Add PostgreSQL persistence
- [ ] Define canonical event schema
- [ ] Add camera abstraction
- [ ] Add policy engine
- [ ] Add audit logging
- [ ] Add API authentication and tenant isolation

## Phase 2 — Attendance MVP

- [ ] Camera stream worker
- [ ] Face detection/quality
- [ ] Recognition against employee collection
- [ ] Arrival/departure session logic
- [ ] Daily attendance API
- [ ] Web dashboard
- [ ] Notifications

## Phase 3 — Site monitoring MVP

- [ ] Zones and schedules
- [ ] Observable event detectors
- [ ] Policy evaluation
- [ ] Alert cooldowns/deduplication
- [ ] Mobile/web notification channel
- [ ] Operator event timeline
- [ ] Optional webhook for approved external actions

## Phase 4 — Agent layer

- [ ] Event summarization
- [ ] Multi-camera correlation
- [ ] Natural-language investigation
- [ ] Explainable incident reports
- [ ] Tool-based agent actions with permissions

## Phase 5 — Scale

- [ ] Event broker
- [ ] GPU workers
- [ ] Distributed camera workers
- [ ] Model registry/versioning
- [ ] Observability
- [ ] Per-tenant quotas
- [ ] HA Qdrant/PostgreSQL strategy

## First vertical slice

Camera -> InsightFace -> Qdrant -> identity -> event -> policy -> notification.

Once reliable, attendance and security become applications of the same Core.
