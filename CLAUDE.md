# Project Instructions

## Tech Stack
- Frontend: React 19 (Vite) + TypeScript + React Router + Recharts
- Backend: Python + FastAPI + SQLAlchemy + Alembic
- Database: PostgreSQL 16
- Testing: Vitest (Frontend), Pytest (Backend)

## Code Style
- React Components: `PascalCase.tsx`
- Python Files: `snake_case.py`
- Test Files: `*.test.tsx` (Frontend), `test_*.py` (Backend)

## Testing
- Run Frontend Tests: `npm test` (in `frontend/`)
- Run Backend Tests: `pytest` (in `backend/`)

## Build & Run
- Start Infrastructure: `docker-compose up -d`
- Dev Frontend: `npm run dev` (in `frontend/`)
- Dev Backend: `uvicorn app.main:app --reload` (in `backend/`)
- DB Migrations: `alembic upgrade head` (in `backend/`)

## Project Structure
- `backend/app/` → FastAPI Backend code (api, core, models, schemas, services)
- `frontend/src/` → React Frontend code (api, components, pages, types)
- `docker-compose.yml` → Local environment setup

## Conventions
- Use FastAPI `Depends(get_db)` for database session injection.
- Validate API inputs/outputs using Pydantic schemas in `backend/app/schemas/`.
- Git history unavailable or too shallow to detect conventions.

