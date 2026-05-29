from pydantic import BaseModel, Field


class TrackingEventCreate(BaseModel):
  event_id: str | None = None
  event_name: str = Field(min_length=2, max_length=80)
  platform: str = "internal"
  order_id: int | None = None
  payload: dict = Field(default_factory=dict)


class TrackingEventResponse(BaseModel):
  ok: bool
  event_id: str

