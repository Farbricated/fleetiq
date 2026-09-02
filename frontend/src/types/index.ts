// All TypeScript types matching backend schemas (docs/FRONTEND_CONTRACT.md + backend/app/schemas/all.py)

// ─── Core ───
export interface Asset {
  id: string;
  status: string | null;
  model_id?: string | null;
  dealer_id?: string | null;
}

export interface Site {
  id: string;
  name: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface Operator {
  id: string;
  name: string | null;
  status: string | null;
}

// ─── Dashboard ───
export interface DashboardSummary {
  total_assets: number;
  available_assets: number;
  rented_assets: number;
  overdue_assets: number;
  idle_assets: number;
  active_rentals: number;
  active_alerts: number;
}

// ─── Rentals ───
export interface RentalOrder {
  id: string;
  customer_id: string | null;
  site_id: string | null;
  status: string | null;
}

export interface RentalItem {
  id: string;
  rental_order_id: string;
  asset_id: string;
  checkout_date: string;
  checkin_date: string | null;
  status: string;
}

export interface RentalCheckoutRequest {
  asset_id: string;
  checkout_date: string;
  expected_return_date?: string;
}

export interface RentalCheckinRequest {
  checkin_date: string;
}

// ─── Telemetry / Usage ───
export interface Telemetry {
  id: string;
  asset_id: string;
  timestamp: string;
  engine_on: boolean | null;
  lat: number | null;
  lng: number | null;
}

export interface UsageDaily {
  id: string;
  asset_id: string;
  date: string;
  engine_hours: number | null;
  idle_hours: number | null;
  operating_days: number | null;
  derived_utilization_percent?: number;
}

export interface Event {
  id: string;
  asset_id: string;
  event_type: string | null;
  timestamp: string;
}

// ─── Alerts ───
export interface Alert {
  id: string;
  asset_id: string;
  type: string | null;
  severity: string | null;
  status: string | null;
  reason: string | null;
  created_at: string;
}

// ─── Analytics ───
export interface AnalyticsResult {
  asset_id: string;
  utilization_percent: number;
  idle_percent: number;
  productive_hours_derived: number;
  underutilization_score: string;
  underutilization_severity: string;
  reasons: string[];
  model_version: string;
  method: string;
  timestamp: string;
}

export interface RiskResult {
  asset_id: string;
  risk_score: string;
  risk_level: string;
  risk_factors: string[];
  explanation: string;
  model_version: string;
  method: string;
  timestamp: string;
}

export interface FleetAnalyticsSummary {
  total_assets: number;
  average_utilization: number;
  idle_assets: number;
  underutilized_assets: number;
  high_risk_assets: number;
  anomaly_count: number;
  overdue_assets: number;
}

// ─── Intelligence ───
export interface Forecast {
  id: string;
  site_id: string;
  forecast_date: string;
  predicted_quantity: number | null;
  confidence?: number;
  equipment_type_name?: string;
}

export interface Recommendation {
  id: string;
  action_type: string | null;
  confidence: number | null;
  status: string | null;
}

// ─── MOCK types (Phase 7–9, pending backend) ───
/** @provenance SIMULATED — Phase 7 backend not yet implemented */
export interface MockForecast {
  id: string;
  site_id: string;
  site_name: string;
  equipment_type: string;
  forecast_date: string;
  predicted_quantity: number;
  confidence: number;
  provenance: 'SIMULATED';
}

/** @provenance DERIVED — Phase 8 backend not yet implemented */
export interface AllocationCandidate {
  id: string;
  forecast_id: string;
  asset_id: string;
  score: number;
  rank: number;
  reasoning: Record<string, any>;
  provenance: 'DERIVED';
}

/** @provenance ILLUSTRATIVE ESTIMATE — Phase 9 backend not yet implemented */
export interface ImpactRecord {
  id: string;
  action_id: string;
  metric: string;
  estimated_value: number;
  actual_value: number | null;
  is_illustrative: boolean;
  provenance: 'ILLUSTRATIVE ESTIMATE';
}

// ─── Equipment Hierarchy ───
export interface EquipmentAsset {
  id: string;
  status: string;
}

export interface EquipmentModelEntry {
  id: string;
  model_name: string;
  manufacturer: string;
  total_units: number;
  available_units: number;
  assets: EquipmentAsset[];
}

export interface EquipmentTypeEntry {
  id: string;
  name: string;
  models: EquipmentModelEntry[];
}

export interface EquipmentCategory {
  id: string;
  name: string;
  types: EquipmentTypeEntry[];
  available_count: number;
}

// ─── UI helpers ───
export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ProvenanceType = 'REAL' | 'DERIVED' | 'SIMULATED' | 'ILLUSTRATIVE ESTIMATE';
export type AssetStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | string;
