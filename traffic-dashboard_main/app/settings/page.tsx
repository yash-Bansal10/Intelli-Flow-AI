"use client"

import { useState, useEffect } from "react"
import { Settings2, ShieldAlert, AlertTriangle, Activity, Camera, Wifi, Cpu, CarFront, Zap } from "lucide-react"
import { useSimData } from "@/hooks/useSimData"
import { useHardwareHealth } from "@/context/HardwareHealthContext"

const STORAGE_KEY = "intelliflow_settings_junction"

export default function SettingsPage() {
  // Hardware Diagnostics State
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

  const getJunctionName = (id: string) => {
    return simulationData?.spatial_dictionary?.junction_names?.[id] || junctionNames[id] || id
  }

  const junctionIds = simulationData?.junctions ? Object.keys(simulationData.junctions) : []

  // Sync hardware selections to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, selectedJunction)
      localStorage.setItem("intelliflow_selected_region", selectedRegion)
    }
  }, [selectedJunction, selectedRegion])

  // --- Manual Override State ---
  const [overrideRegion, setOverrideRegion] = useState<string>("")
  const [overrideJunction, setOverrideJunction] = useState<string>("")
  const [overrides, setOverrides] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchOverrides = async () => {
      try {
        const url = process.env.NEXT_PUBLIC_SIM_API_URL || "http://localhost:5000"
        const res = await fetch(`${url}/get_overrides`)
        if (res.ok) setOverrides(await res.json())
      } catch (err) {}
    }
    fetchOverrides()
    const interval = setInterval(fetchOverrides, 3000)
    return () => clearInterval(interval)
  }, [])

  const isFixedTimer = overrideJunction ? overrides[overrideJunction] === "fixed_timer" : false

  const toggleOverride = async () => {
    if (!overrideJunction) return
    const newMode = isFixedTimer ? "dqn" : "fixed_timer"
    setOverrides(prev => ({ ...prev, [overrideJunction]: newMode })) // Optimistic UI
    try {
      const url = process.env.NEXT_PUBLIC_SIM_API_URL || "http://localhost:5000"
      const tRes = await fetch(`${url}/get_token`)
      const { token } = await tRes.json()
      await fetch(`${url}/set_override_mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ junction_id: overrideJunction, mode: newMode })
      })
    } catch (err) {}
  }

  // Derivative Lists
  const allJunctionIds = simulationData?.junctions ? Object.keys(simulationData.junctions) : []
  
  // Extract unique regions present in current active agents
  const activeRegions = Array.from(new Set(
    allJunctionIds.map(id => junctionCities[id]).filter(Boolean)
  ))

  // Filter junctions by selected region for Hardware Panel
  const filteredJunctionIds = allJunctionIds.filter(id => {
    if (!selectedRegion) return true // Show all if no region selected (fallback)
    return junctionCities[id] === selectedRegion
  })

  // Filter junctions by selected region for Override Panel
  const filteredOverrideJunctionIds = allJunctionIds.filter(id => {
    if (!overrideRegion) return true
    return junctionCities[id] === overrideRegion
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

      {/* Runtime Controls - Manual Override */}
      <div className={`bg-white border rounded-3xl p-8 shadow-sm relative overflow-hidden transition-all ${isFixedTimer ? 'border-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'border-gray-200'}`}>
        <div className={`absolute inset-0 bg-rose-50/60 transition-opacity duration-500 ${isFixedTimer ? 'opacity-100' : 'opacity-0'}`} />
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl border shadow-sm transition-colors ${isFixedTimer ? 'bg-rose-100 border-rose-200 text-rose-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">AI Manual Override</h3>
                <p className={`text-sm font-medium mt-0.5 ${isFixedTimer ? 'text-rose-600' : 'text-slate-500'}`}>Disconnect specific junctions from AI to use a fixed fallback timer.</p>
              </div>
            </div>
            
            <button
              onClick={toggleOverride}
              className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm border active:scale-[0.97] shrink-0 ${
                isFixedTimer
                  ? 'bg-rose-600 text-white border-rose-500 hover:bg-rose-700 shadow-md'
                  : 'bg-white text-slate-700 border-gray-300 hover:bg-slate-50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={!overrideJunction}
            >
              <AlertTriangle className={`w-4 h-4 ${isFixedTimer ? 'animate-bounce text-rose-200' : 'text-slate-400'}`} />
              {isFixedTimer ? "Restore DQN Agent" : "Engage 60s Fixed Timer"}
            </button>
          </div>
          
          {/* Override Selectors */}
          <div className="flex flex-col md:flex-row items-center gap-4 bg-white/60 p-3 rounded-2xl border border-slate-200 w-full md:w-auto self-start backdrop-blur-sm shadow-sm">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 whitespace-nowrap">Target Region:</label>
              <select
                value={overrideRegion}
                onChange={(e) => { setOverrideRegion(e.target.value); setOverrideJunction("") }}
                className="bg-white border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-rose-500 focus:border-rose-500 p-2 font-bold shadow-sm outline-none w-full md:w-40"
              >
                <option value="">All Regions</option>
                {activeRegions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="w-[1px] h-6 bg-slate-200 hidden md:block" />
            <div className="flex items-center gap-2 w-full md:w-auto">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 whitespace-nowrap">Target Node:</label>
              <select
                value={overrideJunction}
                onChange={(e) => setOverrideJunction(e.target.value)}
                className="bg-white border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-rose-500 focus:border-rose-500 p-2 font-bold shadow-sm outline-none w-full md:w-64 truncate"
              >
                <option value="">Select Intersection to Override</option>
                {filteredOverrideJunctionIds.map(id => (
                  <option key={id} value={id}>{getJunctionName(id)}</option>
                ))}
              </select>
            </div>
          </div>
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
                    {getJunctionName(id)}
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
