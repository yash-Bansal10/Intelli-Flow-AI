"use client"

import { useState } from "react"
import { Settings2, Volume2, ShieldAlert, SlidersHorizontal, AlertTriangle, Save } from "lucide-react"

export default function SettingsPage() {
  const [qThreshold, setQThreshold] = useState(0.85)
  const [minGreen, setMinGreen] = useState(15)
  const [maxGreen, setMaxGreen] = useState(60)
  const [noiseInjection, setNoiseInjection] = useState(false)
  const [overrideActive, setOverrideActive] = useState(false)

  const handleSave = () => {
    alert("Configurations saved to Flask Backend successfully.")
  }

  return (
    <div className="w-full h-full max-w-5xl mx-auto space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Settings & Tuning</h1>
        <p className="text-slate-500 mt-1">Adjust DQN Hyperparameters and Manual Controls</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Params */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border text-slate-700 border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-800">
              <SlidersHorizontal className="w-5 h-5 text-indigo-500" />
              DQN Hyperparameter Tuning
            </h2>

            <div className="space-y-8">
              {/* Slider 1 */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="font-semibold">Q-Value Selection Threshold</label>
                  <span className="font-mono bg-slate-100 px-2 py-1 rounded text-sm text-slate-600">{qThreshold.toFixed(2)}</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1.0" 
                  step="0.05"
                  value={qThreshold} 
                  onChange={(e) => setQThreshold(parseFloat(e.target.value))} 
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <p className="text-xs text-slate-500 mt-2">Adjusts the exploration vs exploitation greediness during live inference.</p>
              </div>

              {/* Slider 2 */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="font-semibold">Minimum Green Phase Duration (s)</label>
                  <span className="font-mono bg-slate-100 px-2 py-1 rounded text-sm text-slate-600">{minGreen}s</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="30" 
                  step="1"
                  value={minGreen} 
                  onChange={(e) => setMinGreen(parseInt(e.target.value))} 
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Slider 3 */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="font-semibold">Maximum Phase Timeout (s)</label>
                  <span className="font-mono bg-slate-100 px-2 py-1 rounded text-sm text-slate-600">{maxGreen}s</span>
                </div>
                <input 
                  type="range" 
                  min="30" 
                  max="120" 
                  step="5"
                  value={maxGreen} 
                  onChange={(e) => setMaxGreen(parseInt(e.target.value))} 
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <p className="text-xs text-slate-500 mt-2">Maximum duration before safety override forces a phase transition to prevent starvation.</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
              <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm">
                 <Save className="w-4 h-4" /> Save Configuration
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Overrides */}
        <div className="space-y-6">
          <div className="bg-white border text-slate-700 border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 mb-6">
              <Settings2 className="w-5 h-5 text-amber-500" />
              Runtime Controls
            </h2>

            {/* Noise Injection Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4 hover:border-slate-300 transition-colors">
              <div>
                <h3 className="font-bold flex items-center gap-2">
                   <Volume2 className="w-4 h-4 text-slate-400" /> Noise Injection
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Simulate sensor errors (ghost vehicles) to test AI robustness.</p>
              </div>
              <button 
                onClick={() => setNoiseInjection(!noiseInjection)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${noiseInjection ? 'bg-amber-500' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${noiseInjection ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Manual Override Button */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mt-6 relative overflow-hidden group">
               {overrideActive && <div className="absolute inset-0 bg-red-100/50 animate-pulse pointer-events-none"></div>}
               <div className="relative z-10">
                <h3 className="font-bold flex items-center gap-2 text-red-600 mb-2">
                    <ShieldAlert className="w-4 h-4" /> Manual Override Mode
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Bypasses the DQN model completely across all edge nodes. Fall back to local intersection controller hardcoded logic.
                </p>
                <button 
                  onClick={() => setOverrideActive(!overrideActive)}
                  className={`w-full py-3 rounded-lg font-bold flex justify-center items-center gap-2 transition-all shadow-sm border ${
                    overrideActive 
                      ? 'bg-white text-red-600 border-red-200 hover:bg-red-50' 
                      : 'bg-red-600 text-white border-transparent hover:bg-red-700 shadow-red-600/20'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                  {overrideActive ? "Disable Override" : "Engage Manual Override"}
                </button>
               </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
