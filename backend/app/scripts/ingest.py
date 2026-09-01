import sys
import os
import pandas as pd
from datetime import datetime
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.core.database import SessionLocal
from app.models.all import Asset, Site, Operator, DataSource, UsageDaily, RentalItem

def run_ingestion():
    db = SessionLocal()
    
    # 1. Register Data Source
    source = db.query(DataSource).filter(DataSource.name == "Official Challenge Dataset").first()
    if not source:
        source = DataSource(name="Official Challenge Dataset", source_type="REAL", description="Data from hackathon image")
        db.add(source)
        db.commit()
        db.refresh(source)
    
    # 2. Read CSV
    df = pd.read_csv('../data/CHALLENGE_DATA.csv')
    
    for _, row in df.iterrows():
        # Handle NULLs
        site_id = str(row['Site ID']) if pd.notna(row['Site ID']) and str(row['Site ID']).strip() != 'NULL' else None
        operator_id = str(row['Last Operator ID']) if pd.notna(row['Last Operator ID']) and str(row['Last Operator ID']).strip() != 'NULL' else None
        
        # 3. Insert Site
        if site_id:
            site = db.query(Site).filter(Site.id == site_id).first()
            if not site:
                site = Site(id=site_id)
                db.add(site)
                
        # 4. Insert Operator
        if operator_id:
            op = db.query(Operator).filter(Operator.id == operator_id).first()
            if not op:
                op = Operator(id=operator_id, status="ACTIVE")
                db.add(op)
                
        db.commit()

        # 5. Insert Asset
        asset_id = str(row['Equipment ID'])
        asset = db.query(Asset).filter(Asset.id == asset_id).first()
        if not asset:
            asset = Asset(id=asset_id, status="RENTED")
            db.add(asset)
            db.commit()
            
        # 6. Usage Daily
        # Assume one usage daily record representing the aggregate per asset
        usage = db.query(UsageDaily).filter(UsageDaily.asset_id == asset_id, UsageDaily.date == datetime.utcnow().date()).first()
        if not usage:
            usage = UsageDaily(
                asset_id=asset_id,
                date=datetime.utcnow().date(),
                engine_hours=float(row['Engine Hours/Day']),
                idle_hours=float(row['Idle Hours/Day']),
                operating_days=int(row['Operating Days']),
                data_source_id=source.id
            )
            db.add(usage)
            
        db.commit()

    print(f"Ingested {len(df)} records successfully.")
    db.close()

if __name__ == "__main__":
    run_ingestion()
