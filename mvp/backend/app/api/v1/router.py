"""
Main API router - combines all endpoint routers.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, cases, agreements, messages, schedule

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(cases.router, prefix="/cases", tags=["Cases"])
api_router.include_router(agreements.router, prefix="/agreements", tags=["Agreements"])
api_router.include_router(messages.router, prefix="/messages", tags=["Messages"])
api_router.include_router(schedule.router, prefix="/schedule", tags=["Schedule"])
