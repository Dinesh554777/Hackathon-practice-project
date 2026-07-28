from fastapi import APIRouter
from app.schemas import FraudDetectionRequest, FraudDetectionResponse
from app.models.fraud_detection import fraud_detector

router = APIRouter(prefix="/api/ml/fraud", tags=["fraud"])


@router.post("/detect", response_model=FraudDetectionResponse)
async def detect_fraud(req: FraudDetectionRequest):
    score, is_fraud, factors = fraud_detector.predict(req.model_dump())
    return FraudDetectionResponse(
        risk_score=round(score, 4),
        is_fraudulent=is_fraud,
        risk_factors=factors,
    )


@router.post("/train")
async def train_fraud_model(data: list[dict]):
    """Train fraud detection model on historical transactions."""
    fraud_detector.fit(data)
    return {"status": "trained", "samples": len(data)}
