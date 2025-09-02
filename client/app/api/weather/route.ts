import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const weatherData = {
      temperature: Math.floor(Math.random() * 15) + 15, // 15-30°C
      humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
      windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
      condition: ["Clear", "Cloudy", "Rainy", "Sunny"][Math.floor(Math.random() * 4)],
      visibility: Math.floor(Math.random() * 5) + 5, // 5-10 km
      pressure: Math.floor(Math.random() * 50) + 1000, // 1000-1050 hPa
    }

    return NextResponse.json(weatherData)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch weather data" }, { status: 500 })
  }
}
