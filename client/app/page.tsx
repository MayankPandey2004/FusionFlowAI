/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Calendar, TrendingUp, Activity } from "lucide-react"
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

  const [notification, setNotification] = useState<{ message: string; type: "error" | "success" } | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000"

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true)
      setTimeout(() => setIsLoading(false), 800)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  const showNotification = (message: string, type: "error" | "success" = "success") => {
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
      showNotification("✅ Traffic prediction completed!", "success")
    } catch (err) {
      showNotification("❌ Failed to predict traffic", "error")
    } finally {
      setIsLoadingPrediction(false)
    }
  }

  if (isLoading) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-800 ${fadeOut ? "opacity-0" : "opacity-100"}`}>
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
            className={`fixed top-6 right-6 px-5 py-3 rounded-lg shadow-lg z-[9999] text-white text-sm font-medium ${notification.type === "error" ? "bg-red-500" : "bg-green-500"
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
          <CardContent className="space-y-6">
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="glass-ultra h-12 border-border/20 focus:border-primary/30 focus:ring-primary/20"
            />
            <Button
              onClick={handlePredictTraffic}
              disabled={isLoadingPrediction}
              className="h-12 w-full sm:w-auto bg-primary/80 hover:bg-primary/90 text-primary-foreground"
            >
              {isLoadingPrediction ? "Predicting..." : "Predict Traffic"}
            </Button>
          </CardContent>
        </Card>

        {/* 📊 Metrics Cards */}
        {predictionData && predictionData.metrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-strong">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-foreground/80">Historic Model RMSE</h3>
                <p className="text-3xl font-bold text-primary mt-2">{predictionData.metrics.historical_rmse.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card className="glass-strong">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-foreground/80">Fused Model RMSE</h3>
                <p className="text-3xl font-bold text-secondary mt-2">{predictionData.metrics.fused_rmse.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card className="glass-strong">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-foreground/80">% Improvement</h3>
                <p className="text-3xl font-bold text-green-500 mt-2">
                  {predictionData.metrics.improvement.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>
        )}

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

                  {/* Historical Prediction */}
                  <Line
                    type="monotone"
                    dataKey="historical"
                    stroke="var(--chart-1)"
                    strokeWidth={3}
                    dot={false}
                    name="Historical"
                  />

                  {/* Fused Prediction */}
                  <Line
                    type="monotone"
                    dataKey="fused"
                    stroke="var(--chart-2)"
                    strokeWidth={3}
                    dot={false}
                    name="Fused"
                  />

                  {/* Actual Traffic */}
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
