from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
  model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

  app_env: str = "development"
  app_name: str = "Souk Click API"
  api_url: str = "https://api.soukclick.ma"
  frontend_url: str = "https://soukclick.ma"
  database_url: str = "postgresql+psycopg://soukclick:soukclick@soukclick_database:5432/soukclick"
  redis_url: str | None = None

  google_sheets_webhook_url: str | None = None
  order_webhook_enabled: bool = False
  order_webhook_url: str | None = None

  maxmind_account_id: str | None = None
  maxmind_license_key: str | None = None
  maxmind_enabled: bool = False
  maxmind_minfraud_enabled: bool = False
  maxmind_geoip_enabled: bool = False
  fraud_block_high_risk: bool = False

  meta_pixel_id: str | None = None
  meta_access_token: str | None = None
  meta_test_event_code: str | None = None
  meta_capi_enabled: bool = False

  tiktok_events_api_enabled: bool = False
  tiktok_pixel_code: str | None = None
  tiktok_access_token: str | None = None

  snap_capi_enabled: bool = False
  snap_pixel_id: str | None = None
  snap_access_token: str | None = None

  fraud_test_phone: str = "055000000"
  allowed_country_code: str = "MA"

  @property
  def is_development(self) -> bool:
    return self.app_env.lower() in {"local", "development", "dev"}


@lru_cache
def get_settings() -> Settings:
  return Settings()


settings = get_settings()
