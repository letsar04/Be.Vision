# Be.Vision Module System

The Core must be composable so a future application can select only the capabilities it needs.

## Capability categories

### Perception modules

Examples:

- face detection
- person detection
- object detection
- pose estimation
- tracking
- image quality
- OCR
- segmentation

### Identity modules

Examples:

- enrollment
- 1:1 verification
- 1:N identification
- identity tracking
- liveness/quality adapters

### Memory modules

Examples:

- Qdrant vector search
- PostgreSQL entities
- object/image storage
- event history
- knowledge retrieval

### Camera modules

Examples:

- RTSP
- USB cameras
- uploaded video
- WebRTC
- frame sampling
- camera health monitoring

### Event modules

Examples:

- detection events
- recognition events
- zone entry/exit
- dwell time
- counting
- anomaly signals

### Policy modules

Examples:

- schedules
- zones
- thresholds
- cooldowns
- escalation
- tenant-specific rules

### Agent modules

Examples:

- incident summarizer
- investigation agent
- operator assistant
- dataset curator
- evaluation agent
- training orchestrator

### Action modules

Examples:

- push notifications
- SMS
- email
- webhooks
- dashboards
- approved hardware integrations

## Composition model

A product declares its required capabilities instead of copying implementation code.

Example:

```text
Attendance
  camera
  person_detection
  face_recognition
  identity_memory
  event_engine
  attendance_policy
  dashboard

Site monitoring
  camera
  person_detection
  tracking
  zones
  schedules
  event_engine
  policy_engine
  notifications
  operator_agent

MakerLens
  image_input
  object_analysis
  material_analysis
  manufacturing_agent
  educational_ui
```

This makes it possible to create new products without modifying existing products.

## Versioning

Each module should expose:

- capability name
- version
- configuration schema
- input/output contract
- model dependencies
- resource requirements
- health check
- observability hooks

Applications depend on contracts, not internal model implementations.
