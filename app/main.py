from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.limiter import limiter
from app.config import settings
from app.services.firebase import init_firebase
from app.routers import auth, workflows, agents, prompts, submissions, users, admin, files

import sentry_sdk


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_firebase()
    print("✅ Firebase initialized")

    # Sentry — only initialised when DSN is set
    if settings.sentry_dsn:
        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            traces_sample_rate=0.2,  # 20% of requests for performance monitoring
            environment=settings.app_env,
        )
        print("✅ Sentry initialized")

    yield

    print("👋 Shutting down")


app = FastAPI(
    title="Shift AI Platform",
    description="AI-native operating system for Telfaz11 creative agency",
    version="1.0.0",
    lifespan=lifespan,
)

# ── Rate limiting middleware ───────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,        prefix="/auth",        tags=["Auth"])
app.include_router(users.router,       prefix="/users",       tags=["Users"])
app.include_router(workflows.router,   prefix="/workflows",   tags=["Workflows"])
app.include_router(agents.router,      prefix="/agents",      tags=["Agents"])
app.include_router(prompts.router,     prefix="/prompts",     tags=["Prompts"])
app.include_router(submissions.router, prefix="/submissions", tags=["Submissions"])
app.include_router(admin.router,       prefix="/admin",       tags=["Admin"])
app.include_router(files.router,       prefix="/files",       tags=["Files"])


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "version": "1.0.0"}