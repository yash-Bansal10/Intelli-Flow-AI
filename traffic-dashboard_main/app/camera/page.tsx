"use client"

import { useState } from "react"
import { Camera, Radio, Server, Activity, ArrowRight, ArrowLeft, ArrowUp, ArrowDown } from "lucide-react"

export default function CameraFeed() {
  // Mock data for the static UI
  const phaseData = {
    current: "NS_GREEN",
    elapsed: "38s",
    dqnAction: "STAY",
    qValues: [2.8, -1.2],
  }

  const laneData = [
    { name: "North Bound", count: 12, pressure: 65, avgWait: "42s", icon: <ArrowUp className="w-4 h-4" /> },
    { name: "South Bound", count: 8, pressure: 40, avgWait: "21s", icon: <ArrowDown className="w-4 h-4" /> },
    { name: "East Bound", count: 24, pressure: 92, avgWait: "115s", icon: <ArrowRight className="w-4 h-4" /> },
    { name: "West Bound", count: 3, pressure: 15, avgWait: "8s", icon: <ArrowLeft className="w-4 h-4" /> },
  ]

  return (
    <div className="w-full h-full space-y-6 flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Live Bird's-Eye Feed</h1>
          <p className="text-slate-500 mt-1">ESP32-CAM Stream with YOLOv8 Analytics</p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold flex items-center gap-2 border border-emerald-200 shadow-sm">
            <Radio className="w-4 h-4 animate-pulse" />
            MJPEG Active
          </div>
          <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold flex items-center gap-2 border border-indigo-200 shadow-sm">
            <Server className="w-4 h-4" />
            24 FPS
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Side: Camera Feed (Takes up 3/4 on large screens) */}
        <div className="xl:col-span-3 rounded-2xl overflow-hidden relative border border-slate-200 bg-slate-900 shadow-xl shadow-slate-200 min-h-[500px] flex items-center justify-center">
          {/* Fallback pattern if camera fails / Mock pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-900 opacity-80" />
          
          <div className="relative text-center space-y-4">
            <Camera className="w-16 h-16 text-slate-600 mx-auto" />
            <p className="text-slate-500 font-mono text-sm">Waiting for real MJPEG stream input...</p>
            {/* The real stream would go here: <img src="http://flask-api/video_feed" className="absolute inset-0 w-full h-full object-cover" /> */}
          </div>

          {/* OSD (On-Screen Display) Overlays */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-lg text-white">
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-1 font-semibold">Phase Status</div>
            <div className="text-xl font-bold text-emerald-400">{phaseData.current}</div>
            <div className="text-sm font-mono text-slate-300">Elapsed: {phaseData.elapsed}</div>
          </div>

          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-lg text-white">
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-1 font-semibold">DQN Engine</div>
            <div className="text-xl font-bold text-indigo-400">Action: {phaseData.dqnAction}</div>
            <div className="text-sm font-mono text-slate-300">Q:[{phaseData.qValues.join(', ')}]</div>
          </div>
          
          {/* Mock Bounding Box */}
          <div className="absolute top-1/3 left-1/4 border-2 border-red-500 w-24 h-24 bg-red-500/10 rounded-sm">
             <div className="bg-red-500 text-white text-[10px] uppercase font-bold px-1 absolute -top-4 -left-[2px]">Car 0.89</div>
          </div>
          <div className="absolute top-1/2 left-1/2 border-2 border-blue-500 w-16 h-40 bg-blue-500/10 rounded-sm">
             <div className="bg-blue-500 text-white text-[10px] uppercase font-bold px-1 absolute -top-4 -left-[2px]">Bus 0.95</div>
          </div>
        </div>

        {/* Right Side: Per-Lane PCU Pressure Panels */}
        <div className="xl:col-span-1 space-y-4 flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Lane PCU Pressure
          </h2>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
            {laneData.map((lane, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2 font-semibold text-slate-700">
                    <span className="p-1.5 bg-slate-100 rounded-md text-slate-500">{lane.icon}</span>
                    {lane.name}
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{lane.count}</div>
                </div>
                
                <div className="space-y-1 mt-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Congestion Pressure</span>
                    <span className="font-mono">{lane.pressure}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-2.5 rounded-full ${
                        lane.pressure > 80 ? 'bg-red-500' : lane.pressure > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} 
                      style={{ width: `${lane.pressure}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-sm">
                  <span className="text-slate-500">Avg Wait</span>
                  <span className="font-semibold text-slate-700">{lane.avgWait}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
