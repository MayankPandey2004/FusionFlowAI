# app/routers/weather.py
from fastapi import APIRouter
import httpx
import datetime

router = APIRouter()

BANGALORE_LAT = 12.9716
BANGALORE_LON = 77.5946

@router.get("")
async def get_weather():
    """
    Returns live weather data for Bengaluru using Open-Meteo.
    """
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={BANGALORE_LAT}&longitude={BANGALORE_LON}"
        f"&current_weather=true"
    )

    async with httpx.AsyncClient() as client:
        res = await client.get(url)
        res.raise_for_status()
        data = res.json()

    cw = data["current_weather"]
    return {
        "city": "Bengaluru",
        "temperature": cw["temperature"],
        "windSpeed": cw["windspeed"],
        "condition": "Sunny" if cw["is_day"] else "Cloudy",
        "timestamp": datetime.datetime.now().isoformat()
    }
