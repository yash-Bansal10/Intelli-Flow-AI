"use client"

import { useState, useEffect } from "react"
import { Settings2, Volume2, ShieldAlert, SlidersHorizontal, AlertTriangle, Save, Activity, Camera, Wifi, Cpu, CarFront, Zap } from "lucide-react"
import { useSimData } from "@/hooks/useSimData"
import { useHardwareHealth } from "@/context/HardwareHealthContext"

export default function SettingsPage() {
  const [qThreshold, setQThreshold] = useState(0.85)
  const [minGreen, setMinGreen] = useState(15)
  const [maxGreen, setMaxGreen] = useState(60)
  const [noiseInjection, setNoiseInjection] = useState(false)
  const [overrideActive, setOverrideActive] = useState(false)
  const [selectedJunction, setSelectedJunction] = useState<string>("")
  
  const { data: simulationData } = useSimData()
  const { setHardwareStatus, getHardwareStatus } = useHardwareHealth()

  const junctionIds = simulationData?.junctions ? Object.keys(simulationData.junctions) : []

  // List of hardware metrics matching HealthMonitor
  const hardwareList = [
    { name: "Vision AI (YOLOv11)", icon: <Activity className="w-4 h-4" /> },
    { name: "IP Cameras (RTSP)", icon: <Camera className="w-4 h-4" /> },
    { name: "Intersection Mesh", icon: <Wifi className="w-4 h-4" /> },
    { name: "Sensor Fusion", icon: <Cpu className="w-4 h-4" /> },
    { name: "PCU Calculator", icon: <CarFront className="w-4 h-4" /> },
    { name: "Safety Controller", icon: <ShieldAlert className="w-4 h-4" /> },
  ]

  const handleSave = () => {
    alert("Configurations saved to Flask Backend successfully.")
  }

  return (
    <div className="w-full h-full max-w-5xl mx-auto space-y-8 pb-12 mt-2">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">System Settings & Tuning</h1>
        <p className="text-slate-500 font-medium">Calibrate Neural Hyperparameters and System Overrides</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Params */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold flex items-center gap-3 text-slate-800">
                <div className="p-2 bg-blue-50 rounded-lg border border-blue-100/50">
                  <SlidersHorizontal className="w-5 h-5 text-blue-600" />
                </div>
                DQN Hyperparameter Tuning
              </h2>
            </div>

            <div className="space-y-10">
              {/* Slider 1 */}
              <div className="group">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Q-Value Selection Threshold</label>
                    <p className="text-xs text-slate-400 font-medium max-w-md">Controls the balance between exploring and exploiting known traffic patterns.</p>
                  </div>
                  <span className="font-mono bg-slate-50 border border-gray-100 px-3 py-1 rounded-lg text-sm font-bold text-blue-600 shadow-sm">
                    {qThreshold.toFixed(2)}
                  </span>
                </div>
                <div className="relative flex items-center h-6">
                  <input 
                    type="range" 
                    min="0.1" 
                    max="1.0" 
                    step="0.05"
                    value={qThreshold} 
                    onChange={(e) => setQThreshold(parseFloat(e.target.value))} 
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all hover:bg-slate-200"
                  />
                </div>
              </div>

              {/* Slider 2 */}
              <div className="group">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Minimum Green Phase Duration (s)</label>
                    <p className="text-xs text-slate-400 font-medium">The mandatory minimum window for vehicle throughput per cycle.</p>
                  </div>
                  <span className="font-mono bg-slate-50 border border-gray-100 px-3 py-1 rounded-lg text-sm font-bold text-blue-600 shadow-sm">
                    {minGreen}s
                  </span>
                </div>
                <div className="relative flex items-center h-6">
                  <input 
                    type="range" 
                    min="5" 
                    max="30" 
                    step="1"
                    value={minGreen} 
                    onChange={(e) => setMinGreen(parseInt(e.target.value))} 
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all hover:bg-slate-200"
                  />
                </div>
              </div>

              {/* Slider 3 */}
              <div className="group">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">Maximum Phase Timeout (s)</label>
                    <p className="text-xs text-slate-400 font-medium">Upper limit before deterministic safety override forces a transition.</p>
                  </div>
                  <span className="font-mono bg-slate-50 border border-gray-100 px-3 py-1 rounded-lg text-sm font-bold text-blue-600 shadow-sm">
                    {maxGreen}s
                  </span>
                </div>
                <div className="relative flex items-center h-6">
                  <input 
                    type="range" 
                    min="30" 
                    max="120" 
                    step="5"
                    value={maxGreen} 
                    onChange={(e) => setMaxGreen(parseInt(e.target.value))} 
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all hover:bg-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-100 flex justify-end">
              <button 
                onClick={handleSave} 
                className="bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2.5 transition-all shadow-md hover:shadow-blue-200"
              >
                 <Save className="w-5 h-5 text-blue-100" /> Save & Push Configuration
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Overrides */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <h2 className="text-xl font-bold flex items-center gap-3 text-slate-800 mb-8">
              <div className="p-2 bg-sky-50 rounded-lg border border-sky-100/50">
                <Settings2 className="w-5 h-5 text-sky-500" />
              </div>
              Runtime Controls
            </h2>

            {/* Noise Injection Toggle */}
            <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-gray-100 mb-6 hover:border-blue-200 transition-all group">
              <div className="flex gap-4">
                <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:bg-blue-50 transition-colors">
                  <Volume2 className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Noise Injection</h3>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5 leading-tight max-w-[140px]">Simulate sensor errors to stress-test robustness.</p>
                </div>
              </div>
              <button 
                onClick={() => setNoiseInjection(!noiseInjection)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 shadow-inner ${noiseInjection ? 'bg-blue-500' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-300 ease-in-out ${noiseInjection ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Manual Override Section */}
            <div className="p-6 bg-slate-50/50 rounded-2xl border border-gray-100 mt-8 relative overflow-hidden group">
               <div className={`absolute inset-0 bg-rose-50/60 transition-opacity duration-500 ${overrideActive ? 'opacity-100 animate-pulse' : 'opacity-0'}`}></div>
               <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-rose-100 rounded-lg border border-rose-200/50 shadow-sm">
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 translate-x-1">Manual Override</h3>
                </div>
                <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed">
                  Triggers an immediate cryptographic bypass of the DQN model logic across the entire edge cluster.
                </p>
                <button 
                  onClick={() => setOverrideActive(!overrideActive)}
                  className={`w-full py-4 rounded-xl font-bold flex justify-center items-center gap-2.5 transition-all shadow-sm border active:scale-[0.97] ${
                    overrideActive 
                      ? 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50 shadow-rose-100' 
                      : 'bg-slate-900 text-white border-transparent hover:bg-slate-800 shadow-slate-200'
                  }`}
                >
                  <AlertTriangle className={`w-5 h-5 ${overrideActive ? 'animate-bounce' : ''}`} />
                  {overrideActive ? "Disengage Override" : "Engage Protocol"}
                </button>
               </div>
            </div>

          </div>
        </div>

      </div>

      {/* Hardware Diagnostic Section */}
      <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
              Hardware Persistence & Fault Injection
            </h2>
            <p className="text-slate-500 mt-1 font-medium text-sm">Target specific edge nodes to simulate real-world hardware degradation.</p>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <label className="text-xs font-bold text-slate-500 uppercase ml-2">Active Node:</label>
            <select 
              value={selectedJunction}
              onChange={(e) => setSelectedJunction(e.target.value)}
              className="bg-white border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 font-bold shadow-sm outline-none"
            >
              <option value="">{junctionIds.length === 0 ? "Waiting for simulation..." : "Select a Junction"}</option>
              {junctionIds.map(id => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          </div>
        </div>

        {!selectedJunction ? (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
             <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                <Settings2 className="w-8 h-8 text-slate-300" />
             </div>
             <p className="text-slate-400 font-bold">Select a node from the map list above to perform diagnostics.</p>
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
