# FleetIQ - Data Sources & Provenance Strategy (PHASE 2)

## A. Data Inventory
The official challenge dataset (`CHALLENGE_DATA.csv`) contains the following 9 fields:
1. **Equipment ID**: `String` (e.g., `EQX1001`) - Unique identifier for the asset.
2. **Type**: `String` (e.g., `Excavator`) - Equipment classification.
3. **Site ID**: `String` or `NULL` (e.g., `S003`) - Project/location assignment.
4. **Check-Out Date**: `Date` (YYYY-MM-DD) - Rental start date.
5. **Check-In Date**: `Date` (YYYY-MM-DD) - Expected or actual rental end date.
6. **Engine Hours/Day**: `Float` - Average daily productive runtime.
7. **Idle Hours/Day**: `Float` - Average daily non-productive runtime.
8. **Operating Days**: `Integer` - Total duration of the active rental.
9. **Last Operator ID**: `String` or `NULL` (e.g., `OP101`) - Assigned personnel.

## B. Data-Quality Report
* **Completeness:** 7 total records. `Site ID` and `Last Operator ID` are NULL for 2 records (EQX1002, EQX1007).
* **Duplicates:** No duplicate rows detected.
* **Inconsistencies:** EQX1002 and EQX1007 show 0 `Engine Hours/Day` but 11 and 12 `Idle Hours/Day`. This indicates assets are either not being operated at all or are deployed without being turned on for productive work.
* **Limitations:** The data is a static daily summary. It lacks real-time time-series telemetry (GPS coordinates, exact engine start/stop events), live rental rates, and historical demand series.

## C. Data Provenance Matrix
| Data Category | Source / Method | Labeling in UI |
|---------------|-----------------|----------------|
| **Asset Base Data** | Official Challenge Dataset (`CHALLENGE_DATA.csv`) | `REAL` |
| **Rental History** | Official Challenge Dataset (`CHALLENGE_DATA.csv`) | `REAL` |
| **Utilization Score** | Calculated: `Engine / (Engine + Idle)` | `DERIVED` |
| **Risk/Anomaly Score** | ML / Rules applied to challenge data | `DERIVED` |
| **Forecast Data** | Rule-based generation (for demo scenario) | `SIMULATED` |
| **Live Telemetry** | Scripted event replay based on daily averages | `SIMULATED TELEMETRY` |
| **Cost / Impact** | Calculated using assumed standard rates | `ILLUSTRATIVE ESTIMATE` |

## D. Missing-Data Analysis
Required capabilities vs. official data support:
- **Asset Dashboard:** Fully supported.
- **Usage Logging:** Supported (at a daily aggregate level).
- **Overdue Alerts:** Supported (comparing Check-In Date to current date).
- **Anomaly Detection:** Supported (e.g., EQX1007 is a clear anomaly: high idle, 0 engine, no site, no operator).
- **Demand Forecasting:** **MISSING.** We need historical demand to run an ML model like XGBoost.
- **Live Map Coordinates:** **MISSING.** No latitude/longitude provided.

## E. Real vs Derived vs Simulated Classification
* **Real:** The 7 challenge rows.
* **Derived:** Utilization percentages, Risk Scores, Anomaly labels (Low, Med, High, Critical).
* **Simulated:** We will generate mock GPS coordinates (mapping sites S001-S006 to realistic geographical points) and a baseline historical demand time-series so the XGBoost forecasting model has data to train on. We will also script a telemetry replay mechanism to simulate live engine start/stop events.

## F. `data_sources` Schema Proposal (For PostgreSQL)
```sql
CREATE TABLE data_sources (
    source_id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- e.g., 'REAL', 'DERIVED', 'SIMULATED', 'AUTHORIZED_API'
    provider VARCHAR(255),
    update_frequency VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## G. Recommended Round 1 Data Strategy
**Rely entirely on the Official Challenge Dataset augmented with deterministic simulation.**
We will strictly use the provided 7 assets as our universe. To support the map and forecast without bloating the scope, we will dynamically generate deterministic GPS coordinates and historical demand series at runtime, clearly labeled as `SIMULATED`.

## H. Recommended Round 2 Data Strategy
Integrate with ISO 15143-3 (AEMP 2.0) telematics APIs or the authorized Cat Digital Marketplace API to ingest live telemetry. Expand the asset universe to thousands of rows using a legitimate public dataset (e.g., Kaggle construction equipment logs) if official APIs are unavailable for the hackathon context.

## I. Final Decision on Additional Datasets
**NO additional external datasets are required for Round 1.**
The core signature workflow (EQX1007 -> Underutilized -> Predict S003 Demand -> Reassign -> Approve) can be perfectly demonstrated using exactly the data provided, paired with transparently labeled simulation for the missing gaps (GPS, time-series). Introducing random external datasets would violate the instruction to "Prefer official challenge data wherever possible" and add unnecessary complexity without improving the business pitch.

## Signature Workflow Data Support Check
* **UNDERUTILIZED ASSET:** Supported (EQX1007: 0 Engine, 12 Idle).
* **WHY?:** Supported (NULL Site, NULL Operator).
* **FUTURE DEMAND:** Requires `SIMULATED` demand curve for S003.
* **BEST AVAILABLE ASSET:** Supported (EQX1007 is an Excavator; S003 has EQX1001 which is an Excavator, implying S003 is an Excavator site).
* **RECOMMENDATION / ACTION / IMPACT:** Supported (`DERIVED` rules).
