from fastapi import APIRouter, HTTPException
from app.schemas import ForecastRequest, ForecastResponse
from app.models.forecasting import forecaster

router = APIRouter(prefix="/api/ml/forecast", tags=["forecast"])


@router.post("/", response_model=ForecastResponse)
async def get_forecast(req: ForecastRequest):
    predictions, trend = forecaster.forecast(req.product_id, days=req.days)
    if trend == "insufficient_data":
        raise HTTPException(400, "Not enough historical data for this product")

    return ForecastResponse(
        product_id=req.product_id,
        predictions=predictions,
        trend=trend,
    )


@router.post("/train")
async def train_forecast(data: dict):
    """Train forecast model with sales history."""
    product_id = data.get("product_id")
    sales_history = data.get("sales_history", [])
    if not product_id or not sales_history:
        raise HTTPException(400, "product_id and sales_history are required")

    forecaster.add_sales_data(product_id, sales_history)
    return {"status": "trained", "product_id": product_id, "points": len(sales_history)}
