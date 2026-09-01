import os

class Settings:
    PROJECT_NAME: str = "FleetIQ"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql:///fleetiq")

settings = Settings()
