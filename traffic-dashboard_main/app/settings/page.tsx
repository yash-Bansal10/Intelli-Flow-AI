"use client"

import { useState, useEffect } from "react"
import { Settings2, ShieldAlert, AlertTriangle, Activity, Camera, Wifi, Cpu, CarFront, Zap } from "lucide-react"
import { useSimData } from "@/hooks/useSimData"
import { useHardwareHealth } from "@/context/HardwareHealthContext"

const STORAGE_KEY = "intelliflow_settings_junction"

export default function SettingsPage() {
  const [overrideActive, setOverrideActive] = useState(false)

  // Persist selected junction across tab navigation
  const [selectedJunction, setSelectedJunction] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY) || ""
    }
    return ""
  })

  const { data: simulationData } = useSimData()
  const { setHardwareStatus, getHardwareStatus, junctionNames, junctionCities, injectSpatialDictionary } = useHardwareHealth()

  // Day 9: Regional Selection Persistence
  const [selectedRegion, setSelectedRegion] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("intelliflow_selected_region") || ""
    }
    return ""
  })

  // Auto-Inject spatial dictionary when it arrives
  useEffect(() => {
    if (simulationData?.spatial_dictionary) {
      injectSpatialDictionary(simulationData.spatial_dictionary)
    }
  }, [simulationData, injectSpatialDictionary])

  const junctionIds = simulationData?.junctions ? Object.keys(simulationData.junctions) : []

  // Sync selections to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, selectedJunction)
      localStorage.setItem("intelliflow_selected_region", selectedRegion)
    }
  }, [selectedJunction, selectedRegion])

  // Derivative Lists
  const allJunctionIds = simulationData?.junctions ? Object.keys(simulationData.junctions) : []
  
  // Extract unique regions present in current active agents
  const activeRegions = Array.from(new Set(
    allJunctionIds.map(id => junctionCities[id]).filter(Boolean)
  ))

  // Filter junctions by selected region
  const filteredJunctionIds = allJunctionIds.filter(id => {
    if (!selectedRegion) return true // Show all if no region selected (fallback)
    return junctionCities[id] === selectedRegion
  })

  // If simulation restarts and previously selected junction no longer exists, reset
  useEffect(() => {
    if (selectedJunction && allJunctionIds.length > 0 && !allJunctionIds.includes(selectedJunction)) {
      setSelectedJunction("")
    }
  }, [allJunctionIds, selectedJunction])

  // List of hardware metrics matching HealthMonitor
  const hardwareList = [
    { name: "Vision AI (YOLOv11)", icon: <Activity className="w-4 h-4" /> },
    { name: "IP Cameras (RTSP)", icon: <Camera className="w-4 h-4" /> },
    { name: "Intersection Mesh", icon: <Wifi className="w-4 h-4" /> },
    { name: "Sensor Fusion", icon: <Cpu className="w-4 h-4" /> },
    { name: "PCU Calculator", icon: <CarFront className="w-4 h-4" /> },
    { name: "Safety Controller", icon: <ShieldAlert className="w-4 h-4" /> },
  ]

  return (
    <div className="w-full h-full max-w-5xl mx-auto space-y-8 pb-12 mt-2">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">System Settings &amp; Controls</h1>
        <p className="text-slate-500 font-medium">Runtime Overrides and Hardware Fault Injection</p>
      </div>

      {/* Runtime Controls - Manual Override (Full Width) */}
      <div className={`bg-white border rounded-2xl p-6 shadow-sm relative overflow-hidden transition-all ${overrideActive ? 'border-rose-200' : 'border-gray-200'} h-32 flex items-center`}>
        <div className={`absolute inset-0 bg-rose-50/60 transition-opacity duration-500 ${overrideActive ? 'opacity-100 animate-pulse' : 'opacity-0'}`} />
        <div className="relative z-10 flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 rounded-xl border border-rose-200/50 shadow-sm">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Manual Override</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5 max-w-[200px] leading-tight">Bypass DQN logic across the entire edge cluster.</p>
              </div>
            </div>
            <button
              onClick={() => setOverrideActive(!overrideActive)}
              className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm border active:scale-[0.97] ${
                overrideActive
                  ? 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'
                  : 'bg-slate-900 text-white border-transparent hover:bg-slate-800'
              }`}
            >
              <AlertTriangle className={`w-4 h-4 ${overrideActive ? 'animate-bounce' : ''}`} />
              {overrideActive ? "Disengage" : "Engage"}
            </button>
          </div>
        </div>

      {/* Hardware Diagnostic Section */}
      <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
              Hardware Persistence &amp; Fault Injection
            </h2>
            <p className="text-slate-500 mt-1 font-medium text-sm">Target specific edge nodes to simulate real-world hardware degradation.</p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 w-full md:w-auto flex-shrink-0">
            {/* Region Selection */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 whitespace-nowrap">Region:</label>
              <select
                value={selectedRegion}
                onChange={(e) => {
                  setSelectedRegion(e.target.value)
                  setSelectedJunction("") // Reset junction when region changes
                }}
                className="bg-white border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 p-2 font-bold shadow-sm outline-none w-full md:w-40 truncate"
              >
                <option value="">{activeRegions.length === 0 ? "Detecting..." : "All Regions"}</option>
                {activeRegions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            <div className="w-[1px] h-6 bg-slate-200 hidden md:block" />

            {/* Junction selector */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 whitespace-nowrap">Junctions:</label>
              <select
                value={selectedJunction}
                onChange={(e) => setSelectedJunction(e.target.value)}
                className="bg-white border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 p-2 font-bold shadow-sm outline-none w-full md:w-48 truncate"
              >
                <option value="">{filteredJunctionIds.length === 0 ? "No Nodes Found" : "Select Intersection"}</option>
                {filteredJunctionIds.map(id => (
                  <option key={id} value={id}>
                    {junctionNames[id] || id}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {!selectedJunction ? (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
             <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                <Settings2 className="w-8 h-8 text-slate-300" />
             </div>
             <p className="text-slate-400 font-bold">Select a real-world intersection from the menu above to map diagnostics.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hardwareList.map((hw) => {
              const isHealthy = getHardwareStatus(selectedJunction, hw.name)
              return (
                <div key={hw.name} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between hover:border-slate-300 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl shadow-sm border transition-colors ${isHealthy ? 'bg-white border-slate-100 group-hover:bg-emerald-50' : 'bg-rose-50 border-rose-100'}`}>
                      <div className={isHealthy ? 'text-slate-400 group-hover:text-emerald-500' : 'text-rose-500'}>
                        {hw.icon}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm leading-tight">{hw.name}</h4>
                      <p className={`text-[10px] font-bold uppercase mt-1 ${isHealthy ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isHealthy ? "Healthy" : "Maintenance Required"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setHardwareStatus(selectedJunction, hw.name, !isHealthy)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 shadow-inner ${isHealthy ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-300 ease-in-out ${isHealthy ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
