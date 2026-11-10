from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings, STORAGE_DIR
from app.core.database import engine, Base
from app.api import auth, matches, videos, court, analysis, analytics, reports

# Create tables in database on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="RallyVision Pro - International BWF Court Video Telemetry & Kinematics Analytics Engine",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount media storage for thumbnails, key frames, and generated reports
app.mount("/storage", StaticFiles(directory=str(STORAGE_DIR)), name="storage")

# Include API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(matches.router, prefix=settings.API_V1_STR)
app.include_router(videos.router, prefix=settings.API_V1_STR)
app.include_router(court.router, prefix=settings.API_V1_STR)
app.include_router(analysis.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "connected"
    }

@app.get("/api/security/shield-status", tags=["Security & Antivirus"])
def get_security_shield_status():
    from app.services.security_scanner import SecurityScanner
    return SecurityScanner.get_shield_status()

@app.post("/api/security/sweep", tags=["Security & Antivirus"])
def run_storage_security_sweep():
    from app.services.security_scanner import SecurityScanner
    return SecurityScanner.sweep_storage_for_malware()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

