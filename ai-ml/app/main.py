from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import recommendations, fraud, forecasting

app = FastAPI(title="AI/ML Engine", version="0.9.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommendations.router)
app.include_router(fraud.router)
app.include_router(forecasting.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "ai-ml", "version": "0.9.0"}
