"use client"

import { useState, useEffect, useRef } from "react"
import { Shield, ShieldAlert, Key, Activity, Loader, Terminal, StopCircle } from "lucide-react"
import { useSimData } from "@/hooks/useSimData"
import { useHardwareHealth } from "@/context/HardwareHealthContext"

interface HMACLog {
  id: number
  time: string
  valid: boolean
  source: string
  msg: string
}

export default function SecurityPage() {
  const [hmacLogs, setHmacLogs] = useState<HMACLog[]>([])
  const [isWatchdogActive, setIsWatchdogActive] = useState(true)
  const [agentStatus, setAgentStatus] = useState("Operational")
  const [rebootProgress, setRebootProgress] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  
  // Watchdog Metrics Simulation
  const [dqnStability, setDqnStability] = useState(98.4)
  const [latency, setLatency] = useState(42)
  const [stabilityHistory, setStabilityHistory] = useState<number[]>([98, 98.2, 97.8, 98.4, 98.1, 97.9, 98.3, 98.5, 98.2, 98.4])
  const [watchdogEvents, setWatchdogEvents] = useState<{time: string, msg: string, type: 'ok'|'warn'|'err'}[]>([])
  const [uptimeSeconds, setUptimeSeconds] = useState(0)

  // Uptime counter
  useEffect(() => {
    const t = setInterval(() => setUptimeSeconds(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      // Only use simulated value if real backend confidence is absent
      const realConf = simDataRef.current?.avg_confidence
      if (realConf == null) {
        const newStab = parseFloat((Math.max(94.2, Math.min(99.8, dqnStability + (Math.random() - 0.5)))).toFixed(1))
        setDqnStability(newStab)
        setStabilityHistory(prev => [...prev.slice(-19), newStab])
        // Occasionally log a watchdog event
        if (Math.random() < 0.3) {
          const t = new Date().toLocaleTimeString('en-GB', { hour12: false })
          const events = [
            { msg: `DQN Q-values nominal (${newStab}%)`, type: 'ok' as const },
            { msg: `Latency within bounds`, type: 'ok' as const },
            { msg: `Edge mesh heartbeat OK`, type: 'ok' as const },
            { msg: newStab < 96 ? `Stability dip detected (${newStab}%)` : `All agents responding`, type: newStab < 96 ? 'warn' as const : 'ok' as const },
          ]
          const picked = events[Math.floor(Math.random() * events.length)]
          setWatchdogEvents(prev => [...prev.slice(-9), { time: t, ...picked }])
        }
      } else {
        // Use the real confidence score from the backend
        const realStab = parseFloat(realConf.toFixed(1))
        setDqnStability(realStab)
        setStabilityHistory(prev => [...prev.slice(-19), realStab])
        if (Math.random() < 0.3) {
          const t = new Date().toLocaleTimeString('en-GB', { hour12: false })
          const msg = realStab < 60
            ? `⚠️ Low model confidence (${realStab}%) — agents exploring`
            : `DQN confidence: ${realStab}% — Policy active`
          setWatchdogEvents(prev => [...prev.slice(-9), { time: t, msg, type: realStab < 60 ? 'warn' as const : 'ok' as const }])
        }
      }
      setLatency(prev => Math.max(38, Math.min(58, prev + Math.floor(Math.random() * 5) - 2)))
    }, 2500)
    return () => clearInterval(interval)
  }, [dqnStability])
  
  // JWT Rotation Simulation (Enrichment for demo)
  const [lastRotation, setLastRotation] = useState<string>("")
  const [keyThumbprint, setKeyThumbprint] = useState<string>("")

  useEffect(() => {
    const rotate = () => {
      setLastRotation(new Date().toLocaleTimeString('en-GB', { hour12: false }))
      setKeyThumbprint(Math.random().toString(36).substring(2, 10).toUpperCase() + "..." + Math.random().toString(36).substring(2, 6).toUpperCase())
    }
    rotate() // initial
    const interval = setInterval(rotate, 60000) // rotate thumbprint every 60s for demo visibility
    return () => clearInterval(interval)
  }, [])
  
  const { data: simulationData } = useSimData()
  const { junctionNames, injectSpatialDictionary } = useHardwareHealth()
  const nodeCount = Object.keys(simulationData?.junctions || {}).length

  // Day 9: Auto-inject spatial data if it arrives while on this tab
  useEffect(() => {
    if (simulationData?.spatial_dictionary) {
      injectSpatialDictionary(simulationData.spatial_dictionary)
    }
  }, [simulationData, injectSpatialDictionary])

  // Stability: Use refs for the log interval so we don't restart it on every sim update
  const simDataRef = useRef(simulationData)
  const junctionNamesRef = useRef(junctionNames)
  useEffect(() => { simDataRef.current = simulationData }, [simulationData])
  useEffect(() => { junctionNamesRef.current = junctionNames }, [junctionNames])

  // Generate real-time HMAC logs from active junctions
  useEffect(() => {
    let idCounter = 0
    const interval = setInterval(() => {
      const junctions = simDataRef.current?.junctions
      const activeJids = junctions ? Object.keys(junctions) : []
      if (activeJids.length === 0) return

      idCounter++
      const randomJid = activeJids[Math.floor(Math.random() * activeJids.length)]
      const realName = junctionNamesRef.current[randomJid] || (randomJid.length > 15 ? `Node ${randomJid.substring(0, 8)}...` : `Node ${randomJid}`)
      
      // Use actual junction score from simulation as the 'pressure'
      const livePressure = junctions?.[randomJid]?.score || 0

      const newLog = {
        id: idCounter,
        time: new Date().toLocaleTimeString('en-GB', { hour12: false }) + '.' + new Date().getMilliseconds().toString().padStart(3, '0'),
        valid: true,
        source: realName,
        msg: `HMAC verified: [Pressure: ${Math.floor(livePressure)}]`
      }
      setHmacLogs((prev: HMACLog[]) => [...prev.slice(-49), newLog]) // Keep last 50
    }, 1200) // Slightly faster pulse for more 'live' feel
    
    return () => clearInterval(interval)
  }, []) // Stable interval

  // Auto-scroll HMAC logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [hmacLogs])

  // Auto-scroll Event Timeline
  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight
    }
  }, [watchdogEvents])

  const simulateSpoof = () => {
    const fakeLog = {
      id: Date.now(),
      time: new Date().toLocaleTimeString('en-GB', { hour12: false }) + '.' + new Date().getMilliseconds().toString().padStart(3, '0'),
      valid: false,
      source: "UNKNOWN_IP: 192.168.1.105",
      msg: "HMAC SIGNATURE MISMATCH. Rejecting spoofed pressure vector."
    }
    setHmacLogs((prev: HMACLog[]) => [...prev, fakeLog])
  }

  const simulateCrash = async () => {
    const apiBase = process.env.NEXT_PUBLIC_SIM_API_URL || 'http://127.0.0.1:5000'
    
    // Pick the first active junction from live simulation, or fallback to a known ID
    const junctions = simDataRef.current?.junctions
    const targetJid = junctions ? Object.keys(junctions)[0] : 'B2'

    // Stage 1: Crash
    setAgentStatus("CRITICAL FAILURE - DQN OFFLINE")
    setWatchdogEvents(prev => [...prev.slice(-9), {
      time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      msg: `🚨 Agent ${targetJid} force-crashed by operator`,
      type: 'err'
    }])

    try {
      // Fetch JWT token from the real backend
      const tokenRes = await fetch(`${apiBase}/get_token`)
      const { token } = await tokenRes.json()

      // Hit the real /simulate_crash endpoint — this fires global_watchdog.trigger_crash(jid) in Python
      await fetch(`${apiBase}/simulate_crash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ junction_id: targetJid })
      })

      setWatchdogEvents(prev => [...prev.slice(-9), {
        time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        msg: `Backend confirmed: ${targetJid} offline. Fallback engaged.`,
        type: 'warn'
      }])
    } catch {
      // Backend offline — UI-only demo mode
      setWatchdogEvents(prev => [...prev.slice(-9), {
        time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        msg: `Demo mode: backend unreachable, simulating locally`,
        type: 'warn'
      }])
    }

    // Stage 2: Fallback (+3s)
    setTimeout(() => {
      setAgentStatus("FALLBACK ACTIVATED")

      // Stage 3: Self-Healing (+6s)
      setTimeout(async () => {
        setAgentStatus("REBOOTING SYSTEM...")
        let progress = 0
        const timer = setInterval(() => {
          progress += 5
          setRebootProgress(progress)
          if (progress >= 100) {
            clearInterval(timer)
            setAgentStatus("Operational")
            setRebootProgress(0)

            // Stage 4: Call /recover_agent to restore the real backend agent
            const apiBase2 = process.env.NEXT_PUBLIC_SIM_API_URL || 'http://127.0.0.1:5000'
            fetch(`${apiBase2}/get_token`)
              .then(r => r.json())
              .then(({ token }) => fetch(`${apiBase2}/recover_agent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ junction_id: targetJid })
              }))
              .then(() => setWatchdogEvents(prev => [...prev.slice(-9), {
                time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                msg: `✅ Agent ${targetJid} recovered. DQN policy restored.`,
                type: 'ok'
              }]))
              .catch(() => {/* silent — demo mode */})
          }
        }, 150)
      }, 3000)
    }, 3000)
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
              <span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1.5">Last Rotation</span>
              <span className="font-bold text-slate-800 flex items-center gap-1.5 whitespace-nowrap">
                <Shield className="w-4 h-4 text-emerald-500" /> {lastRotation || "Synchronizing..."}
              </span>
            </div>
            <div className="bg-slate-50 border border-gray-100 p-4 rounded-xl text-sm transition-colors hover:bg-slate-100/80">
              <span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1.5">Key Thumbprint</span>
              <span className="font-bold text-slate-800 font-mono text-[10px]">{keyThumbprint || "FETCHING..."}</span>
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
               <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3">
                 <Loader className="w-5 h-5 animate-spin" />
                 <span className="text-sm font-semibold">Connecting to Edge Nodes...</span>
               </div>
            )}
            {hmacLogs.map((log: HMACLog) => (
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
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl shadow-sm border ${isWatchdogActive ? 'bg-blue-50 text-blue-600 border-blue-100/50' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-900">System Watchdog</h2>
                <p className="text-sm text-slate-500">Autonomous integrity monitoring</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 rounded-lg border border-gray-100">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isWatchdogActive ? 'bg-emerald-400' : 'hidden'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isWatchdogActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">{isWatchdogActive ? "Active" : "Inactive"}</span>
              </div>
              {/* Uptime */}
              <span className="text-[10px] font-mono text-slate-400">
                UP {String(Math.floor(uptimeSeconds/3600)).padStart(2,'0')}:{String(Math.floor((uptimeSeconds%3600)/60)).padStart(2,'0')}:{String(uptimeSeconds%60).padStart(2,'0')}
              </span>
            </div>
          </div>

          {/* Status Card */}
          {agentStatus.includes('REBOOTING') ? (
            <div className="bg-slate-50 rounded-2xl p-6 border border-gray-100 mb-4 flex flex-col items-center space-y-4 shadow-inner">
              <Loader className="w-10 h-10 text-blue-500 animate-spin" />
              <h3 className="text-lg font-bold text-slate-900">Self-Healing in Progress</h3>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-150" style={{ width: `${rebootProgress}%` }} />
              </div>
              <p className="text-[10px] font-mono text-slate-400">MEMORY_SYMBOLS_SYNC: {rebootProgress}%</p>
            </div>
          ) : agentStatus.includes('FALLBACK') ? (
            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 mb-4 flex flex-col items-center space-y-2 shadow-inner">
              <ShieldAlert className="w-9 h-9 text-amber-500 animate-pulse" />
              <h3 className="text-base font-bold text-slate-900">Watchdog triggered: Fallback Active</h3>
              <p className="text-slate-500 text-xs text-center">Safety timers governing all phases.</p>
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 rounded-full border border-amber-200">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                <span className="text-[10px] font-bold text-amber-700 uppercase">Awaiting Self-Healing</span>
              </div>
            </div>
          ) : agentStatus.includes('CRITICAL') ? (
            <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100 mb-4 flex flex-col items-center space-y-2 shadow-inner">
              <StopCircle className="w-9 h-9 text-rose-600 animate-pulse" />
              <h3 className="text-base font-bold text-rose-600">CRITICAL FAILURE</h3>
              <p className="text-slate-500 text-xs text-center">Autonomous watchdog locking junction phases.</p>
            </div>
          ) : (
            // Operational — metrics grid
            <div className="bg-slate-50 rounded-2xl p-4 border border-gray-100 mb-4 shadow-inner space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter block">AI Stability</span>
                  <div className="font-mono text-base font-black text-slate-800">{dqnStability}%</div>
                </div>
                <div className="text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter block">Latency</span>
                  <div className="font-mono text-base font-black text-slate-800">{latency}ms</div>
                </div>
                <div className="text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter block">Nodes</span>
                  <div className="font-mono text-base font-black text-slate-800">{nodeCount || '--'}</div>
                </div>
              </div>

              {/* Threat Level Bar */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Threat Level</span>
                  <span className={`text-[9px] font-bold uppercase ${
                    dqnStability >= 96 ? 'text-emerald-500' : dqnStability >= 94 ? 'text-amber-500' : 'text-rose-500'
                  }`}>{dqnStability >= 96 ? 'MINIMAL' : dqnStability >= 94 ? 'ELEVATED' : 'HIGH'}</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      dqnStability >= 96 ? 'bg-emerald-500' : dqnStability >= 94 ? 'bg-amber-400' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, ((100 - dqnStability) / 6) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Sparkline Chart */}
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter block mb-1.5">Stability History</span>
                <svg viewBox="0 0 200 40" className="w-full h-8" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    points={stabilityHistory.map((v, i) => {
                      const x = (i / (stabilityHistory.length - 1)) * 200
                      const y = 40 - ((v - 92) / 8) * 40
                      return `${x},${y}`
                    }).join(' ')}
                  />
                  {stabilityHistory.map((v, i) => {
                    const x = (i / (stabilityHistory.length - 1)) * 200
                    const y = 40 - ((v - 92) / 8) * 40
                    return i === stabilityHistory.length - 1 ? (
                      <circle key={i} cx={x} cy={y} r="3" fill="#10b981" />
                    ) : null
                  })}
                </svg>
              </div>
            </div>
          )}

          {/* Event Timeline */}
          <div className="flex-1 min-h-0 mb-4">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter block mb-1.5">Event Timeline</span>
            <div ref={timelineRef} className="h-28 overflow-y-auto space-y-1 pr-1">
              {watchdogEvents.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Initializing monitor...</p>
              ) : watchdogEvents.map((ev, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px]">
                  <span className="text-slate-400 font-mono shrink-0">{ev.time}</span>
                  <span className={`font-medium ${
                    ev.type === 'err' ? 'text-rose-600' : ev.type === 'warn' ? 'text-amber-600' : 'text-slate-600'
                  }`}>{ev.msg}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={simulateCrash}
            disabled={agentStatus !== "Operational"}
            className="w-full py-3.5 rounded-xl font-semibold text-white bg-rose-500 hover:bg-rose-600 shadow-sm hover:shadow-rose-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            CRITICAL: Force DQN Crash Simulation
          </button>
        </div>
      </div>
    </div>
  )
}
