from pydantic import BaseModel
from typing import Optional


class RecommendationRequest(BaseModel):
    user_id: str
    top_n: int = 10


class RecommendationResponse(BaseModel):
    user_id: str
    recommendations: list[dict]


class FraudDetectionRequest(BaseModel):
    user_id: str
    amount: float
    transaction_type: str = "purchase"
    ip_address: Optional[str] = None
    device_id: Optional[str] = None
    shipping_distance: Optional[float] = None
    is_new_user: bool = False
    failed_attempts_last_hour: int = 0


class FraudDetectionResponse(BaseModel):
    risk_score: float
    is_fraudulent: bool
    risk_factors: list[str]


class ForecastRequest(BaseModel):
    product_id: str
    days: int = 30


class ForecastResponse(BaseModel):
    product_id: str
    predictions: list[dict]
    trend: str
