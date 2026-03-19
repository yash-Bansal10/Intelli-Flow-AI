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
    <div className="w-full h-full xl:h-[calc(100vh-6rem)] grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
      
      {/* Left Column: Security Auth & HMAC */}
      <div className="space-y-6 flex flex-col h-full">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Security & Zero-Trust</h1>
          <p className="text-slate-500 mt-1">Inter-agent TLS / HMAC Auth monitoring</p>
        </div>

        {/* JWT Auth Status */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
               <Key className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">JWT Authentication Layer</h2>
              <p className="text-sm text-slate-500">Node-to-node token verification</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm">
              <span className="block text-slate-500 font-medium mb-1">Status</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <Shield className="w-4 h-4" /> Secure & Signed
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm">
              <span className="block text-slate-500 font-medium mb-1">Rotation</span>
              <span className="font-bold text-slate-700">Every 15 mins</span>
            </div>
          </div>
        </div>

        {/* HMAC Log Area */}
        <div className="flex-1 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-xl flex flex-col min-h-[300px]">
          <div className="bg-slate-800 p-3 border-b border-slate-700 flex justify-between items-center text-slate-300">
            <div className="flex items-center gap-2 font-mono text-sm">
              <Terminal className="w-4 h-4" /> Live HMAC Signature Log
            </div>
            <button 
              onClick={simulateSpoof}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 px-3 py-1 rounded text-xs font-bold uppercase transition-colors"
            >
              Simulate Spoofed Vector
            </button>
          </div>
          
          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-2 font-mono text-xs">
            {hmacLogs.map(log => (
              <div key={log.id} className={`flex items-start gap-4 p-2 rounded ${log.valid ? 'hover:bg-slate-800' : 'bg-red-950/50 border border-red-900'}`}>
                <span className="text-slate-500 shrink-0">[{log.time}]</span>
                <span className={log.valid ? 'text-blue-400' : 'text-red-400 font-bold shrink-0'}>{log.source}</span>
                <span className={log.valid ? 'text-emerald-400/80' : 'text-red-300'}>{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Watchdog */}
      <div className="space-y-6 flex flex-col h-full">
        <div>
           {/* Invisible spacer just to match title alignment of left col */}
           <h1 className="text-3xl font-bold tracking-tight text-transparent select-none hidden lg:block">_</h1>
           <p className="text-transparent mt-1 select-none hidden lg:block">_</p>
        </div>

        {/* Watchdog Panel */}
        <div className="bg-white border text-slate-800 border-slate-200 rounded-xl p-6 shadow-sm flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isWatchdogActive ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-400'}`}>
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-lg">System Watchdog</h2>
                <p className="text-sm text-slate-500">Autonomous integrity monitoring</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <span className="relative flex h-3 w-3">
                 <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isWatchdogActive ? 'bg-emerald-400' : 'hidden'}`}></span>
                 <span className={`relative inline-flex rounded-full h-3 w-3 ${isWatchdogActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
               </span>
               <span className="text-sm font-semibold uppercase tracking-wider text-slate-500">{isWatchdogActive ? "Active" : "Inactive"}</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 flex-1 grid grid-cols-1 place-items-center mb-6 text-center">
            {agentStatus.includes('FALLBACK') ? (
              <div className="space-y-4">
                 <ShieldAlert className="w-16 h-16 text-amber-500 mx-auto animate-pulse" />
                 <h3 className="text-xl font-bold text-amber-600">{agentStatus}</h3>
                 <p className="text-slate-500 text-sm max-w-sm">
                   Watchdog detected an unrecoverable DQN crash. Safety timers are currently governing all junction red/green phases.
                 </p>
              </div>
            ) : agentStatus.includes('CRITICAL') ? (
              <div className="space-y-4">
                 <StopCircle className="w-16 h-16 text-red-500 mx-auto" />
                 <h3 className="text-xl font-bold text-red-600 animate-pulse">{agentStatus}</h3>
                 <p className="text-slate-500 text-sm">Attempting to restart AI engine...</p>
              </div>
            ) : (
              <div className="space-y-4">
                 <Loader className="w-16 h-16 text-emerald-500 mx-auto animate-spin-slow" />
                 <h3 className="text-xl font-bold text-emerald-600 text-emerald-600">{agentStatus}</h3>
                 <p className="text-slate-500 text-sm">All Neural Network Agents responding normally.</p>
              </div>
            )}
          </div>

          <button 
            onClick={simulateCrash}
            disabled={agentStatus !== "Operational"}
            className="w-full py-4 rounded-xl font-bold text-white bg-slate-800 hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            CRITICAL: Force DQN Crash Simulation
          </button>
        </div>
      </div>
    </div>
  )
}
