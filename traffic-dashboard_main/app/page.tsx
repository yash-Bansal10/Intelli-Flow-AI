"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb, AlertCircle } from "lucide-react"

// --- INTERFACES ---
interface TrafficData {
  congestion_score: number
  current_phase: string
  queues: {
    north: number
    south: number
    west: number
    east: number
  }
  simulation_time: number
}

interface ConnectionStatus {
  connected: boolean
  reconnectAttempts: number
  usingMockData: boolean
}

interface TrafficLightState {
  north: "red" | "yellow" | "green"
  south: "red" | "yellow" | "green"
  west: "red" | "yellow" | "green"
  east: "red" | "yellow" | "green"
}

// --- SUB-COMPONENTS ---

const TrafficLight = ({ state }: { state: "red" | "yellow" | "green" }) => {
  return (
    <div className="flex flex-col gap-1">
      <div
        className={`w-3 h-3 rounded-full border ${
          state === "red" ? "bg-red-500 shadow-red-500/50 shadow-lg" : "bg-red-900/30"
        }`}
      />
      <div
        className={`w-3 h-3 rounded-full border ${
          state === "yellow" ? "bg-yellow-500 shadow-yellow-500/50 shadow-lg" : "bg-yellow-900/30"
        }`}
      />
      <div
        className={`w-3 h-3 rounded-full border ${
          state === "green" ? "bg-green-500 shadow-green-500/50 shadow-lg" : "bg-green-900/30"
        }`}
      />
    </div>
  )
}

const QueueBar = ({
  length,
  color,
  direction,
}: { length: number; color: string; direction: "north" | "south" | "west" | "east" }) => {
  const maxLength = 100
  const percentage = Math.min((length / maxLength) * 100, 100)

  const getBarStyle = () => {
    switch (direction) {
      case "north":
      case "south":
        return { height: `${percentage}%`, width: "8px" }
      case "west":
      case "east":
        return { width: `${percentage}%`, height: "8px" }
    }
  }

  const getContainerStyle = () => {
    switch (direction) {
      case "north":
        return "flex flex-col justify-end items-center h-full"
      case "south":
        return "flex flex-col justify-start items-center h-full"
      case "west":
        return "flex flex-row justify-end items-center w-full"
      case "east":
        return "flex flex-row justify-start items-center w-full"
    }
  }

  return (
    <div className={getContainerStyle()}>
      <div className={`${color} transition-all duration-500 ease-out rounded-full`} style={getBarStyle()} />
    </div>
  )
}

const ConnectionStatusBadge = ({ status }: { status: ConnectionStatus }) => {
  const getStatusInfo = () => {
    if (status.usingMockData) {
      return {
        className: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
        dotClass: "bg-blue-300 animate-pulse",
        text: "Demo Mode",
      }
    }
    if (status.connected) {
      return {
        className: "bg-green-500/20 text-green-300 border border-green-500/30",
        dotClass: "bg-green-300 animate-pulse",
        text: "Connected",
      }
    }
    return {
      className: "bg-red-500/20 text-red-300 border border-red-500/30",
      dotClass: "bg-red-300",
      text: "Disconnected",
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.className}`}
    >
      <div className={`w-2 h-2 rounded-full ${statusInfo.dotClass}`} />
      {statusInfo.text}
    </div>
  )
}

const TrafficIntersection = ({
  trafficData,
  lightStates,
}: { trafficData: TrafficData; lightStates: TrafficLightState }) => {
  return (
    <div className="w-full aspect-square max-w-md mx-auto">
      <div className="grid grid-cols-3 grid-rows-3 h-full gap-1">
        {/* Top row */}
        <div className="bg-slate-700/50 rounded"></div>
        <div className="bg-slate-800/50 relative flex flex-col">
          <div className="flex-1 flex justify-center items-start pt-2">
            <TrafficLight state={lightStates.north} />
          </div>
          <div className="flex-1">
            <QueueBar length={trafficData.queues.north} color="bg-sky-400" direction="north" />
          </div>
        </div>
        <div className="bg-slate-700/50 rounded"></div>

        {/* Middle row */}
        <div className="bg-slate-800/50 relative flex flex-row">
          <div className="flex-1 flex justify-start items-center pl-2">
            <TrafficLight state={lightStates.west} />
          </div>
          <div className="flex-1">
            <QueueBar length={trafficData.queues.west} color="bg-violet-400" direction="west" />
          </div>
        </div>
        <div className="bg-slate-700/80 relative flex items-center justify-center rounded-md">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-0.5 border-t-2 border-dashed border-yellow-400/50"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-full w-0.5 border-l-2 border-dashed border-yellow-400/50"></div>
          </div>
        </div>
        <div className="bg-slate-800/50 relative flex flex-row">
          <div className="flex-1">
            <QueueBar length={trafficData.queues.east} color="bg-amber-400" direction="east" />
          </div>
          <div className="flex-1 flex justify-end items-center pr-2">
            <TrafficLight state={lightStates.east} />
          </div>
        </div>

        {/* Bottom row */}
        <div className="bg-slate-700/50 rounded"></div>
        <div className="bg-slate-800/50 relative flex flex-col">
          <div className="flex-1">
            <QueueBar length={trafficData.queues.south} color="bg-emerald-400" direction="south" />
          </div>
          <div className="flex-1 flex justify-center items-end pb-2">
            <TrafficLight state={lightStates.south} />
          </div>
        </div>
        <div className="bg-slate-700/50 rounded"></div>
      </div>
    </div>
  )
}

const AnimatedNumber = ({ value, color }: { value: number; color: string }) => {
  return <div className={`text-4xl font-mono font-bold ${color} transition-all duration-300`}>{value}</div>
}


const CongestionScoreCard = ({ score }: { score: number }) => {
  const getScoreColor = (score: number) => {
    if (score < -100) return "text-green-400"
    if (score < 100) return "text-amber-400"
    return "text-red-400"
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-slate-400">Live Congestion Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-4xl font-mono font-bold ${getScoreColor(score)} transition-all duration-300`}>
          {score}
        </div>
      </CardContent>
    </Card>
  )
}

// --- MAIN DASHBOARD COMPONENT ---

export default function TrafficDashboard() {
  const [isMounted, setIsMounted] = useState(false)
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    reconnectAttempts: 0,
    usingMockData: true,
  })

  const [congestionHistory, setCongestionHistory] = useState<number[]>([])
  const apiRetryIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const mockDataIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [lightStates, setLightStates] = useState<TrafficLightState>({
    north: "red",
    south: "red",
    west: "red",
    east: "red",
  })

  const API_URL = process.env.NEXT_PUBLIC_TRAFFIC_API_URL || "http://127.0.0.1:5000/live_data"

  const getLightStatesFromPhase = (phase: string): TrafficLightState => {
    const phaseLower = phase.toLowerCase()
    if (phaseLower.includes("north-south")) {
      const color = phaseLower.includes("yellow") ? "yellow" : "green"
      return { north: color, south: color, west: "red", east: "red" }
    }
    if (phaseLower.includes("east-west")) {
      const color = phaseLower.includes("yellow") ? "yellow" : "green"
      return { north: "red", south: "red", west: color, east: color }
    }
    return { north: "red", south: "red", west: "red", east: "red" }
  }

  const processDataUpdate = (data: TrafficData) => {
    setTrafficData(data)
    setLightStates(getLightStatesFromPhase(data.current_phase))
    setCongestionHistory((prev) => [...prev, data.congestion_score].slice(-60))
  }

  const generateMockData = (): TrafficData => {
    const phases = ["North-South Green", "East-West Green", "North-South Yellow", "East-West Yellow"]
    return {
      congestion_score: Math.floor(Math.random() * 200) - 100,
      current_phase: phases[Math.floor(Math.random() * phases.length)],
      queues: {
        north: Math.floor(Math.random() * 40) + 5,
        south: Math.floor(Math.random() * 40) + 5,
        west: Math.floor(Math.random() * 40) + 5,
        east: Math.floor(Math.random() * 40) + 5,
      },
      simulation_time: (trafficData?.simulation_time || 0) + 2,
    }
  }

  const startMockData = () => {
    if (mockDataIntervalRef.current) return
    console.log("[Intelli-Flow] Starting mock data simulation")
    setConnectionStatus({ connected: false, reconnectAttempts: 0, usingMockData: true })
    mockDataIntervalRef.current = setInterval(() => processDataUpdate(generateMockData()), 2000)
  }

  const stopMockData = () => {
    if (mockDataIntervalRef.current) {
      clearInterval(mockDataIntervalRef.current)
      mockDataIntervalRef.current = null
    }
  }

  useEffect(() => {
    setIsMounted(true)

    const tryApiConnection = async () => {
      try {
        const response = await fetch(API_URL, { signal: AbortSignal.timeout(3000) })
        if (!response.ok) throw new Error("Server responded negatively")
        
        const data: TrafficData = await response.json()
        console.log("[Intelli-Flow] API connection successful")
        
        stopMockData()
        processDataUpdate(data)
        setConnectionStatus({ connected: true, reconnectAttempts: 0, usingMockData: false })

        // Clear the retry interval and start polling
        if (apiRetryIntervalRef.current) clearInterval(apiRetryIntervalRef.current)
        
        const pollInterval = setInterval(async () => {
          try {
            const pollResponse = await fetch(API_URL, { signal: AbortSignal.timeout(2000) })
            if (pollResponse.ok) {
              processDataUpdate(await pollResponse.json())
            } else {
              throw new Error("Polling failed")
            }
          } catch (pollError) {
            console.error("[Intelli-Flow] Lost API connection, reverting to demo mode.", pollError)
            clearInterval(pollInterval)
            startMockData()
          }
        }, 2000)

        return () => clearInterval(pollInterval)

      } catch (error) {
        console.warn("[Intelli-Flow] API connection failed. Starting in demo mode.", error)
        startMockData()
      }
    }

    tryApiConnection()

    // Setup a retry mechanism if still in demo mode
    apiRetryIntervalRef.current = setInterval(() => {
      if (!connectionStatus.connected) {
        console.log("[Intelli-Flow] Retrying API connection...")
        tryApiConnection()
      }
    }, 10000)


    return () => {
      stopMockData()
      if (apiRetryIntervalRef.current) clearInterval(apiRetryIntervalRef.current)
    }
  }, [])

  const formatSimulationTime = (seconds: number) => {
    if (typeof seconds !== 'number' || isNaN(seconds)) return "00:00:00";
    const h = Math.floor(seconds / 3600).toString().padStart(2, "0")
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0")
    const s = Math.floor(seconds % 60).toString().padStart(2, "0")
    return `${h}:${m}:${s}`
  }

  if (!isMounted || !trafficData) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
            <div className="text-2xl font-mono text-blue-400 animate-pulse">Initializing Intelli-Flow AI...</div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-100 mb-2 drop-shadow-2xl">
            <span className="bg-gradient-to-r from-sky-300 via-blue-400 to-emerald-300 bg-clip-text text-transparent">
              Intelli-Flow AI
            </span>
          </h1>
          <p className="text-slate-300 text-lg mb-4 font-medium">Live Traffic Command Center</p>
          <ConnectionStatusBadge status={connectionStatus} />

          {connectionStatus.usingMockData && (
            <div className="mt-4 max-w-2xl mx-auto">
              <div className="bg-blue-500/20 border border-blue-400/40 rounded-lg p-4 backdrop-blur-sm shadow-lg shadow-blue-500/10">
                <div className="flex items-center gap-2 text-blue-200 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Demo Mode Active</span>
                </div>
                <p className="text-sm text-blue-100">
                  Could not connect to the live AI. Displaying simulated data.
                  <br />
                  Ensure the AI server is running and accessible at{" "}
                  <code className="bg-blue-800/40 px-2 py-1 rounded border border-blue-600/30">
                    {API_URL}
                  </code>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
          {/* Left Column: Intersection */}
          <div className="lg:col-span-3 flex items-center justify-center">
            <TrafficIntersection trafficData={trafficData} lightStates={lightStates} />
          </div>

          {/* Right Column: Metrics */}
          <div className="lg:col-span-2 space-y-6">
            <CongestionScoreCard score={trafficData.congestion_score} />
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-slate-800/60 border-slate-600/50 hover:border-sky-500/50 transition-all duration-300 backdrop-blur-sm shadow-xl shadow-slate-900/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-300 font-medium">North Queue</CardTitle>
                </CardHeader>
                <CardContent>
                  <AnimatedNumber value={trafficData.queues.north} color="text-sky-300 drop-shadow-lg" />
                </CardContent>
              </Card>
              <Card className="bg-slate-800/60 border-slate-600/50 hover:border-emerald-500/50 transition-all duration-300 backdrop-blur-sm shadow-xl shadow-slate-900/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-300 font-medium">South Queue</CardTitle>
                </CardHeader>
                <CardContent>
                  <AnimatedNumber value={trafficData.queues.south} color="text-emerald-300 drop-shadow-lg" />
                </CardContent>
              </Card>
              <Card className="bg-slate-800/60 border-slate-600/50 hover:border-violet-500/50 transition-all duration-300 backdrop-blur-sm shadow-xl shadow-slate-900/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-300 font-medium">West Queue</CardTitle>
                </CardHeader>
                <CardContent>
                  <AnimatedNumber value={trafficData.queues.west} color="text-violet-300 drop-shadow-lg" />
                </CardContent>
              </Card>
              <Card className="bg-slate-800/60 border-slate-600/50 hover:border-amber-500/50 transition-all duration-300 backdrop-blur-sm shadow-xl shadow-slate-900/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-300 font-medium">East Queue</CardTitle>
                </CardHeader>
                <CardContent>
                  <AnimatedNumber value={trafficData.queues.east} color="text-amber-300 drop-shadow-lg" />
                </CardContent>
              </Card>
            </div>
            <Card className="bg-slate-800/60 border-slate-600/50 hover:border-slate-500/50 transition-all duration-300 backdrop-blur-sm shadow-xl shadow-slate-900/20">
              <CardHeader>
                <CardTitle className="text-sm text-slate-300 font-medium">Simulation Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-mono font-bold text-slate-100 drop-shadow-lg">
                  {formatSimulationTime(trafficData.simulation_time)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/60 border-slate-600/50 hover:border-slate-500/50 transition-all duration-300 backdrop-blur-sm shadow-xl shadow-slate-900/20">
              <CardHeader>
                <CardTitle className="text-slate-300 font-medium">Current Phase</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold text-slate-100 drop-shadow-lg">{trafficData.current_phase}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Full-width Analysis Section */}
        <div>
          <Card className="bg-slate-800/60 border-slate-600/50 hover:border-slate-500/50 transition-all duration-300 backdrop-blur-sm shadow-xl shadow-slate-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-300 font-medium">
                <Lightbulb className="w-5 h-5 text-yellow-300 drop-shadow-lg" />
                Traffic Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trafficData.congestion_score > 100 ? (
                <p className="text-red-300 italic text-lg leading-relaxed drop-shadow-lg">
                  High congestion detected! System is under heavy load.
                </p>
              ) : trafficData.congestion_score > -100 ? (
                <p className="text-amber-300 italic text-lg leading-relaxed drop-shadow-lg">
                  Moderate traffic levels. System is managing flow efficiently.
                </p>
              ) : (
                <p className="text-green-300 italic text-lg leading-relaxed drop-shadow-lg">
                  Traffic flowing smoothly. Optimal conditions detected.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}