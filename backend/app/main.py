"""FastAPI application entrypoint for Wind Forecast Monitor."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.app.api.routers import router
from backend.app.config import settings
from backend.app.data.loader import DataLoader

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing in-memory data store for January 2026...")
    loader = DataLoader.get_instance(settings.DATA_DIR)
    loader.load_data()
    logger.info("In-memory dataset loaded and ready.")
    yield
    logger.info("Application shutdown.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="UK National Wind Generation Day-Ahead Forecast Monitor & Accuracy Analysis API.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Compression & CORS
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(router)


# SPA Static Files & Fallback (Production Single-Container Mode)
frontend_dist = settings.FRONTEND_DIR
if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    logger.info(f"Mounting static frontend assets from {frontend_dist}")
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        # Allow API and docs requests to pass through
        if (
            full_path.startswith("api")
            or full_path.startswith("docs")
            or full_path.startswith("openapi.json")
        ):
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND, content={"detail": "Not Found"}
            )
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
else:

    @app.get("/")
    def root_redirect():
        return {
            "message": "Wind Forecast Monitor API is running.",
            "docs": "/docs",
            "health": "/api/health",
            "meta": "/api/meta",
        }
