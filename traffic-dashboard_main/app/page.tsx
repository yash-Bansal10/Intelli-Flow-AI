"use client"

import { useState } from "react"
import { AlertCircle, Flame, ShieldAlert, Zap } from "lucide-react"
import { SimulationCanvas } from "@/components/SimulationCanvas"
import { JunctionDrawer } from "@/components/JunctionDrawer"
import { ProjectOverview } from "@/components/ProjectOverview"

export default function TrafficOverview() {
  const [isEmergencyActive, setIsEmergencyActive] = useState(false)
  const [selectedJunctionId, setSelectedJunctionId] = useState<string | null>(null)

  return (
    <div className="w-full h-full space-y-6 relative overflow-hidden flex flex-col">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
            Connaught Place Network
          </h1>
          <p className="text-slate-500 mt-1">Live SUMO TraCI Simulation & DQN Telemetry</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsEmergencyActive(!isEmergencyActive)}
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-sm ${
              isEmergencyActive 
                ? 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 shadow-red-200' 
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isEmergencyActive ? <ShieldAlert className="w-5 h-5" /> : <Zap className="w-5 h-5 text-yellow-500" />}
            {isEmergencyActive ? 'Disable Emergency Mode' : 'Simulate Emergency Protocol'}
          </button>
        </div>
      </div>

      {/* Glassmorphism Project Overview Slide */}
      <ProjectOverview />

      {/* Emergency Global Alert Banner */}
      {isEmergencyActive && (
        <div className="w-full bg-red-600 text-white rounded-xl p-4 shadow-lg shadow-red-600/20 flex items-start sm:items-center gap-4 transform transition-all border border-red-500">
          <div className="bg-red-500 p-2 rounded-full hidden sm:block">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold tracking-wide uppercase">Critical Alert: Ambulance Detected</h2>
              <span className="bg-red-800 text-red-100 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">Active</span>
            </div>
            <p className="text-red-100 leading-snug">
              <strong>Source:</strong> Node J1 INMP441 Mic | <strong>YAMNet Audio Siren Conf:</strong> 98.4%
              <br className="sm:hidden" />
              <span className="hidden sm:inline"> | </span>
              <strong>Action:</strong> Overriding DQN phases along corridor J1 → J5 → J3 to force ALL_GREEN.
            </p>
          </div>
          <AlertCircle className="w-8 h-8 text-red-200 animate-pulse shrink-0" />
        </div>
      )}

      {/* Main Interactive Canvas Area */}
      <div className="flex-1 w-full relative group">
        <SimulationCanvas 
          onNodeClick={(id) => setSelectedJunctionId(id)} 
          isEmergencyActive={isEmergencyActive}
        />
        
        {/* Helper overlay text */}
        {!selectedJunctionId && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm border border-slate-200 px-6 py-3 rounded-full shadow-lg text-slate-700 font-medium text-sm flex items-center gap-2 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
            <Zap className="w-4 h-4 text-blue-500" />
            Click any junction node to view edge telemetry
          </div>
        )}
      </div>

      {/* Slide-in Junction Drawer */}
      <JunctionDrawer 
        isOpen={selectedJunctionId !== null} 
        onClose={() => setSelectedJunctionId(null)}
        junctionId={selectedJunctionId} 
      />

    </div>
  )
}