#!/usr/bin/env python3
"""
Demo Reset Script — FleetIQ Hackathon
Clears all recommendation/approval/action/impact state so EQX1007 starts AVAILABLE+IDLE every run.
Run this between demo rehearsals:
    cd /path/to/fleetiq
    export DATABASE_URL=postgresql://postgres@localhost/fleetiq
    python scripts/reset_demo.py
"""
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.core.database import SessionLocal
from app.models.all import (
    Asset, AssetOperatorAssignment,
    Recommendation, RecommendationAction, ImpactRecord,
    AllocationCandidate, Forecast, ModelRun, Alert
)


def reset():
    db = SessionLocal()
    try:
        # 1. Clear impact records (depends on actions)
        n = db.query(ImpactRecord).delete()
        print(f"Cleared {n} ImpactRecords")

        # 2. Clear recommendation actions
        n = db.query(RecommendationAction).delete()
        print(f"Cleared {n} RecommendationActions")

        # 3. Clear recommendations
        n = db.query(Recommendation).delete()
        print(f"Cleared {n} Recommendations")

        # 4. Clear allocation candidates
        n = db.query(AllocationCandidate).delete()
        print(f"Cleared {n} AllocationCandidates")

        # 5. Clear forecasts
        n = db.query(Forecast).delete()
        print(f"Cleared {n} Forecasts")

        # 6. Clear model runs
        n = db.query(ModelRun).delete()
        print(f"Cleared {n} ModelRuns")

        # 7. Clear alerts
        n = db.query(Alert).delete()
        print(f"Cleared {n} Alerts")

        # 8. Unassign operator from EQX1007
        n = db.query(AssetOperatorAssignment).filter(
            AssetOperatorAssignment.asset_id == 'EQX1007'
        ).delete()
        print(f"Cleared {n} OperatorAssignments for EQX1007")

        # 9. Reset EQX1007 -> AVAILABLE, no site
        asset = db.query(Asset).filter(Asset.id == 'EQX1007').first()
        if asset:
            asset.status = 'AVAILABLE'
            asset.current_site_id = None
            print(f"Reset EQX1007 -> status=AVAILABLE, site=None")
        else:
            print("WARNING: EQX1007 not found in DB! Run ingest.py first.")

        db.commit()
        print("\n=== DEMO RESET COMPLETE ===")
        print("EQX1007 is: AVAILABLE, no operator, no site, 12 idle hrs (from usage_daily)")
        print("Ready for: SPOT -> EXPLAIN -> ACT -> PREDICT -> PROVE")
    except Exception as e:
        db.rollback()
        print(f"ERROR during reset: {e}")
        raise
    finally:
        db.close()


if __name__ == '__main__':
    reset()

