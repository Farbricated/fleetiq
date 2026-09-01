#!/bin/bash
# FleetIQ Demo Startup Script
# Run this in WSL: bash start_demo.sh
set -e

echo '=== FleetIQ Demo Startup ==='

# Fix Postgres socket dir (disappears across WSL restarts)
sudo mkdir -p /var/run/postgresql
sudo chown postgres:postgres /var/run/postgresql
sudo chmod 2777 /var/run/postgresql

# Check if Postgres is running
if ss -tlnp | grep -q 5432; then
  echo '[PG] Already running'
else
  echo '[PG] Starting PostgreSQL...'
  sudo -u postgres /usr/lib/postgresql/18/bin/postgres \
    -D /var/lib/postgresql/18/main \
    -c config_file=/etc/postgresql/18/main/postgresql.conf \
    -c unix_socket_directories=/var/run/postgresql >> /tmp/pg_demo.log 2>&1 &
  sleep 3
  echo '[PG] Started'
fi

# Test DB connection
export DATABASE_URL=postgresql://postgres@127.0.0.1/fleetiq
if sudo -u postgres psql -h 127.0.0.1 -c 'SELECT 1' >/dev/null 2>&1; then
  echo '[DB] fleetiq connected OK'
else
  echo '[DB] ERROR: Cannot connect to fleetiq database!'
  exit 1
fi

# Kill old uvicorn if running
pkill -f uvicorn || true
sleep 1

# Start backend
cd '/mnt/d/Akarsh all/Praticals/fleetiq/backend'
echo '[API] Starting FastAPI on port 8000...'
export DATABASE_URL=postgresql://postgres@127.0.0.1/fleetiq
./venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 >> /tmp/api_demo.log 2>&1 &
APIPID=$!
sleep 10

# Verify API
if curl -sf http://localhost:8000/health >/dev/null 2>&1; then
  echo '[API] Backend running at http://localhost:8000'
else
  echo '[API] ERROR: Backend failed to start. Check /tmp/api_demo.log'
  exit 1
fi

echo ''
echo '==================================================='
echo ' FleetIQ is LIVE!'
echo ' Frontend: Start manually with: cd frontend && npm run dev'
echo ' Backend:  http://localhost:8000'
echo ' API docs: http://localhost:8000/docs'
echo ' Logs:     /tmp/api_demo.log  /tmp/pg_demo.log'
echo '==================================================='
echo 'Press Ctrl+C to stop the backend server.'
tail -f /tmp/api_demo.log
