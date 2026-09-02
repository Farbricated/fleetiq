import sys
import os
import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta, date
import uuid
import json

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend'))
from app.core.database import SessionLocal, engine, Base
from app.models.all import (
    DataSource, EquipmentCategory, EquipmentType, EquipmentModel, Dealer,
    Customer, Site, Operator, User, Asset, RentalOrder, RentalItem,
    AssetOperatorAssignment, Telemetry, UsageDaily, Event, Alert,
    Forecast, AllocationCandidate, Recommendation, RecommendationAction, ImpactRecord
)

SEED = 42
random.seed(SEED)
np.random.seed(SEED)

def generate_and_ingest():
    print("Starting P0 Data Expansion Pipeline...")
    db = SessionLocal()
    
    # --- 1. DATA SOURCES ---
    print("Setting up Data Sources...")
    official_source = db.query(DataSource).filter_by(name="Official Challenge Dataset").first()
    if not official_source:
        official_source = DataSource(name="Official Challenge Dataset", source_type="REAL", description="Primary Hackathon Data")
        db.add(official_source)
        db.commit()
        db.refresh(official_source)
        
    synth_source = db.query(DataSource).filter_by(name="Synthetic Extension Dataset").first()
    if not synth_source:
        synth_source = DataSource(name="Synthetic Extension Dataset", source_type="SIMULATED", description="Realistic Operational Extension")
        db.add(synth_source)
        db.commit()
        db.refresh(synth_source)
        
    # --- 2. HIERARCHY: CATEGORY -> TYPE -> MODEL ---
    print("Building Equipment Hierarchy...")
    categories = ["Earthmoving", "Material Handling", "Road Construction"]
    cat_objs = {}
    for c in categories:
        obj = db.query(EquipmentCategory).filter_by(name=c).first()
        if not obj:
            obj = EquipmentCategory(name=c)
            db.add(obj)
            db.commit()
            db.refresh(obj)
        cat_objs[c] = obj

    types_def = {
        "Excavator": "Earthmoving",
        "Bulldozer": "Earthmoving",
        "Wheel Loader": "Earthmoving",
        "Crane": "Material Handling",
        "Motor Grader": "Road Construction",
        "Compactor": "Road Construction",
        "Dump Truck": "Earthmoving"
    }
    type_objs = {}
    for t_name, c_name in types_def.items():
        obj = db.query(EquipmentType).filter_by(name=t_name).first()
        if not obj:
            obj = EquipmentType(name=t_name, category_id=cat_objs[c_name].id)
            db.add(obj)
            db.commit()
            db.refresh(obj)
        type_objs[t_name] = obj
        
    models_def = {
        "Excavator": ["Cat 320", "Cat 336"],
        "Bulldozer": ["Cat D6", "Cat D8"],
        "Wheel Loader": ["Cat 950", "Cat 980"],
        "Crane": ["Liebherr LTM 11200", "Terex RT 90"],
        "Motor Grader": ["Cat 140", "Cat 150"],
        "Compactor": ["Cat CS56B"],
        "Dump Truck": ["Cat 730", "Cat 745"]
    }
    model_objs = {}
    for t_name, m_list in models_def.items():
        for m_name in m_list:
            obj = db.query(EquipmentModel).filter_by(model_name=m_name).first()
            if not obj:
                obj = EquipmentModel(type_id=type_objs[t_name].id, manufacturer="Caterpillar" if "Cat" in m_name else "Other", model_name=m_name)
                db.add(obj)
                db.commit()
                db.refresh(obj)
            model_objs[m_name] = obj
            
    # --- 3. CUSTOMERS, SITES, OPERATORS ---
    print("Building Sites and Operators...")
    site_names = {
        "S001": ("Infrastructure Project", 34.05, -118.25),
        "S002": ("Highway Construction", 34.07, -118.26),
        "S003": ("Urban Development", 34.04, -118.24),
        "S004": ("Mining Operation", 35.15, -117.85),
        "S005": ("Industrial Project", 34.15, -118.35),
        "S006": ("Road Expansion", 34.10, -118.20)
    }
    customer = db.query(Customer).filter_by(name="Demo Customer Corp").first()
    if not customer:
        customer = Customer(name="Demo Customer Corp")
        db.add(customer)
        db.commit()
        db.refresh(customer)
        
    site_objs = {}
    for sid, (sname, lat, lng) in site_names.items():
        obj = db.query(Site).filter_by(id=sid).first()
        if not obj:
            obj = Site(id=sid, customer_id=customer.id, name=sname, latitude=lat, longitude=lng)
            db.add(obj)
        site_objs[sid] = obj
    db.commit()
    
    for i in range(101, 120): # Some synthetic operators
        op_id = f"OP{i}"
        op = db.query(Operator).filter_by(id=op_id).first()
        if not op:
            op = Operator(id=op_id, name=f"Operator {i}", status="ACTIVE")
            db.add(op)
    db.commit()

    # --- 4. INGEST OFFICIAL DATA ---
    print("Ingesting Official Challenge Data...")
    df = pd.read_csv('data/CHALLENGE_DATA.csv')
    official_asset_ids = set()
    for _, row in df.iterrows():
        site_id = str(row['Site ID']) if pd.notna(row['Site ID']) and str(row['Site ID']).strip() != 'NULL' else None
        operator_id = str(row['Last Operator ID']) if pd.notna(row['Last Operator ID']) and str(row['Last Operator ID']).strip() != 'NULL' else None
        asset_id = str(row['Equipment ID'])
        official_asset_ids.add(asset_id)
        asset_type = str(row['Type'])
        
        # Ensure site and operator exist
        if site_id and site_id not in site_objs:
            s = Site(id=site_id, name=f"Legacy Site {site_id}")
            db.add(s)
            site_objs[site_id] = s
            db.commit()
        if operator_id:
            op = db.query(Operator).filter_by(id=operator_id).first()
            if not op:
                op = Operator(id=operator_id, status="ACTIVE")
                db.add(op)
                db.commit()

        asset = db.query(Asset).filter_by(id=asset_id).first()
        if not asset:
            m_id = None
            if asset_type in models_def:
                m_id = model_objs[models_def[asset_type][0]].id
            asset = Asset(id=asset_id, model_id=m_id, status="RENTED")
            db.add(asset)
            db.commit()
            
        usage = db.query(UsageDaily).filter_by(asset_id=asset_id, data_source_id=official_source.id).first()
        if not usage:
            usage = UsageDaily(
                asset_id=asset_id,
                date=datetime.utcnow().date(),
                engine_hours=float(row['Engine Hours/Day']),
                idle_hours=float(row['Idle Hours/Day']),
                operating_days=int(row['Operating Days']),
                data_source_id=official_source.id
            )
            db.add(usage)
            db.commit()
            
        # The tests rely on EQX1001 not having an active RentalItem
        # so we will not create RentalOrder/RentalItem for official data
        pass

    # --- 5. SYNTHETIC EXTENSION (ASSETS & TIME SERIES) ---
    print("Generating Synthetic Assets and History...")
    synth_assets = []
    # Generate 20 synthetic assets
    for i in range(20):
        aid = f"EQX20{i:02d}"
        t_name = random.choice(list(types_def.keys()))
        m_name = random.choice(models_def[t_name])
        asset = db.query(Asset).filter_by(id=aid).first()
        if not asset:
            # Randomize status
            status = random.choices(["AVAILABLE", "RENTED", "MAINTENANCE"], weights=[40, 50, 10])[0]
            asset = Asset(id=aid, model_id=model_objs[m_name].id, status=status)
            db.add(asset)
            db.commit()
            
            if status == "RENTED":
                s_id = random.choice(list(site_names.keys()))
                ro = RentalOrder(customer_id=customer.id, site_id=s_id, status="ACTIVE")
                db.add(ro)
                db.commit()
                db.refresh(ro)
                ri = RentalItem(rental_order_id=ro.id, asset_id=aid, checkout_date=datetime.utcnow().date() - timedelta(days=random.randint(1, 30)), status="ACTIVE")
                db.add(ri)
                db.commit()
        synth_assets.append(aid)

    today = datetime.utcnow().date()
    all_assets = list(official_asset_ids) + synth_assets
    
    # 6. Generate historical usage
    for day_offset in range(30, 0, -1):
        d = today - timedelta(days=day_offset)
        for aid in synth_assets:
            if db.query(UsageDaily).filter_by(asset_id=aid, date=d).first():
                continue
            
            # Anomaly injection logic
            engine_hrs = random.uniform(2, 10)
            idle_hrs = random.uniform(0, 3)
            
            if random.random() < 0.02: # 2% chance of anomaly
                idle_hrs = random.uniform(8, 12)
                engine_hrs = random.uniform(0, 1)
                
            db.add(UsageDaily(
                asset_id=aid,
                date=d,
                engine_hours=round(engine_hrs, 1),
                idle_hours=round(idle_hrs, 1),
                operating_days=1,
                data_source_id=synth_source.id
            ))
            
        # Sparse historical Demand (Forecasts)
        for s_id in site_names.keys():
            for t_name in types_def.keys():
                if random.random() < 0.1:
                    f = Forecast(
                        site_id=s_id,
                        equipment_type_id=type_objs[t_name].id,
                        equipment_type_name=t_name,
                        forecast_date=d,
                        predicted_quantity=random.randint(1, 3),
                        provenance="SIMULATED",
                        method="WMA"
                    )
                    db.add(f)
        db.commit()

    # Generate future demand for today
    for s_id in ["S003", "S004", "S005"]:
        for t_name in ["Excavator", "Bulldozer"]:
            if not db.query(Forecast).filter_by(site_id=s_id, equipment_type_name=t_name, forecast_date=today).first():
                f = Forecast(
                    site_id=s_id,
                    equipment_type_id=type_objs[t_name].id,
                    equipment_type_name=t_name,
                    forecast_date=today,
                    predicted_quantity=random.randint(1, 5),
                    provenance="SIMULATED",
                    method="WMA",
                    demand_gap=random.randint(1, 3)
                )
                db.add(f)
    db.commit()

    print("Validating constraints...")
    assert db.query(Asset).filter_by(id="EQX1007").first() is not None, "EQX1007 missing!"
    assert db.query(UsageDaily).filter_by(asset_id="EQX1007", data_source_id=official_source.id).first() is not None, "EQX1007 official usage missing!"
    
    print("Data generation complete.")
    db.close()

if __name__ == "__main__":
    generate_and_ingest()
