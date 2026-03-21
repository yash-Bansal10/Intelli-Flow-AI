"use client"

import { useState, useEffect, useRef } from "react"
import { Shield, ShieldAlert, Key, Activity, Loader, Terminal, StopCircle } from "lucide-react"

export default function SecurityPage() {
  const [hmacLogs, setHmacLogs] = useState<{ id: number, time: string, valid: boolean, source: string, msg: string }[]>([])
  const [isWatchdogActive, setIsWatchdogActive] = useState(true)
  const [agentStatus, setAgentStatus] = useState("Operational")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Generate mock HMAC logs
  useEffect(() => {
    let idCounter = 0
    const interval = setInterval(() => {
      idCounter++
      const newLog = {
        id: idCounter,
        time: new Date().toISOString().split('T')[1].slice(0, 12),
        valid: true,
        source: `Agent_${Math.floor(Math.random() * 4) + 1}`,
        msg: `HMAC-SHA256 vector [pressure_diff: ${(Math.random() * 0.5).toFixed(2)}] verified.`
      }
      setHmacLogs(prev => [...prev.slice(-49), newLog]) // Keep last 50
    }, 1500)
    
    return () => clearInterval(interval)
  }, [])

  // Auto-scroll logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [hmacLogs])

  const simulateSpoof = () => {
    const fakeLog = {
      id: Date.now(),
      time: new Date().toISOString().split('T')[1].slice(0, 12),
      valid: false,
      source: "UNKNOWN_IP: 192.168.1.105",
      msg: "HMAC SIGNATURE MISMATCH. Rejecting spoofed pressure vector."
    }
    setHmacLogs(prev => [...prev, fakeLog])
  }

  const simulateCrash = () => {
    setAgentStatus("CRITICAL FAILURE - DQN OFFLINE")
    setTimeout(() => {
      setAgentStatus("FALLBACK ACTIVATED: FIXED TIMER MODE")
    }, 2000)
  }

  return (
    <div className="w-full h-full xl:h-[calc(100vh-6rem)] grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6 mt-2">
      
      {/* Left Column: Security Auth & HMAC */}
      <div className="space-y-6 flex flex-col h-full">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Security & Zero-Trust</h1>
          <p className="text-slate-500 mt-1 font-medium">Inter-agent TLS & HMAC Auth Monitoring</p>
        </div>

        {/* JWT Auth Status */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-4 mb-5">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600 shadow-sm border border-blue-100/50">
               <Key className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900">JWT Authentication Layer</h2>
              <p className="text-sm text-slate-500">Node-to-node cryptographic verification</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-gray-100 p-4 rounded-xl text-sm transition-colors hover:bg-slate-100/80">
              <span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1.5">Status</span>
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-500" /> Secure & Signed
              </span>
            </div>
            <div className="bg-slate-50 border border-gray-100 p-4 rounded-xl text-sm transition-colors hover:bg-slate-100/80">
              <span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1.5">Rotation Policy</span>
              <span className="font-bold text-slate-800">Every 15 mins</span>
            </div>
          </div>
        </div>

        {/* HMAC Log Area */}
        <div className="h-[340px] shrink-0 bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm flex flex-col hover:shadow-md transition-shadow duration-300">
          <div className="bg-slate-50/80 p-4 border-b border-gray-100 flex justify-between items-center backdrop-blur-sm z-10">
            <div className="flex items-center gap-2.5 font-semibold text-slate-800 text-sm">
              <div className="p-1.5 bg-white shadow-sm border border-gray-200 rounded-md">
                <Terminal className="w-4 h-4 text-slate-600" /> 
              </div>
              Live HMAC Signature Log
            </div>
            <button 
              onClick={simulateSpoof}
              className="bg-white hover:bg-slate-100 text-slate-600 border border-gray-300 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
            >
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              Simulate Spoof
            </button>
          </div>
          
          <div ref={scrollRef} className="flex-1 p-4 bg-slate-50/50 overflow-y-auto space-y-2.5 font-mono text-[13px] leading-relaxed relative">
            {hmacLogs.length === 0 && (
               <div className="absolute inset-0 flex items-center justify-center text-slate-400">Waiting for logs...</div>
            )}
            {hmacLogs.map(log => (
              <div 
                key={log.id} 
                className={`flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 p-3 rounded-xl transition-all ${
                  log.valid 
                    ? 'bg-white border border-gray-200 shadow-sm hover:border-blue-200' 
                    : 'bg-rose-50 border border-rose-200 text-rose-800 shadow-sm relative overflow-hidden'
                }`}
              >
                {!log.valid && <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>}
                
                <span className="text-slate-400 shrink-0 font-medium">[{log.time}]</span>
                <span className={`shrink-0 font-bold ${log.valid ? 'text-blue-600' : 'text-rose-700'}`}>
                  {log.source}
                </span>
                <span className={`${log.valid ? 'text-slate-600' : 'text-rose-600 font-semibold'}`}>
                  {log.msg}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Watchdog */}
      <div className="space-y-6 flex flex-col h-full">
        <div>
           {/* Invisible spacer to match title alignment of left col */}
           <h1 className="text-3xl font-extrabold tracking-tight text-transparent select-none hidden lg:block">_</h1>
           <p className="text-transparent mt-1 select-none hidden lg:block">_</p>
        </div>

        {/* Watchdog Panel */}
        <div className="bg-white border text-slate-800 border-gray-200 rounded-2xl p-6 shadow-sm flex-1 flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl shadow-sm border ${isWatchdogActive ? 'bg-blue-50 text-blue-600 border-blue-100/50' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-900">System Watchdog</h2>
                <p className="text-sm text-slate-500">Autonomous integrity monitoring</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 rounded-lg border border-gray-100">
               <span className="relative flex h-2.5 w-2.5">
                 <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isWatchdogActive ? 'bg-emerald-400' : 'hidden'}`}></span>
                 <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isWatchdogActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
               </span>
               <span className="text-xs font-bold uppercase tracking-wider text-slate-600">{isWatchdogActive ? "Active" : "Inactive"}</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-8 border border-gray-100 flex-1 flex flex-col items-center justify-center text-center mb-6 shadow-inner transition-colors">
            {agentStatus.includes('FALLBACK') ? (
              <div className="space-y-4 max-w-sm">
                 <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2 border-4 border-amber-50 shadow-sm">
                   <ShieldAlert className="w-10 h-10 text-amber-500 animate-pulse" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900">{agentStatus}</h3>
                 <p className="text-slate-500 text-sm leading-relaxed">
                   Watchdog detected an unrecoverable DQN crash. Safety timers are currently governing all junction red/green phases.
                 </p>
              </div>
            ) : agentStatus.includes('CRITICAL') ? (
              <div className="space-y-4 max-w-sm">
                 <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-2 border-4 border-rose-50 shadow-sm">
                   <StopCircle className="w-10 h-10 text-rose-600 animate-pulse" />
                 </div>
                 <h3 className="text-xl font-bold text-rose-600">{agentStatus}</h3>
                 <p className="text-slate-500 text-sm">Attempting to restart AI engine and re-establish node connections...</p>
              </div>
            ) : (
              <div className="space-y-4 max-w-sm">
                 <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2 border-4 border-emerald-50/50 shadow-sm">
                   <Loader className="w-10 h-10 text-emerald-500 animate-spin-slow" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900">System Fully Operational</h3>
                 <p className="text-slate-500 text-sm leading-relaxed">All Neural Network Agents responding normally with zero signature mismatches.</p>
              </div>
            )}
          </div>

          <button 
            onClick={simulateCrash}
            disabled={agentStatus !== "Operational"}
            className="w-full py-3.5 rounded-xl font-semibold text-white bg-rose-500 hover:bg-rose-600 shadow-sm hover:shadow-rose-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            CRITICAL: Force DQN Crash Simulation
          </button>
        </div>
      </div>
    </div>
  )
}
