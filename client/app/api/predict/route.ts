import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, time, weatherData } = body

    const baseTraffic = Math.floor(Math.random() * 40) + 60 // 60-100%
    const weatherImpact = weatherData?.condition === "Rainy" ? 15 : weatherData?.condition === "Cloudy" ? 5 : 0

    const historical = Math.min(100, baseTraffic + weatherImpact)
    const fused = Math.min(100, historical + Math.floor(Math.random() * 10) - 5)
    const confidence = Math.floor(Math.random() * 20) + 80 // 80-100%

    const predictionData = {
      historical,
      fused,
      confidence,
      factors: {
        weather: weatherData?.condition || "Unknown",
        timeOfDay: time,
        dayOfWeek: new Date(date).toLocaleDateString("en-US", { weekday: "long" }),
      },
    }

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return NextResponse.json(predictionData)
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate traffic prediction" }, { status: 500 })
  }
}
