"use client"

import { useState, useEffect } from "react"
import { Camera, Radio, Server, Activity, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Siren, RefreshCw } from "lucide-react"

const HW_API = "http://localhost:8000"

export default function CameraFeed() {
  const [frameB64, setFrameB64] = useState<string | null>(null)
  const [status, setStatus] = useState<any>(null)
  const [isLive, setIsLive] = useState(false)
  
  // Polling mechanism
  useEffect(() => {
    let active = true
    
    const pollHardware = async () => {
      try {
        // 1. Fetch JSON State
        const resStatus = await fetch(`${HW_API}/api/status`)
        if (resStatus.ok) {
          const data = await resStatus.json()
          if (active) setStatus(data)
          if (active) setIsLive(true)
        } else {
          if (active) setIsLive(false)
        }
        
        // 2. Fetch Base64 Annotated YOLO Frame
        const resFeed = await fetch(`${HW_API}/api/yolo_feed`)
        if (resFeed.ok) {
          const feedData = await resFeed.json()
          if (active) setFrameB64(feedData.image_b64)
        }
      } catch (err) {
        if (active) setIsLive(false)
      } finally {
        if (active) setTimeout(pollHardware, 60) // Synchronous dynamic polling prevents HTTP pipeline lag cascade
      }
    }

    pollHardware() // Initial fetch
    
    return () => {
      active = false
    }
  }, [])

  const triggerEmergency = async (arm: string) => {
    try {
      await fetch(`${HW_API}/api/trigger_emergency`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arm })
      })
    } catch (e) { console.error(e) }
  }

  const resetEmergency = async () => {
    try {
      await fetch(`${HW_API}/api/reset_emergency`, { method: "POST" })
    } catch (e) { console.error(e) }
  }

  // Derived Data
  const isCamAlive = status?.camera_alive ?? false
  const phase = status?.esp32_phase || "ALL_RED"
  const qVals = status?.q_values?.length > 0 ? status.q_values.map((v: number) => Math.round(v * 100) / 100).join(', ') : "N/A"
  
  const rawQueues = status?.queues || { north: 0, south: 0, east: 0, west: 0 }
  const totalCongestion = status?.congestion_score || 0
  const evpArm = status?.emergency_arm

  // Approximation logic to create a dynamic 'waiting time' strictly for frontend demonstration mirroring PCU load
  const calcWait = (pcu: number) => {
    if (!pcu || pcu === 0) return "0s"
    return `${Math.floor(pcu * 2.8)}s`
  }

  const laneData = [
    { id: "north", name: "North Bound", count: Math.floor(rawQueues.north || 0), pressure: Math.min(((rawQueues.north || 0)/25)*100, 100), avgWait: calcWait(rawQueues.north), colorClass: "bg-blue-500", icon: <ArrowUp className="w-4 h-4" /> },
    { id: "south", name: "South Bound", count: Math.floor(rawQueues.south || 0), pressure: Math.min(((rawQueues.south || 0)/25)*100, 100), avgWait: calcWait(rawQueues.south), colorClass: "bg-emerald-500", icon: <ArrowDown className="w-4 h-4" /> },
    { id: "east", name: "East Bound",  count: Math.floor(rawQueues.east || 0),  pressure: Math.min(((rawQueues.east || 0)/25)*100, 100),  avgWait: calcWait(rawQueues.east),  colorClass: "bg-amber-500", icon: <ArrowRight className="w-4 h-4" /> },
    { id: "west", name: "West Bound",  count: Math.floor(rawQueues.west || 0),  pressure: Math.min(((rawQueues.west || 0)/25)*100, 100),  avgWait: calcWait(rawQueues.west),  colorClass: "bg-[#8b5cf6]", icon: <ArrowLeft className="w-4 h-4" /> },
  ]

  return (
    <div className="w-full h-full space-y-6 flex flex-col">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Live Bird's-Eye Feed</h1>
          <p className="text-slate-500 mt-1">ESP32-CAM Stream with YOLOv11s Edge Analytics</p>
        </div>
        <div className="flex gap-2">
          <div className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 border shadow-sm transition-colors ${isCamAlive ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>
            <Radio className={`w-4 h-4 ${isCamAlive ? 'animate-pulse' : ''}`} />
            {isCamAlive ? 'Stream Active' : 'Offline'}
          </div>
          <div className="px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold flex items-center gap-2 border border-indigo-200 shadow-sm">
            <Server className="w-4 h-4" />
            {status?.tick_ms ? `${Math.floor(1000/status.tick_ms)} FPS` : '0 FPS'}
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Side: Camera Feed */}
        <div className="xl:col-span-3 rounded-2xl overflow-hidden relative border-2 border-slate-800 bg-black shadow-xl min-h-125 flex items-center justify-center group">
          
          {frameB64 ? (
            <img src={`data:image/jpeg;base64,${frameB64}`} className="absolute inset-0 w-full h-full object-contain bg-black" alt="YOLO Feed" />
          ) : (
            <div className="relative text-center space-y-4">
              <Camera className="w-16 h-16 text-slate-600 mx-auto" />
              <p className="text-slate-500 font-mono text-sm">Searching for ESP32 Hardware Stream on port 8000...</p>
            </div>
          )}

          {/* OSD (On-Screen Display) Overlays */}
          {frameB64 && (
            <>
              <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md border border-white/10 p-4 rounded-xl text-white shadow-2xl">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-bold">Physical Phase Output</div>
                <div className="text-2xl font-black text-sky-400">{phase}</div>
                <div className="text-xs font-mono text-slate-300 mt-2 bg-white/10 px-2 py-1 rounded inline-block">Score: {Math.floor(totalCongestion)}</div>
              </div>

              <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md border border-white/10 p-4 rounded-xl text-white shadow-2xl text-right">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-bold">DQN Matrix</div>
                <div className="text-xl font-bold text-emerald-400">Lat: {status?.tick_ms || 0}ms</div>
                <div className="text-xs font-mono text-slate-300 mt-2 bg-white/10 px-2 py-1 rounded inline-block">Q:[{qVals}]</div>
              </div>
              
              {evpArm && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-rose-600/90 backdrop-blur-md border-2 border-rose-400 px-6 py-3 rounded-full text-white shadow-2xl shadow-rose-600/50 flex items-center gap-3 animate-pulse">
                  <Siren className="w-6 h-6" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-rose-200">Hardware Override</div>
                    <div className="font-black text-lg tracking-wide">{evpArm.toUpperCase()} EVP ACTIVE</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Side: Per-Lane PCU Pressure Panels & Hardware Controls */}
        <div className="xl:col-span-1 space-y-4 flex flex-col h-150 overflow-y-auto pr-2 custom-scrollbar">
          
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 shadow-xl">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3 uppercase tracking-wider">
              <Siren className="w-4 h-4 text-rose-500 animate-pulse" />
              Fault Injector
            </h2>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button onClick={() => triggerEmergency("north")} className="bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 py-2 rounded-lg border border-slate-600 transition-colors">Test North</button>
              <button onClick={() => triggerEmergency("south")} className="bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 py-2 rounded-lg border border-slate-600 transition-colors">Test South</button>
              <button onClick={() => triggerEmergency("east")} className="bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 py-2 rounded-lg border border-slate-600 transition-colors">Test East</button>
              <button onClick={() => triggerEmergency("west")} className="bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 py-2 rounded-lg border border-slate-600 transition-colors">Test West</button>
            </div>
            <button onClick={resetEmergency} className="w-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 shadow-lg shadow-rose-900/40 mt-3">
              <RefreshCw className="w-3 h-3" /> Clear EVP Locks
            </button>
          </div>

          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 pt-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Lane PCU Pressure
          </h2>

          <div className="flex-1 space-y-3">
            {laneData.map((lane, i) => (
              <div key={i} className={`bg-white border rounded-xl p-4 shadow-sm transition-all ${lane.id === evpArm ? 'border-rose-400 shadow-rose-100 ring-2 ring-rose-400' : 'border-slate-200'}`}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2 font-semibold text-slate-700">
                    <span className="p-1.5 bg-slate-100 rounded-md text-slate-500">{lane.icon}</span>
                    {lane.name}
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{lane.count} <span className="text-xs text-slate-400 font-normal">PCU</span></div>
                </div>
                
                <div className="space-y-1 mt-3">
                  <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wide">
                    <span>Congestion Pressure</span>
                    <span className="font-mono text-slate-700">{Math.floor(lane.pressure)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${lane.colorClass}`} 
                      style={{ width: `${lane.pressure}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-xs font-medium">
                  <span className="text-slate-500">Wait Time</span>
                  <span className="text-slate-700">{lane.avgWait}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
