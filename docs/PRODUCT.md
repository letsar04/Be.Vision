# Be.Vision — Product Specification

## Vision
Be.Vision is a multi-tenant SaaS for video intelligence, attendance and site security. It connects IP cameras or test cameras to an edge vision engine and a cloud control center.

## MVP
- Organizations, sites and roles
- Camera registry and health state
- Person enrollment and consent tracking
- Face recognition events
- Attendance sessions/events
- Unknown-person alerts and incidents
- Visitor management
- Audit trail
- CSV reporting
- Subscription-ready plans

## Target customers
SMEs, schools, clinics, warehouses and private sites needing traceable presence and alerts.

## Core flow
Camera → Edge Agent → InsightFace/FaceCompare → Qdrant → vision event → policy → attendance/incident → dashboard.

## Acceptance criteria
A new tenant can create a site, register a camera, enroll a person, receive a recognition event, open an attendance session and review the audit trail. Failed enrollment must end in an explicit error state rather than an infinite loader.
