from fastapi import APIRouter, HTTPException
from app.schemas import RecommendationRequest, RecommendationResponse
from app.models.recommender import recommender

router = APIRouter(prefix="/api/ml/recommendations", tags=["recommendations"])


@router.post("/", response_model=RecommendationResponse)
async def get_recommendations(req: RecommendationRequest):
    product_ids = recommender.hybrid_recommendations(req.user_id, top_n=req.top_n)
    return RecommendationResponse(
        user_id=req.user_id,
        recommendations=[{"product_id": pid, "score": 1.0} for pid in product_ids],
    )


@router.post("/similar/{product_id}")
async def get_similar_products(product_id: str, top_n: int = 10):
    product_ids = recommender.content_recommendations(product_id, top_n=top_n)
    return {"product_id": product_id, "similar": product_ids}


@router.post("/train")
async def train_recommender(data: dict):
    """Train with historical purchase data."""
    user_ids = data.get("user_ids", [])
    product_ids = data.get("product_ids", [])
    ratings = data.get("ratings", [])

    if len(user_ids) != len(product_ids) or len(product_ids) != len(ratings):
        raise HTTPException(400, "Arrays must have equal length")

    recommender.fit_user_product(user_ids, product_ids, ratings)
    return {"status": "trained", "users": len(set(user_ids)), "products": len(set(product_ids))}
