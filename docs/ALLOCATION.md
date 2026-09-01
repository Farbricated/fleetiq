# FleetIQ Allocation Intelligence (Phase 8)

## Overview
The allocation intelligence engine is responsible for matching available or underutilized assets to forecasted demand at specific sites. It evaluates the entire fleet and ranks assets based on a structured scoring model.

## Scoring Model
Assets are evaluated and scored out of 100 based on the following criteria:

- **Demand Fit (40 points):** Asset category matches the forecasted demand category.
- **Equipment Compatibility (20 points):** Asset's equipment type matches the target site's infrastructure.
- **Asset Health/Risk (20 points):** 
  - `CRITICAL` risk -> Disqualified.
  - `HIGH` risk -> 0 points.
  - `MEDIUM` risk -> 10 points.
  - `LOW` risk -> 20 points.
- **Utilization Status (20 points):** 
  - Overutilized -> Disqualified.
  - Idle -> 20 points.
  - Low Utilization -> 15 points.
  - Optimal -> 5 points.

## Outputs
- **Candidates List:** A ranked list of candidates matching the forecast, containing total scores and reasoning for the score. 
- **Reasoning Structure:** JSON-based breakdown of why a candidate scored the way it did, including sub-scores and disqualification reasons.
