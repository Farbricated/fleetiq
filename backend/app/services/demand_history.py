"""
Phase 7: Demand History Generator

Generates deterministic simulated demand history from the official challenge dataset.
This data is clearly labeled as SIMULATED and must never be presented as real Caterpillar data.

Methodology:
- Extracts (site_id, equipment_type) pairs from the challenge dataset.
- For each pair, generates a 12-week historical demand pattern based on:
  - The observed operating_days from the challenge data (used to derive a baseline demand level).
  - A deterministic weekly pattern using a fixed seed for reproducibility.
- All generated records carry provenance="SIMULATED".

Data Rules:
- SIMULATED data is generated deterministically (same input -> same output).
- No randomness is used; patterns are derived from challenge data attributes.
- Every record includes explicit provenance metadata.
"""

from datetime import date, timedelta
from typing import List, Dict, Tuple
import math


# Challenge dataset facts (from CHALLENGE_DATA.csv)
# These are the official values — DO NOT modify
CHALLENGE_ASSETS = [
    {"equipment_id": "EQX1001", "type": "Excavator", "site_id": "S003", "checkout": "2025-04-01", "checkin": "2025-04-16", "engine_hours": 1.5, "idle_hours": 10, "operating_days": 15, "operator": "OP101"},
    {"equipment_id": "EQX1002", "type": "Crane", "site_id": None, "checkout": "2025-03-10", "checkin": "2025-03-30", "engine_hours": 0, "idle_hours": 11, "operating_days": 20, "operator": None},
    {"equipment_id": "EQX1003", "type": "Bulldozer", "site_id": "S002", "checkout": "2025-02-15", "checkin": "2025-03-11", "engine_hours": 7.5, "idle_hours": 0.5, "operating_days": 25, "operator": "OP203"},
    {"equipment_id": "EQX1004", "type": "Excavator", "site_id": "S004", "checkout": "2025-05-05", "checkin": "2025-05-15", "engine_hours": 2, "idle_hours": 9, "operating_days": 10, "operator": "OP106"},
    {"equipment_id": "EQX1005", "type": "Bulldozer", "site_id": "S006", "checkout": "2025-01-01", "checkin": "2025-01-31", "engine_hours": 8, "idle_hours": 0, "operating_days": 30, "operator": "OP301"},
    {"equipment_id": "EQX1006", "type": "Grader", "site_id": "S001", "checkout": "2025-04-05", "checkin": "2025-04-23", "engine_hours": 3, "idle_hours": 6, "operating_days": 18, "operator": "OP114"},
    {"equipment_id": "EQX1007", "type": "Excavator", "site_id": None, "checkout": "2025-03-20", "checkin": "2025-04-01", "engine_hours": 0, "idle_hours": 12, "operating_days": 12, "operator": None},
]


def get_site_equipment_pairs() -> List[Dict]:
    """
    Extract unique (site_id, equipment_type) pairs from the challenge dataset.
    Only includes assets with assigned sites (non-NULL site_id).
    
    Returns list of dicts with site_id, equipment_type, and derived baseline demand.
    """
    pairs = {}
    for asset in CHALLENGE_ASSETS:
        site_id = asset["site_id"]
        if site_id is None:
            continue
        eq_type = asset["type"]
        key = (site_id, eq_type)
        
        if key not in pairs:
            pairs[key] = {
                "site_id": site_id,
                "equipment_type": eq_type,
                "asset_count": 0,
                "total_operating_days": 0,
                "total_engine_hours": 0.0,
            }
        
        pairs[key]["asset_count"] += 1
        pairs[key]["total_operating_days"] += asset["operating_days"]
        pairs[key]["total_engine_hours"] += asset["engine_hours"]
    
    return list(pairs.values())


def _derive_baseline_demand(pair_info: Dict) -> int:
    """
    Derive a baseline weekly demand count from challenge data attributes.
    
    Logic:
    - Sites with more operating days and engine hours imply higher demand.
    - Baseline = ceil(asset_count * utilization_factor)
    - utilization_factor = min(operating_days / 20, 1.5) — normalized to a "typical" 20-day rental.
    - Ensures minimum demand of 1.
    
    This is a DERIVED metric from official challenge data.
    """
    operating_days = pair_info["total_operating_days"]
    asset_count = pair_info["asset_count"]
    engine_hours = pair_info["total_engine_hours"]
    
    # Utilization factor: how "active" is this site-type combo
    utilization_factor = min(operating_days / 20.0, 1.5)
    
    # Engine activity bonus: higher engine hours suggest genuine demand
    engine_bonus = 1.0 if engine_hours > 5.0 else 0.5 if engine_hours > 0 else 0.0
    
    baseline = math.ceil(asset_count * utilization_factor * (1 + engine_bonus * 0.3))
    return max(1, baseline)


def _generate_weekly_pattern(baseline: int, num_weeks: int, seed_value: int) -> List[int]:
    """
    Generate a deterministic weekly demand pattern.
    
    Uses a simple deterministic pattern based on the seed value:
    - Weeks alternate between baseline and slightly above/below.
    - No randomness — pattern is fully reproducible.
    
    The pattern simulates mild weekly variation typical of construction sites:
    - Some weeks have baseline demand
    - Some weeks have baseline + 1 (peak periods)
    - Some weeks have baseline - 1 (but never below 0)
    
    seed_value is derived from the site_id + equipment_type hash to ensure
    different (site, type) pairs get different but deterministic patterns.
    """
    pattern = []
    for week in range(num_weeks):
        # Deterministic variation based on week number and seed
        # This creates a repeating pattern unique to each (site, type) pair
        variation_cycle = (week + seed_value) % 5
        
        if variation_cycle == 0:
            demand = baseline
        elif variation_cycle == 1:
            demand = baseline + 1
        elif variation_cycle == 2:
            demand = baseline
        elif variation_cycle == 3:
            demand = max(0, baseline - 1)
        else:  # variation_cycle == 4
            demand = baseline + 1
        
        pattern.append(max(0, demand))
    
    return pattern


def generate_demand_history(
    reference_date: date = None,
    history_weeks: int = 12,
) -> List[Dict]:
    """
    Generate simulated demand history for all (site, equipment_type) pairs.
    
    Args:
        reference_date: The "current" date from which to look back. 
                       Defaults to 2025-05-19 (shortly after the latest challenge checkin date).
        history_weeks: Number of weeks of history to generate (default: 12).
    
    Returns:
        List of demand history records, each containing:
        - site_id: Site identifier
        - equipment_type: Equipment type name
        - period_start: Start of the weekly period
        - period_end: End of the weekly period
        - demand_count: Number of units demanded in this period
        - provenance: "SIMULATED"
    
    All outputs are deterministic: same inputs always produce same outputs.
    """
    if reference_date is None:
        reference_date = date(2025, 5, 19)  # After latest challenge data
    
    pairs = get_site_equipment_pairs()
    history = []
    
    for pair_info in pairs:
        site_id = pair_info["site_id"]
        eq_type = pair_info["equipment_type"]
        
        # Deterministic seed from site_id + equipment_type
        seed_value = sum(ord(c) for c in f"{site_id}_{eq_type}")
        
        baseline = _derive_baseline_demand(pair_info)
        weekly_demands = _generate_weekly_pattern(baseline, history_weeks, seed_value)
        
        for week_idx in range(history_weeks):
            # Weeks count backward from reference_date
            weeks_ago = history_weeks - week_idx
            period_end = reference_date - timedelta(weeks=weeks_ago - 1)
            period_start = period_end - timedelta(days=6)
            
            history.append({
                "site_id": site_id,
                "equipment_type": eq_type,
                "period_start": period_start,
                "period_end": period_end,
                "demand_count": weekly_demands[week_idx],
                "provenance": "SIMULATED",
            })
    
    # Sort by site, type, period for consistent output
    history.sort(key=lambda x: (x["site_id"], x["equipment_type"], x["period_start"]))
    
    return history


def get_available_supply(site_id: str, equipment_type: str) -> Tuple[int, str]:
    """
    Count the current supply of a given equipment type at a site,
    based on the official challenge dataset.
    
    Returns:
        Tuple of (count, provenance)
    """
    count = 0
    for asset in CHALLENGE_ASSETS:
        if asset["site_id"] == site_id and asset["type"] == equipment_type:
            count += 1
    
    return count, "DERIVED"


def get_all_equipment_types() -> List[str]:
    """Return all unique equipment types from the challenge dataset."""
    return sorted(set(a["type"] for a in CHALLENGE_ASSETS))


def get_all_sites() -> List[str]:
    """Return all unique non-NULL site IDs from the challenge dataset."""
    return sorted(set(a["site_id"] for a in CHALLENGE_ASSETS if a["site_id"] is not None))
