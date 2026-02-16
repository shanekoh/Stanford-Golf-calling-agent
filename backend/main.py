from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers.calls import router as calls_router
from routers.ai_agent import router as ai_agent_router
from routers.webhooks import router as webhooks_router

app = FastAPI(
    title="Stanford Golf Agents API",
    description="Backend for the Stanford Golf Course Agents call scheduling app",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_agent_router)
app.include_router(webhooks_router)
app.include_router(calls_router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/health")
def health_check():
    return {"status": "ok"}
