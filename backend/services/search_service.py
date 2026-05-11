from fastapi import APIRouter

search_router = APIRouter()

@search_router.get("/search")
async def search_facilities(lat: float, lon: float):
    pass
