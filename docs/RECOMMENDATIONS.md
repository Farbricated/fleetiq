# FleetIQ Recommendation Engine (Phase 9 & 10)

## Overview
The recommendation engine acts as the execution layer for allocation intelligence. When a candidate is selected, a `Recommendation` is created. This recommendation goes through an approval workflow and results in an `ImpactRecord` tracking the projected vs. actual ROI and operational impact.

## Recommendation Workflow
1. **PENDING**: Recommendation is created and awaits review.
2. **APPROVED/REJECTED**: A user reviews the recommendation. Approving transitions it to `APPROVED`, rejecting transitions to `REJECTED`.
3. **EXECUTED**: An approved recommendation is executed (e.g., triggering real-world logistics or system status changes).

Transitions are tracked in the `recommendation_actions` table, keeping full provenance of who acted, when, and why (via notes).

## Impact Tracking
Upon execution, an `ImpactRecord` is generated. It captures the projected utilization increase and revenue impact based on the target site's demand. Eventually, this allows comparison against actual recorded data to measure recommendation accuracy.
