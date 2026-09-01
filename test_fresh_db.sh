#!/bin/bash
set -e
cd backend
source venv/bin/activate
# Create a fresh postgres database "fleetiq_test"
dropdb fleetiq_test || true
createdb fleetiq_test
export DATABASE_URL="postgresql:///fleetiq_test"
alembic upgrade head
python app/scripts/ingest.py
