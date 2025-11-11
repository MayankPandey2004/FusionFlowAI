/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Calendar, TrendingUp, Activity, CloudSun, Wind } from "lucide-react"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts"
import { motion, AnimatePresence } from "framer-motion"

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")
  const [predictionData, setPredictionData] = useState<any>(null)
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: "error" | "success" | "alert" } | null>(null)
  const [weatherData, setWeatherData] = useState<any>(null)
  const [isLoadingWeather, setIsLoadingWeather] = useState(false)

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000"

  // 🌀 Page intro animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true)
      setTimeout(() => setIsLoading(false), 800)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  // 🌦️ Fetch live weather data
  useEffect(() => {
    const fetchWeather = async () => {
      setIsLoadingWeather(true)
      try {
        const response = await fetch(`${API_BASE}/api/weather`)
        const data = await response.json()
        setWeatherData(data)
      } catch (err) {
        console.error("Failed to fetch weather:", err)
      } finally {
        setIsLoadingWeather(false)
      }
    }
    fetchWeather()
  }, [])

  const showNotification = (
    message: string,
    type: "error" | "success" | "alert" = "success"
  ) => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }


  const handlePredictTraffic = async () => {
    if (!selectedDate) {
      showNotification("⚠️ Please select a date", "error")
      return
    }

    setIsLoadingPrediction(true)
    try {
      const response = await fetch(`${API_BASE}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate }),
      })

      const data = await response.json()

      if (data.error) {
        showNotification(`❌ ${data.error}`, "error")
        setPredictionData(null)
        return
      }

      setPredictionData(data)
      if (!data.metrics) {
        showNotification("⚠️ No actual data found — showing predictions only.", "alert")
      } else {
        showNotification("✅ Traffic prediction completed!", "success")
      }
    } catch (err) {
      showNotification("❌ Failed to predict traffic", "error")
    } finally {
      setIsLoadingPrediction(false)
    }
  }

  if (isLoading) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-800 ${fadeOut ? "opacity-0" : "opacity-100"
          }`}
      >
        <div className="text-center space-y-6 animate-pulse">
          <TrendingUp className="w-10 h-10 text-primary mx-auto" />
          <h1 className="text-3xl font-light text-foreground/90">Urban Traffic Predictor</h1>
          <p className="text-muted-foreground">Initializing AI systems...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/98 to-background/95">
      {/* ✅ Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className={`fixed top-6 right-6 px-5 py-3 rounded-lg shadow-lg z-[9999] text-white text-sm font-medium ${notification.type === "error" ? "bg-red-500" : notification.type === "success" ? "bg-green-500" : "bg-zinc-600"
              }`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="glass-ultra border-b border-border/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-semibold text-foreground/90">Urban Traffic Predictor</h1>
          </div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground/70">
            <Activity className="w-3 h-3" />
            <span>AI Analytics</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 space-y-12 max-w-6xl">
        {/* Input Section */}
        <Card className="glass-ultra">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-lg font-medium">
              <Calendar className="w-4 h-4 text-primary/70" />
              <span>Prediction Parameters</span>
            </CardTitle>
            <CardDescription>Select a date to generate 24-hour predictions</CardDescription>
          </CardHeader>

          {/* 🧠 Two-column layout with GIF beside the form */}
          <CardContent className="grid grid-cols-1 md:grid-cols-2 items-center gap-8">
            {/* Left: Date input + button */}
            <div className="space-y-6">
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="glass-ultra h-12 border-2 border-primary/70 bg-background/40 text-foreground/90 outline-none shadow-[0_0_18px_#9333ea80] hover:shadow-[0_0_24px_#9333eaaa] focus:shadow-[0_0_30px_#a855f7] focus:border-primary transition-all duration-500 rounded-lg"
              />



              <Button
                onClick={handlePredictTraffic}
                disabled={isLoadingPrediction}
                className="h-12 w-full sm:w-auto bg-primary/80 hover:bg-primary/90 text-primary-foreground"
              >
                {isLoadingPrediction ? "Predicting..." : "Predict Traffic"}
              </Button>
            </div>

            {/* Right: Animated GIF */}
            <div className="flex justify-center md:justify-end">
              <motion.img
                src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExZGlxY3o4aG5xYzd4bnBwdHYzeHdhbjBjdHB4Zm1wb3ducmcza2dlbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/Ylf4nae35DcZkHxDgx/giphy.gif"
                alt="Traffic Animation"
                className="w-64 h-64 rounded-xl shadow-lg hover:scale-105 transition-transform duration-500 border border-border/20"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.0, ease: 'easeOut' }}
              />
            </div>
          </CardContent>
        </Card>

        {/* 🌦️ Weather Impact Section */}
        <Card className="glass-ultra border border-border/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-lg font-medium text-primary">
              <CloudSun className="w-5 h-5 text-primary" />
              <span>Weather Impact</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Current weather influencing Bengaluru’s traffic predictions
            </CardDescription>
          </CardHeader>

          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {isLoadingWeather ? (
              <div className="col-span-3 text-muted-foreground animate-pulse py-6">
                Fetching live weather data...
              </div>
            ) : weatherData ? (
              <>
                {/* 🌡 Temperature — same purple accent as Historic RMSE */}
                <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-[#0b0b0b]/70 border border-border/20 hover:bg-[#141414]/80 transition-all duration-300">
                  <h3 className="text-sm text-muted-foreground flex items-center gap-2">
                    <span role="img" aria-label="thermometer">🌡️</span> Temperature
                  </h3>
                  <p className="text-4xl font-bold text-[#a855f7] mt-2 drop-shadow-[0_0_6px_#a855f799]">
                    {weatherData.temperature}°C
                  </p>
                </div>

                {/* 💨 Wind Speed — same cyan accent as Fused RMSE */}
                <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-[#0b0b0b]/70 border border-border/20 hover:bg-[#141414]/80 transition-all duration-300">
                  <h3 className="text-sm text-muted-foreground flex items-center gap-2">
                    <span role="img" aria-label="wind">💨</span> Wind Speed
                  </h3>
                  <p className="text-4xl font-bold text-[#22d3ee] mt-2 drop-shadow-[0_0_6px_#22d3ee99]">
                    {weatherData.windSpeed} km/h
                  </p>
                </div>

                {/* ☁ Condition — same green accent as % Improvement */}
                <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-[#0b0b0b]/70 border border-border/20 hover:bg-[#141414]/80 transition-all duration-300">
                  <h3 className="text-sm text-muted-foreground flex items-center gap-2">
                    <span role="img" aria-label="cloud">☁️</span> Condition
                  </h3>
                  <p className="text-4xl font-bold text-[#22c55e] mt-2 capitalize drop-shadow-[0_0_6px_#22c55e99]">
                    {weatherData.condition}
                  </p>
                </div>
              </>
            ) : (
              <div className="col-span-3 text-muted-foreground">No weather data available.</div>
            )}
          </CardContent>
        </Card>



        {/* 📊 Metrics Cards */}
        <AnimatePresence>
          {predictionData && predictionData.metrics && (
            <motion.div
              key="metrics-cards"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <Card className="glass-strong hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-semibold text-foreground/80">Historic Model RMSE</h3>
                  <p className="text-3xl font-bold text-primary mt-2">
                    {predictionData.metrics.historical_rmse.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-strong hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-semibold text-foreground/80">Fused Model RMSE</h3>
                  <p className="text-3xl font-bold text-secondary mt-2">
                    {predictionData.metrics.fused_rmse.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-strong hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-semibold text-foreground/80">% Improvement</h3>
                  <p className="text-3xl font-bold text-green-500 mt-2">
                    {predictionData.metrics.improvement.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Results */}
        {predictionData && (
          <Card className="glass-strong hover-glow-primary transition-all duration-500">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-lg font-semibold text-primary">
                <Activity className="w-5 h-5 text-primary" />
                <span>Traffic Predictions</span>
              </CardTitle>
              <CardDescription>
                Historical vs AI-Fused vs Actual Traffic for {predictionData.date}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[450px] holographic rounded-xl">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={predictionData.predictions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="hour" tick={{ fill: "var(--muted-foreground)" }} />
                  <YAxis tick={{ fill: "var(--muted-foreground)" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderRadius: "0.5rem",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="historical"
                    stroke="var(--chart-1)"
                    strokeWidth={3}
                    dot={false}
                    name="Historical"
                  />
                  <Line
                    type="monotone"
                    dataKey="fused"
                    stroke="var(--chart-2)"
                    strokeWidth={3}
                    dot={false}
                    name="Fused"
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="var(--chart-3)"
                    strokeWidth={3}
                    dot
                    name="Actual"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        {predictionData && predictionData.metrics && (
          <Card className="glass-ultra mt-8">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground/90">
                Insights Summary
              </CardTitle>
              <CardDescription className="text-[15px] text-muted-foreground/90">
                AI-generated summary of model performance
              </CardDescription>
            </CardHeader>

            <CardContent className="text-[15px] leading-relaxed space-y-8 text-muted-foreground/90">

              {/* 📊 Performance Table */}
              <div>
                <h3 className="text-lg font-semibold text-primary mb-4">
                  📊 Model Performance Comparison
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-[15px] border border-border/20 rounded-lg overflow-hidden">
                    <thead className="bg-[#0b0b0b]/70 text-foreground/90">
                      <tr>
                        <th className="p-4 text-left font-semibold">Model</th>
                        <th className="p-4 text-center font-semibold">RMSE</th>
                        <th className="p-4 text-center font-semibold">Improvement (%) vs. Base Paper</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-border/10 hover:bg-[#111]/60 transition">
                        <td className="p-4">Base Paper (Reference)</td>
                        <td className="p-4 text-center text-[#a855f7] font-semibold text-lg">20.645</td>
                        <td className="p-4 text-center text-muted-foreground">—</td>
                      </tr>
                      <tr className="border-t border-border/10 hover:bg-[#111]/60 transition">
                        <td className="p-4">Proposed Fused XGBoost Model</td>
                        <td className="p-4 text-center text-[#22d3ee] font-semibold text-lg">
                          18.955
                        </td>
                        <td className="p-4 text-center text-[#22c55e] font-semibold text-lg">
                          8.19 %
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ⚙️ Calculation */}
              <div className="bg-[#0b0b0b]/60 rounded-lg p-5 border border-border/20">
                <h3 className="text-lg font-semibold text-primary mb-3">⚙️ Calculation</h3>
                <p className="font-mono text-[14px] text-muted-foreground/90">
                  Improvement % = ((20.645 − 18.955) / 20.645) × 100 ={" "}
                  <span className="text-[#22c55e] font-semibold">8.19 %</span>
                </p>
              </div>

              {/* 🧠 Interpretation */}
              <div>
                <h3 className="text-lg font-semibold text-primary mb-3">🧠 Interpretation</h3>
                <p className="text-[15px] leading-relaxed">
                  Your <strong>Fused XGBoost model</strong> — integrating both <strong>temporal</strong> and{" "}
                  <strong>meteorological</strong> variables — achieved an RMSE of{" "}
                  <strong>18.955</strong>, outperforming the base paper’s model (RMSE ={" "}
                  <strong>20.645</strong>) by approximately{" "}
                  <strong>8.19%</strong>.
                </p>
                <p className="mt-2 text-[15px]">
                  This demonstrates that incorporating <strong>real-time weather features</strong> enhances
                  prediction accuracy, reducing uncertainty in daily traffic forecasts under variable
                  environmental conditions.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="glass-ultra border-t border-border/10 mt-20">
        <div className="container mx-auto px-6 py-6 text-center text-sm text-muted-foreground/70">
          🚦 Powered by AI + Real-time Data Fusion
        </div>
      </footer>
    </div>
  )
}
