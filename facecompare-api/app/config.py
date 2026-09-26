from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "FaceCompare API"
    app_version: str = "1.0.0"
    debug: bool = False

    insightface_url: str = "http://localhost:8080"
    insightface_api_key: str | None = None

    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: str | None = None

    verifications_collection: str = "kyc_verifications"
    identities_collection: str = "enrolled_identities"
    embedding_dim: int = 512
    default_match_threshold: float = 0.60

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
