from fastapi import APIRouter
import random
import datetime

router = APIRouter()

@router.get("")
async def get_weather():
    return {
        "temperature": random.randint(15, 32),
        "humidity": random.randint(40, 80),
        "windSpeed": random.randint(5, 20),
        "condition": random.choice(["Sunny", "Cloudy", "Rainy", "Stormy"]),
        "visibility": random.randint(5, 15),
        "pressure": random.randint(1005, 1020),
        "timestamp": datetime.datetime.now().isoformat()
    }
