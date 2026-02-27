---
title: Designing gRPC APIs for Network Control Planes
date: 2026-02-18
summary: Design principles for low-friction gRPC APIs used by controllers and network services.
tags: grpc, api, distributed-systems
slug: designing-grpc-apis-for-network-control-planes
---
# Keep the API boring and explicit

Network services benefit from deterministic interfaces. Favor explicit request objects and stable enums over ad-hoc string fields.

## API conventions

- Keep method names verb based (`ApplyConfig`, `GetStatus`, `StreamTelemetry`).
- Version protobuf packages from day one.
- Use clear error details with machine-readable codes.
- Prefer server streaming for telemetry snapshots.

## Avoid this anti-pattern

Do not overload one generic RPC method for everything. It increases coupling and makes observability harder.

## Deployment note

Use mTLS between internal services and pin certificate rotation dates in your runbook.
