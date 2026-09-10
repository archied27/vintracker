"""
Routes for the dashboard endpoint
"""

from fastapi import APIRouter

router = APIRouter(prefix="/dashboard", tags=["dashboard"])