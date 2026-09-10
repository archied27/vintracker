"""
Routes for the dashboard endpoint
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])