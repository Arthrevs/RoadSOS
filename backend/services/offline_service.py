from fastapi import APIRouter

offline_router = APIRouter()

@offline_router.get("/offline-pack")
async def get_offline_pack():
    pass
