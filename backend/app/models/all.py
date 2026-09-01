from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.core.database import Base

# --- GOVERNANCE ---
class DataSource(Base):
    __tablename__ = "data_sources"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    source_type = Column(String(50), nullable=False)
    provider = Column(String(255))
    update_frequency = Column(String(50))
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ModelRun(Base):
    __tablename__ = "model_runs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_name = Column(String(255), nullable=False)
    version = Column(String(50), nullable=False)
    metrics = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow)

# --- MASTER DATA ---
class EquipmentCategory(Base):
    __tablename__ = "equipment_categories"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)

class EquipmentType(Base):
    __tablename__ = "equipment_types"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id = Column(UUID(as_uuid=True), ForeignKey("equipment_categories.id"))
    name = Column(String(255), nullable=False)

class EquipmentModel(Base):
    __tablename__ = "equipment_models"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type_id = Column(UUID(as_uuid=True), ForeignKey("equipment_types.id"))
    manufacturer = Column(String(255))
    model_name = Column(String(255))

class Dealer(Base):
    __tablename__ = "dealers"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)

class Customer(Base):
    __tablename__ = "customers"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)

class Site(Base):
    __tablename__ = "sites"
    id = Column(String(255), primary_key=True) # E.g., S003
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=True)
    name = Column(String(255))
    latitude = Column(Float)
    longitude = Column(Float)

class Operator(Base):
    __tablename__ = "operators"
    id = Column(String(255), primary_key=True) # E.g., OP101
    name = Column(String(255))
    status = Column(String(50))

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role = Column(String(50))
    name = Column(String(255))

class Asset(Base):
    __tablename__ = "assets"
    id = Column(String(255), primary_key=True) # E.g., EQX1001
    model_id = Column(UUID(as_uuid=True), ForeignKey("equipment_models.id"), nullable=True)
    dealer_id = Column(UUID(as_uuid=True), ForeignKey("dealers.id"), nullable=True)
    status = Column(String(50))

# --- RENTAL ---
class RentalOrder(Base):
    __tablename__ = "rental_orders"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=True)
    site_id = Column(String(255), ForeignKey("sites.id"), nullable=True)
    status = Column(String(50))

class RentalItem(Base):
    __tablename__ = "rental_items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rental_order_id = Column(UUID(as_uuid=True), ForeignKey("rental_orders.id"), nullable=True)
    asset_id = Column(String(255), ForeignKey("assets.id"))
    checkout_date = Column(Date)
    checkin_date = Column(Date)
    daily_rate = Column(Float)
    status = Column(String(50))

class AssetOperatorAssignment(Base):
    __tablename__ = "asset_operator_assignments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(String(255), ForeignKey("assets.id"))
    operator_id = Column(String(255), ForeignKey("operators.id"), nullable=True)
    start_date = Column(Date)

# --- OPERATIONAL ---
class Telemetry(Base):
    __tablename__ = "telemetry"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(String(255), ForeignKey("assets.id"))
    timestamp = Column(DateTime)
    engine_on = Column(Boolean)
    lat = Column(Float)
    lng = Column(Float)
    data_source_id = Column(UUID(as_uuid=True), ForeignKey("data_sources.id"))

class UsageDaily(Base):
    __tablename__ = "usage_daily"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(String(255), ForeignKey("assets.id"))
    date = Column(Date)
    engine_hours = Column(Float)
    idle_hours = Column(Float)
    operating_days = Column(Integer)
    data_source_id = Column(UUID(as_uuid=True), ForeignKey("data_sources.id"))

class Event(Base):
    __tablename__ = "events"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(String(255), ForeignKey("assets.id"))
    event_type = Column(String(255))
    timestamp = Column(DateTime)
    data_source_id = Column(UUID(as_uuid=True), ForeignKey("data_sources.id"))

# --- INTELLIGENCE ---
class Alert(Base):
    __tablename__ = "alerts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(String(255), ForeignKey("assets.id"))
    type = Column(String(255))
    severity = Column(String(50))
    status = Column(String(50))
    reason = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    model_run_id = Column(UUID(as_uuid=True), ForeignKey("model_runs.id"), nullable=True)

class Forecast(Base):
    __tablename__ = "forecasts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_id = Column(String(255), ForeignKey("sites.id"))
    equipment_type_id = Column(UUID(as_uuid=True), ForeignKey("equipment_types.id"))
    forecast_date = Column(Date)
    predicted_quantity = Column(Integer)
    model_run_id = Column(UUID(as_uuid=True), ForeignKey("model_runs.id"), nullable=True)

class AllocationCandidate(Base):
    __tablename__ = "allocation_candidates"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    forecast_id = Column(UUID(as_uuid=True), ForeignKey("forecasts.id"))
    asset_id = Column(String(255), ForeignKey("assets.id"))
    score = Column(Float)
    reasoning = Column(JSONB)

class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    selected_candidate_id = Column(UUID(as_uuid=True), ForeignKey("allocation_candidates.id"))
    action_type = Column(String(255))
    confidence = Column(Float)
    status = Column(String(50))

class RecommendationAction(Base):
    __tablename__ = "recommendation_actions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recommendation_id = Column(UUID(as_uuid=True), ForeignKey("recommendations.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    action = Column(String(50))
    timestamp = Column(DateTime, default=datetime.utcnow)

class ImpactRecord(Base):
    __tablename__ = "impact_records"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    action_id = Column(UUID(as_uuid=True), ForeignKey("recommendation_actions.id"))
    metric = Column(String(255))
    estimated_value = Column(Float)
    actual_value = Column(Float, nullable=True)
    is_illustrative = Column(Boolean, default=True)
