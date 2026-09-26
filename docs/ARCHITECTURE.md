# Be.Vision Core Architecture

Be.Vision is evolving from a collection of prototypes into a reusable computer-vision platform.

## Goal

Build reusable APIs and modules around InsightFace, Qdrant, PostgreSQL, camera/video ingestion, event and policy processing, AI agents, notifications and controlled actions.

Products such as attendance, access control, site monitoring and visual analytics should consume the same Core APIs.

## Architecture

```
Cameras / Images / Video
          |
          v
   [ Ingestion Layer ]
          |
          v
   [ Perception Layer ]
   person / face / object
          |
          +------> InsightFace
          |
          v
    [ Identity Layer ]
   enroll / verify / search
          |
          +------> Qdrant
          |
          v
      [ Event Layer ]
 presence / recognition / zone / policy signals
          |
          v
     [ Policy Layer ]
 context + schedules + thresholds
          |
          +--------> [ AI Agents ]
          |            correlate / explain / orchestrate
          |
          v
      [ Action Layer ]
 push / SMS / webhook / alarm integration
          |
          v
       Applications
 attendance / security / analytics

PostgreSQL = source of truth for identities, cameras, events, policies and audit
Qdrant = vector memory/search, not business truth
```

## Principles

1. Detection before interpretation.
2. LLM/VLM agents are not primary detectors.
3. Important events are auditable.
4. Products depend on Core, never the reverse.
5. Privacy by design: minimize retention and protect biometric data.
6. Consequential actions use explicit policies and, where appropriate, human confirmation.

## First products

### Attendance

Camera -> person/face detection -> face embedding -> Qdrant search -> employee -> presence event -> attendance service.

### Site monitoring

Camera -> observable detections -> identity/zone/time context -> policy engine -> alert -> operator -> optional controlled action.

Prefer auditable signals such as restricted-zone presence, outside-schedule presence, face obscured, climbing detection or repeated denied access over a generic "suspicious" label.

## Deployment

Start with Docker Compose for local/on-premise deployments. Use HTTP APIs initially; introduce an event broker when event volume requires it.
