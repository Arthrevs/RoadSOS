from fastapi import APIRouter

triage_router = APIRouter()

@triage_router.post("/triage")
async def triage_crash(data: dict):
    pass
