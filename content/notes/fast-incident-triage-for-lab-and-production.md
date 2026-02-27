---
title: Fast Incident Triage for Lab and Production
date: 2026-02-10
summary: A short triage model to reduce mean time to recovery when network automation fails.
tags: incident-response, sre, troubleshooting
slug: fast-incident-triage-for-lab-and-production
---
# Three-phase triage model

Use this order every time:

1. Scope: identify impacted services and blast radius.
2. Stabilize: stop automation loops and prevent new writes.
3. Recover: rollback or patch, then resume controlled traffic.

## Data you always collect

- Last successful deployment id.
- Change diff for affected nodes.
- Error rates and latency by region.
- Queue lag if message broker is used.

## Team rule

One person drives the timeline, one person validates rollback, one person communicates status.
