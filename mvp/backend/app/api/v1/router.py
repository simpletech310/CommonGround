"""
Main API router - combines all endpoint routers.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    users,
    cases,
    agreements,
    messages,
    schedule,
    websocket,
    collections,
    time_blocks,
    events,
    calendar,
    exchanges,
    court,
    exports,
)

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(cases.router, prefix="/cases", tags=["Cases"])
api_router.include_router(agreements.router, prefix="/agreements", tags=["Agreements"])
api_router.include_router(messages.router, prefix="/messages", tags=["Messages"])
api_router.include_router(schedule.router, prefix="/schedule", tags=["Schedule"])
api_router.include_router(websocket.router, tags=["WebSocket"])

# Schedule V2.0 endpoints
api_router.include_router(collections.router, prefix="/collections", tags=["My Time Collections"])
api_router.include_router(time_blocks.router, prefix="/time-blocks", tags=["Time Blocks"])
api_router.include_router(events.router, prefix="/events", tags=["Events"])
api_router.include_router(calendar.router, prefix="/calendar", tags=["Calendar"])
api_router.include_router(exchanges.router, prefix="/exchanges", tags=["Custody Exchanges"])

# Court Access Mode (MediatorMode)
api_router.include_router(court.router, prefix="/court", tags=["Court Access Mode"])

# CaseExport - Court-ready documentation packages
api_router.include_router(exports.router, prefix="/exports", tags=["Case Exports"])
