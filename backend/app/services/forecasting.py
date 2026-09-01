"""
Phase 7: Demand Forecasting Service

Implements a Weighted Moving Average (WMA) forecasting engine that produces
explainable, reproducible, and deterministic demand predictions.

Method: Weighted Moving Average (WMA)
- Uses the most recent N weeks of demand history (default: 4 weeks).
- Recent weeks receive higher weight: [0.1, 0.2, 0.3, 0.4].
- Formula: forecast = ceil(sum(weight_i * demand_i) / sum(weight_i))
- Minimum forecast is 0.

Confidence Policy:
- Since demand history is SIMULATED, confidence is capped at 0.6 and labeled
  "ILLUSTRATIVE ESTIMATE". This prevents the system from implying false accuracy.
- If insufficient history exists, confidence is further reduced.

Provenance:
- Forecasts derived from simulated history: "ILLUSTRATIVE ESTIMATE"
- Supply counts derived from challenge data: "DERIVED"
- Combined forecast output provenance: "ILLUSTRATIVE ESTIMATE"

Model Governance:
- Every forecast run creates a ModelRun record with full traceability.
- Forecasts are linked to their model run via model_run_id.
"""

from sqlalchemy.orm import Session
from datetime import date, timedelta, datetime
from typing import List, Dict, Optional, Tuple
import math
import uuid

from app.models.all import Forecast, ModelRun, Site
from app.services.demand_history import (
    generate_demand_history,
    get_available_supply,
    get_site_equipment_pairs,
    get_all_sites,
    get_all_equipment_types,
)


# Forecasting configuration
FORECAST_VERSION = "1.0.0"
FORECAST_MODEL_NAME = "demand_forecast_wma"
DEFAULT_LOOKBACK_WEEKS = 4
DEFAULT_HORIZON_WEEKS = 4
DEFAULT_WEIGHTS = [0.1, 0.2, 0.3, 0.4]  # Most recent gets highest weight
MAX_SIMULATED_CONFIDENCE = 0.6  # Cap confidence since data is simulated


def weighted_moving_average(
    demand_values: List[int],
    weights: List[float] = None,
) -> float:
    """
    Calculate the Weighted Moving Average of demand values.
    
    Args:
        demand_values: List of demand counts, ordered oldest-first.
        weights: List of weights corresponding to each value.
                 Must be same length as demand_values.
                 If None, uses DEFAULT_WEIGHTS (truncated/padded as needed).
    
    Returns:
        The weighted average as a float.
    
    Formula:
        WMA = sum(w_i * d_i) / sum(w_i)
        where w_i is the weight and d_i is the demand for period i.
    
    This function is deterministic: same inputs always produce same outputs.
    """
    if not demand_values:
        return 0.0
    
    if weights is None:
        weights = DEFAULT_WEIGHTS
    
    # Align weights to data: use the last N weights for N data points
    n = len(demand_values)
    if n >= len(weights):
        # Use all weights, take the most recent n data points
        effective_weights = weights[-n:] if n <= len(weights) else weights
        effective_data = demand_values[-len(weights):]
    else:
        # Fewer data points than weights: use the last n weights
        effective_weights = weights[-n:]
        effective_data = demand_values
    
    # Ensure same length
    min_len = min(len(effective_weights), len(effective_data))
    effective_weights = effective_weights[-min_len:]
    effective_data = effective_data[-min_len:]
    
    total_weight = sum(effective_weights)
    if total_weight == 0:
        return 0.0
    
    weighted_sum = sum(w * d for w, d in zip(effective_weights, effective_data))
    return weighted_sum / total_weight


def _calculate_confidence(
    history_length: int,
    lookback_weeks: int,
) -> Tuple[float, str]:
    """
    Calculate confidence score for a forecast.
    
    Confidence is capped at MAX_SIMULATED_CONFIDENCE because the demand history
    is simulated. Additional reduction occurs when history is insufficient.
    
    Returns:
        Tuple of (confidence_score, confidence_explanation)
    """
    if history_length == 0:
        return 0.1, "Very low confidence: no demand history available. Forecast is a minimum baseline estimate."
    
    # Coverage ratio: what fraction of desired lookback do we have?
    coverage = min(history_length / lookback_weeks, 1.0)
    
    # Base confidence (capped for simulated data)
    confidence = MAX_SIMULATED_CONFIDENCE * coverage
    
    explanation_parts = []
    explanation_parts.append(f"Method: Weighted Moving Average with {min(history_length, lookback_weeks)}-week lookback.")
    explanation_parts.append(f"Data coverage: {history_length}/{lookback_weeks} weeks of history available.")
    
    if coverage < 1.0:
        explanation_parts.append(f"Confidence reduced due to insufficient history ({history_length} of {lookback_weeks} weeks).")
    
    explanation_parts.append(
        "IMPORTANT: Demand history is SIMULATED (derived deterministically from challenge dataset patterns). "
        "Confidence is capped at 60% maximum. These forecasts are ILLUSTRATIVE ESTIMATES for demonstration purposes."
    )
    
    return round(confidence, 2), " ".join(explanation_parts)


def _build_evidence(
    site_id: str,
    equipment_type: str,
    forecast_value: int,
    supply: int,
    gap: int,
    history_length: int,
    weights_used: List[float],
    lookback_weeks: int,
) -> str:
    """Build a human-readable evidence string explaining the forecast."""
    lines = [
        f"Demand Forecast for {equipment_type} at site {site_id}:",
        f"  Method: Weighted Moving Average (WMA v{FORECAST_VERSION})",
        f"  Lookback: {min(history_length, lookback_weeks)} weeks of demand history",
        f"  Weights: {weights_used} (most recent period weighted highest)",
        f"  Predicted weekly demand: {forecast_value} unit(s)",
        f"  Current supply at site: {supply} unit(s)",
        f"  Demand-supply gap: {gap} unit(s) {'(shortfall)' if gap > 0 else '(surplus)' if gap < 0 else '(balanced)'}",
        f"  Data provenance: Demand history is SIMULATED; supply is DERIVED from official challenge data.",
        f"  This forecast is an ILLUSTRATIVE ESTIMATE for demonstration purposes.",
    ]
    return "\n".join(lines)


def generate_forecasts(
    db: Session,
    reference_date: date = None,
    horizon_weeks: int = DEFAULT_HORIZON_WEEKS,
    lookback_weeks: int = DEFAULT_LOOKBACK_WEEKS,
    weights: List[float] = None,
) -> Dict:
    """
    Run the complete forecasting pipeline:
    1. Generate simulated demand history
    2. Apply Weighted Moving Average to each (site, equipment_type) pair
    3. Calculate supply, gap, and confidence
    4. Persist forecasts and model run to database
    
    Args:
        db: SQLAlchemy session
        reference_date: "Current" date for forecasting. Defaults to 2025-05-19.
        horizon_weeks: Number of weeks to forecast ahead (default: 4).
        lookback_weeks: Number of historical weeks used by WMA (default: 4).
        weights: Custom weights for WMA (default: [0.1, 0.2, 0.3, 0.4]).
    
    Returns:
        Dict with model_run_id, status, forecasts_generated count, and forecast list.
    """
    if reference_date is None:
        reference_date = date(2025, 5, 19)
    
    if weights is None:
        weights = DEFAULT_WEIGHTS.copy()
    
    # Ensure we have exactly lookback_weeks weights
    while len(weights) < lookback_weeks:
        weights.insert(0, 0.1)
    weights = weights[-lookback_weeks:]
    
    # Step 1: Generate demand history
    history = generate_demand_history(
        reference_date=reference_date,
        history_weeks=max(lookback_weeks, 12),  # Generate at least 12 weeks
    )
    
    # Organize history by (site, type)
    history_by_pair = {}
    for record in history:
        key = (record["site_id"], record["equipment_type"])
        if key not in history_by_pair:
            history_by_pair[key] = []
        history_by_pair[key].append(record)
    
    # Step 2: Create model run for governance
    model_run = ModelRun(
        model_name=FORECAST_MODEL_NAME,
        version=FORECAST_VERSION,
        method="weighted_moving_average",
        source="simulated demand history derived from official challenge dataset",
        parameters={
            "lookback_weeks": lookback_weeks,
            "horizon_weeks": horizon_weeks,
            "weights": weights,
            "reference_date": reference_date.isoformat(),
            "history_weeks_generated": max(lookback_weeks, 12),
        },
        horizon_days=horizon_weeks * 7,
        provenance="ILLUSTRATIVE ESTIMATE",
        status="RUNNING",
        metrics={},
    )
    db.add(model_run)
    db.flush()  # Get the ID without committing
    
    # Step 3: Generate forecasts for each (site, equipment_type) pair
    forecasts_created = []
    
    for (site_id, eq_type), pair_history in history_by_pair.items():
        # Sort history by period_start
        pair_history.sort(key=lambda x: x["period_start"])
        
        # Extract demand values for WMA (most recent lookback_weeks)
        demand_values = [r["demand_count"] for r in pair_history]
        recent_demands = demand_values[-lookback_weeks:]
        
        # Calculate WMA
        wma_value = weighted_moving_average(recent_demands, weights[-len(recent_demands):])
        predicted_demand = max(0, math.ceil(wma_value))
        
        # Get current supply
        supply, _ = get_available_supply(site_id, eq_type)
        gap = predicted_demand - supply
        
        # Calculate confidence
        confidence, confidence_explanation = _calculate_confidence(
            len(recent_demands), lookback_weeks
        )
        
        # Build evidence
        evidence = _build_evidence(
            site_id, eq_type, predicted_demand, supply, gap,
            len(recent_demands), weights[-len(recent_demands):], lookback_weeks
        )
        
        # Generate one forecast per future week
        for week_ahead in range(1, horizon_weeks + 1):
            period_start = reference_date + timedelta(weeks=week_ahead - 1)
            period_end = period_start + timedelta(days=6)
            forecast_date = period_start
            
            forecast = Forecast(
                site_id=site_id,
                equipment_type_name=eq_type,
                forecast_date=forecast_date,
                period_start=period_start,
                period_end=period_end,
                predicted_quantity=predicted_demand,
                available_supply=supply,
                demand_gap=gap,
                confidence=confidence,
                evidence=evidence,
                provenance="ILLUSTRATIVE ESTIMATE",
                method="weighted_moving_average",
                model_run_id=model_run.id,
            )
            db.add(forecast)
            forecasts_created.append(forecast)
    
    # Step 4: Update model run status
    model_run.status = "COMPLETED"
    model_run.metrics = {
        "forecasts_generated": len(forecasts_created),
        "site_type_pairs": len(history_by_pair),
        "horizon_weeks": horizon_weeks,
        "method": "weighted_moving_average",
    }
    
    db.commit()
    
    # Refresh all to get IDs
    db.refresh(model_run)
    for f in forecasts_created:
        db.refresh(f)
    
    return {
        "model_run_id": model_run.id,
        "status": "COMPLETED",
        "forecasts_generated": len(forecasts_created),
        "method": "weighted_moving_average",
        "provenance": "ILLUSTRATIVE ESTIMATE",
        "horizon_days": horizon_weeks * 7,
        "forecasts": forecasts_created,
        "message": (
            f"Generated {len(forecasts_created)} forecasts across "
            f"{len(history_by_pair)} site-equipment pairs for {horizon_weeks} weeks. "
            f"All forecasts use simulated demand history and are labeled ILLUSTRATIVE ESTIMATE."
        ),
    }


def get_demand_history_for_api(
    reference_date: date = None,
    site_id: str = None,
    equipment_type: str = None,
) -> List[Dict]:
    """
    Retrieve demand history for API display, optionally filtered.
    
    This does not require a database session because demand history is
    generated deterministically from challenge data.
    """
    history = generate_demand_history(reference_date=reference_date)
    
    if site_id:
        history = [r for r in history if r["site_id"] == site_id]
    
    if equipment_type:
        history = [r for r in history if r["equipment_type"] == equipment_type]
    
    return history
