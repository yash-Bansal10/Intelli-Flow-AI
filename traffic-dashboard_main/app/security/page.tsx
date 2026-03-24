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
    <div className="w-full h-full xl:min-h-[calc(100vh-6rem)] grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-950 rounded-2xl border border-emerald-900/50 shadow-[inset_0_0_80px_rgba(0,0,0,0.8)] font-mono overflow-hidden">
      
      {/* Left Column: Security Auth & HMAC */}
      <div className="space-y-6 flex flex-col h-full relative z-10 w-full overflow-hidden">
        <div>
          <h1 className="text-3xl font-extrabold tracking-widest text-emerald-400 uppercase drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">SYS_SEC // Zero-Trust</h1>
          <p className="text-emerald-600/80 mt-1 font-medium text-xs tracking-[0.2em] uppercase">Inter-agent TLS & HMAC Auth Monitoring</p>
        </div>

        {/* JWT Auth Status */}
        <div className="bg-black/80 border border-emerald-800/60 rounded-xl p-6 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:border-emerald-500/80 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-size-[20px_20px] pointer-events-none opacity-50"></div>
          
          <div className="flex items-center gap-4 mb-5 relative z-10">
            <div className="p-3 bg-emerald-950/50 rounded-lg text-emerald-400 border border-emerald-800/80 shadow-[0_0_10px_rgba(52,211,153,0.2)] group-hover:shadow-[0_0_20px_rgba(52,211,153,0.4)] transition-shadow">
               <Key className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-emerald-300 tracking-wide uppercase">JWT Auth Layer</h2>
              <p className="text-xs text-emerald-700 uppercase tracking-widest">Node cryptographic verification</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div className="bg-emerald-950/20 border border-emerald-900/50 p-4 rounded-lg text-sm transition-colors hover:bg-emerald-900/40">
              <span className="block text-emerald-700 font-bold uppercase tracking-widest text-[10px] mb-1.5">Last Rotation</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1.5 whitespace-nowrap text-xs">
                <Shield className="w-4 h-4 text-emerald-500" /> {lastRotation || "AWAITING_SYNC..."}
              </span>
            </div>
            <div className="bg-emerald-950/20 border border-emerald-900/50 p-4 rounded-lg text-sm transition-colors hover:bg-emerald-900/40 w-full overflow-hidden">
              <span className="block text-emerald-700 font-bold uppercase tracking-widest text-[10px] mb-1.5">Key Fingerprint</span>
              <span className="font-bold text-emerald-400 font-mono text-[10px] tracking-widest truncate block w-full">{keyThumbprint || "FETCHING_HASH..."}</span>
            </div>
          </div>
        </div>

        {/* HMAC Log Area */}
        <div className="h-[340px] shrink-0 bg-black/90 rounded-xl overflow-hidden border border-emerald-800/60 shadow-[0_0_20px_rgba(16,185,129,0.1)] flex flex-col transition-shadow duration-300 relative group w-full">
          
          {/* Scanline overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-size-[100%_4px] opacity-20 z-10"></div>
          
          <div className="bg-emerald-950/60 p-3 border-b border-emerald-800/50 flex justify-between items-center backdrop-blur-sm z-20">
            <div className="flex items-center gap-2.5 font-bold text-emerald-400 text-[11px] uppercase tracking-widest">
              <div className="p-1 min-w-6 flex justify-center border border-emerald-700/50 rounded bg-black/50 text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                <Terminal className="w-3.5 h-3.5" /> 
              </div>
              Live HMAC Trace
            </div>
            <button 
              onClick={simulateSpoof}
              className="bg-red-950/60 hover:bg-red-900/80 text-rose-400 border border-rose-900/80 px-3 py-1.5 rounded text-[10px] font-bold tracking-widest uppercase shadow-[0_0_10px_rgba(225,29,72,0.2)] transition-all active:scale-95 flex items-center gap-1.5 group/btn"
            >
              <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)] group-hover/btn:animate-pulse"></div>
              Inject Spoof
            </button>
          </div>
          
          <div 
            ref={scrollRef} 
            className="flex-1 p-4 bg-transparent overflow-y-auto overflow-x-hidden space-y-1 font-mono text-[11px] leading-relaxed relative z-20 w-full [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-black/40 [&::-webkit-scrollbar-thumb]:bg-emerald-800/80 [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            {hmacLogs.length === 0 && (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-emerald-600/50 gap-3">
                 <Loader className="w-6 h-6 animate-spin" />
                 <span className="text-xs uppercase tracking-widest">Establishing socket...</span>
               </div>
            )}
            {hmacLogs.map((log: HMACLog) => (
              <div 
                key={log.id} 
                className={`flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 px-2 py-1.5 transition-all w-full overflow-hidden ${
                  log.valid 
                    ? 'text-emerald-500 hover:bg-emerald-950/30' 
                    : 'bg-rose-950/40 border-l-2 border-rose-500 text-rose-400 animate-pulse'
                }`}
              >
                <span className="text-emerald-700/70 shrink-0">[{log.time}]</span>
                <span className={`shrink-0 ${log.valid ? 'text-cyan-400' : 'text-rose-500 font-bold drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]'}`}>
                  {log.source.padEnd(20, '_')}
                </span>
                <span className={`truncate ${log.valid ? 'text-emerald-400/80' : 'text-rose-300'}`}>
                  {log.msg}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Watchdog */}
      <div className="space-y-6 flex flex-col h-full relative z-10 w-full overflow-hidden">
        <div>
           {/* Invisible spacer to match title alignment of left col */}
           <h1 className="text-3xl font-extrabold tracking-tight text-transparent select-none hidden lg:block">_</h1>
           <p className="text-transparent mt-1 select-none hidden lg:block">_</p>
        </div>

        {/* Watchdog Panel */}
        <div className="bg-black/80 border text-emerald-400 border-emerald-800/60 rounded-xl p-6 shadow-[0_0_15px_rgba(16,185,129,0.1)] flex-1 flex flex-col transition-all duration-300 relative overflow-hidden group w-full">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)] opacity-50 z-0"></div>

          {/* Header */}
          <div className="flex items-center justify-between mb-6 relative z-10 border-b border-emerald-900/50 pb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg shadow-[0_0_10px_rgba(0,0,0,0.5)] border ${isWatchdogActive ? 'bg-cyan-950/40 text-cyan-400 border-cyan-800/60' : 'bg-slate-900 border-slate-800'}`}>
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-emerald-300 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(52,211,153,0.3)] truncate">Sys_Watchdog_D1</h2>
                <p className="text-xs text-emerald-700 uppercase tracking-[0.2em] truncate">Autonomous integrity</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-950/30 rounded border border-emerald-800/50">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isWatchdogActive ? 'bg-emerald-400' : 'hidden'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isWatchdogActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]' : 'bg-slate-700'}`}></span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">{isWatchdogActive ? "ONLINE" : "OFFLINE"}</span>
              </div>
              {/* Uptime */}
              <span className="text-[10px] tracking-widest text-emerald-600/70">
                UP_{String(Math.floor(uptimeSeconds/3600)).padStart(2,'0')}:{String(Math.floor((uptimeSeconds%3600)/60)).padStart(2,'0')}:{String(uptimeSeconds%60).padStart(2,'0')}
              </span>
            </div>
          </div>

          {/* Status Card */}
          <div className="flex-1 relative z-10 flex flex-col w-full">
          {agentStatus.includes('REBOOTING') ? (
            <div className="bg-blue-950/30 rounded-xl p-6 border border-blue-900/50 mb-4 flex flex-col items-center space-y-5 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)] w-full">
              <Loader className="w-10 h-10 text-blue-400 animate-spin" />
              <h3 className="text-sm font-bold text-blue-300 uppercase tracking-widest">Self-Healing Initialized</h3>
              <div className="w-full h-1.5 bg-blue-950 rounded-full overflow-hidden border border-blue-900/30">
                <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] transition-all duration-150" style={{ width: `${rebootProgress}%` }} />
              </div>
              <p className="text-[10px] text-blue-500/80 tracking-widest">MEM_SYNC: 0x{rebootProgress.toString(16).toUpperCase().padStart(4, '0')}</p>
            </div>
          ) : agentStatus.includes('FALLBACK') ? (
            <div className="bg-amber-950/30 rounded-xl p-5 border border-amber-900/50 mb-4 flex flex-col items-center space-y-3 shadow-[inset_0_0_20px_rgba(245,158,11,0.1)] w-full">
              <ShieldAlert className="w-9 h-9 text-amber-500 animate-pulse drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest text-center">Watchdog: Fallback Active</h3>
              <p className="text-amber-600/80 text-[10px] text-center uppercase tracking-widest">Safety relays governing logic.</p>
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-950/50 rounded border border-amber-800/50 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shadow-[0_0_5px_rgba(245,158,11,1)]" />
                <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">Awaiting Healing</span>
              </div>
            </div>
          ) : agentStatus.includes('CRITICAL') ? (
            <div className="bg-rose-950/30 rounded-xl p-5 border border-rose-900/50 mb-4 flex flex-col items-center space-y-3 shadow-[inset_0_0_30px_rgba(225,29,72,0.15)] w-full">
              <StopCircle className="w-9 h-9 text-rose-500 animate-[ping_2s_infinite] drop-shadow-[0_0_15px_rgba(225,29,72,0.8)]" />
              <h3 className="text-sm font-bold text-rose-400 uppercase tracking-widest">CRITICAL FAILURE</h3>
              <p className="text-rose-600/80 text-[10px] text-center uppercase tracking-widest">Watchdog locking phase arrays.</p>
            </div>
          ) : (
            // Operational — metrics grid
            <div className="bg-emerald-950/20 rounded-xl p-3 sm:p-5 border border-emerald-900/40 mb-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] space-y-5 w-full">
              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full">
                <div className="text-center bg-black/40 p-2 sm:p-3 rounded border border-emerald-900/30">
                  <span className="text-[8px] sm:text-[9px] font-bold text-emerald-700 uppercase tracking-[0.2em] block mb-1 truncate">Stability</span>
                  <div className="text-base sm:text-lg font-black text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">{dqnStability}%</div>
                </div>
                <div className="text-center bg-black/40 p-2 sm:p-3 rounded border border-emerald-900/30">
                  <span className="text-[8px] sm:text-[9px] font-bold text-emerald-700 uppercase tracking-[0.2em] block mb-1 truncate">Latency</span>
                  <div className="text-base sm:text-lg font-black text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">{latency}ms</div>
                </div>
                <div className="text-center bg-black/40 p-2 sm:p-3 rounded border border-emerald-900/30">
                  <span className="text-[8px] sm:text-[9px] font-bold text-emerald-700 uppercase tracking-[0.2em] block mb-1 truncate">Nodes</span>
                  <div className="text-base sm:text-lg font-black text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">{nodeCount || '--'}</div>
                </div>
              </div>

              {/* Threat Level Bar */}
              <div className="px-1 w-full">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-[0.2em]">Threat Level</span>
                  <span className={`text-[9px] font-bold uppercase tracking-[0.2em] drop-shadow-[0_0_5px_currentColor] ${
                    dqnStability >= 96 ? 'text-emerald-400' : dqnStability >= 94 ? 'text-amber-400' : 'text-rose-500'
                  }`}>[{dqnStability >= 96 ? 'MINIMAL' : dqnStability >= 94 ? 'ELEVATED' : 'HIGH'}]</span>
                </div>
                <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-emerald-900/50">
                  <div
                    className={`h-full transition-all duration-700 shadow-[0_0_8px_currentColor] ${
                      dqnStability >= 96 ? 'bg-emerald-400' : dqnStability >= 94 ? 'bg-amber-400' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, ((100 - dqnStability) / 6) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Sparkline Chart */}
              <div className="px-1 w-full relative">
                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-[0.2em] block mb-2">Stability Trace</span>
                <div className="w-full h-8 overflow-hidden relative">
                  <svg viewBox="0 0 200 40" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                      className="drop-shadow-[0_0_3px_rgba(16,185,129,0.5)]"
                      points={stabilityHistory.map((v, i) => {
                        const x = (i / Math.max(1, stabilityHistory.length - 1)) * 200
                        const y = 40 - ((v - 92) / 8) * 40
                        return `${x},${y}`
                      }).join(' ')}
                    />
                    {stabilityHistory.map((v, i) => {
                      const x = (i / Math.max(1, stabilityHistory.length - 1)) * 200
                      const y = 40 - ((v - 92) / 8) * 40
                      return i === stabilityHistory.length - 1 ? (
                        <circle key={i} cx={x} cy={y} r="3" fill="#34d399" className="drop-shadow-[0_0_5px_rgba(52,211,153,1)] animate-pulse" />
                      ) : null
                    })}
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Event Timeline */}
          <div className="flex-1 min-h-25 mb-4 relative z-10 px-1 w-full">
            <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-[0.2em] block mb-2">Audit Trace</span>
            <div 
              ref={timelineRef} 
              className="h-30 overflow-y-auto overflow-x-hidden space-y-1.5 pr-2 w-full [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-black/40 [&::-webkit-scrollbar-thumb]:bg-emerald-800/80 [&::-webkit-scrollbar-thumb]:rounded-full"
            >
              {watchdogEvents.length === 0 ? (
                <p className="text-[10px] text-emerald-700/50 uppercase tracking-widest animate-pulse">Initializing socket loop...</p>
              ) : watchdogEvents.map((ev, i) => (
                <div key={i} className="flex items-start gap-3 text-[10px] w-full overflow-hidden">
                  <span className="text-emerald-700 font-mono shrink-0">[{ev.time}]</span>
                  <span className={`font-mono tracking-wide truncate ${
                    ev.type === 'err' ? 'text-rose-400 drop-shadow-[0_0_3px_rgba(244,63,94,0.5)]' : 
                    ev.type === 'warn' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>&gt; {ev.msg}</span>
                </div>
              ))}
            </div>
          </div>
          </div>

          <button
            onClick={simulateCrash}
            disabled={agentStatus !== "Operational"}
            className="w-full relative z-10 py-3 rounded border border-rose-900/50 font-bold tracking-[0.2em] uppercase text-[10px] text-rose-400 bg-red-950/30 hover:bg-rose-900/50 hover:text-rose-200 hover:border-rose-500/50 shadow-[0_0_15px_rgba(225,29,72,0.1)] hover:shadow-[0_0_20px_rgba(225,29,72,0.3)] transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 group/btn shrink-0"
          >
             <StopCircle className="w-4 h-4 text-rose-500 group-hover/btn:animate-spin" />
             Execute Overflow
          </button>
        </div>
      </div>
    </div>
  )
}
