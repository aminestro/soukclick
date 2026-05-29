from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.middleware.request_id import RequestIdMiddleware
from app.db.session import SessionLocal
from app.modules.products.services.seed_service import seed_products


def create_app() -> FastAPI:
  configure_logging()

  app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
  )

  app.add_middleware(RequestIdMiddleware)
  app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
  )

  app.include_router(api_router, prefix="/api/v1")

  @app.on_event("startup")
  def seed_initial_products() -> None:
    db = SessionLocal()
    try:
      seed_products(db)
    finally:
      db.close()

  return app


app = create_app()
