# ADR-001: Hackathon Demo Scope Cuts

**Status:** Accepted
**Date:** 2026-09-01
**Decision by:** Council (Architect + Skeptic + Pragmatist + Critic)

## Context

With ~2 hours before the demo deadline, we evaluated four P2 backlog items against the 5-beat story (SPOT → EXPLAIN → ACT → PREDICT → PROVE). Anything that doesn't make an existing beat land harder gets deferred.

## Decision

| Item | Decision | Beat | Rationale |
|---|---|---|---|
| Natural-Language Summary | **KEEP** | EXPLAIN (Beat 2) | High impact, low risk. Deterministic from existing rule engine. Carries narrative weight without latency risk. |
| What-If Simulation | **STUB** | PREDICT (Beat 4) | Mocked result panel (ILLUSTRATIVE ESTIMATE) sells the vision identically. Building a live engine risks breaking the core flow. |
| Map View | **DEFER** | — | Layout-fragile. A sorted asset table achieves SPOT beat with zero risk. Adds no story beat not already covered. |
| AI Copilot | **DEFER** | — | Unpredictable latency, hallucination risk. Steals user agency from Beat 3 (ACT), where manager action is the core narrative. |

## Judge Q&A Ready Answers

- **
