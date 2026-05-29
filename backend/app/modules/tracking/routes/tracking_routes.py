from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.tracking.schemas.tracking_schema import TrackingEventCreate, TrackingEventResponse
from app.modules.tracking.services.tracking_service import TrackingService

router = APIRouter()


@router.post("/events", response_model=TrackingEventResponse)
def record_event(payload: TrackingEventCreate, db: Session = Depends(get_db)):
  return TrackingService(db).record(payload)

