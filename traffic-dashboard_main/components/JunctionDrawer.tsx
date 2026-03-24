"use client"

import { X, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, MapPin, ArrowRightLeft } from "lucide-react"
import { HealthMonitor } from "./HealthMonitor"
import { motion, AnimatePresence } from "framer-motion"
import { NumberTicker } from "./NumberTicker"
import { useSimData } from "@/hooks/useSimData"
import { useHardwareHealth } from "@/context/HardwareHealthContext"
import { useState, useEffect } from "react"

interface JunctionDrawerProps {
  isOpen: boolean
  onClose: () => void
  junctionId: string | null
}

export function JunctionDrawer({ isOpen, onClose, junctionId }: JunctionDrawerProps) {
  const { data: simulationData } = useSimData()
  const { junctionNames, resolveJunctionName } = useHardwareHealth()
  const [showArrows, setShowArrows] = useState(true)
  const [elapsedLocal, setElapsedLocal] = useState(0)
  
  // Dynamically extract the specific junction data from the live stream
  const junctionData = junctionId && simulationData?.junctions ? simulationData.junctions[junctionId] : null
  const simTime = simulationData?.simulation_time || 0

  const simNames = simulationData?.spatial_dictionary?.junction_names || {}
  const locName = junctionId ? (simNames[junctionId] || junctionNames[junctionId] || "Localizing AI Cluster...") : "Select a Junction"

  // Sync the local ticker to the hard-truth Python Agent timestamp
  useEffect(() => {
    if (junctionData?.time_in_phase !== undefined) {
      setElapsedLocal(junctionData.time_in_phase)
    }
  }, [junctionData?.time_in_phase])

  // Fire a smooth 1x Real-Time local ticker between standard 5s network polls
  useEffect(() => {
    if (!isOpen) return
    const interval = setInterval(() => {
      setElapsedLocal(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [isOpen])

  const queues = junctionData?.queues || []
  
  // Real-time Queue Array mapped to visual CSS Progress Bars with physical geography labels
  const queueData = [
    { name: 'North', queue: queues[0] || 0, max: 30, color: 'bg-blue-500' },
    { name: 'South', queue: queues[1] || 0, max: 30, color: 'bg-emerald-500' },
    { name: 'East', queue: queues[2] || 0, max: 30, color: 'bg-amber-500' },
    { name: 'West', queue: queues[3] || 0, max: 30, color: 'bg-violet-500' },
  ]

  const phaseName = junctionData?.phase || "Waiting..."
  const aiScore = junctionData?.score || 0
  
  const isNS = phaseName.includes("NS")
  const isEW = phaseName.includes("EW")
  const isRed = phaseName.includes("RED")

  // Nominatim OpenStreetMap Reverse Geocoding (Centralized)
  useEffect(() => {
    if (junctionId && junctionData?.lat && junctionData?.lng) {
      resolveJunctionName(junctionId, junctionData.lat, junctionData.lng)
    }
  }, [junctionId, junctionData?.lat, junctionData?.lng, resolveJunctionName])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%", opacity: 0, filter: "blur(20px)" }}
          animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ x: "100%", opacity: 0, filter: "blur(20px)" }}
          transition={{ type: "spring", stiffness: 350, damping: 35 }}
          className="fixed top-16 right-0 h-[calc(100vh-4rem)] bg-white/80 backdrop-blur-3xl border-l border-slate-200/50 shadow-2xl w-full sm:w-96 md:w-[450px] lg:w-[500px] z-40 overflow-y-auto"
        >
          <div className="p-6 space-y-8">
            {/* Sticky Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200/60 pb-4 -mx-6 px-6 pt-6 -mt-6 sticky top-0 bg-white/80 backdrop-blur-xl z-50">
              <div className="flex-1 min-w-0">
                <motion.h2 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                  className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight break-words"
                >
                  {locName}
                </motion.h2>
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                  className="flex items-center gap-1.5 text-slate-500 text-sm mt-1"
                >
                  <MapPin className="w-4 h-4 text-sky-500 shrink-0" />
                  <span className="font-medium font-mono uppercase tracking-wider text-xs truncate">SUMO Node: {junctionId}</span>
                </motion.div>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-slate-100 hover:bg-red-100 rounded-full transition-colors text-slate-600 hover:text-red-600 shadow-sm shrink-0 mt-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Live Phase Info Layer */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative group">
                <button 
                  onClick={() => setShowArrows(!showArrows)} 
                  className="absolute top-3 right-3 p-1.5 bg-slate-100/80 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                  title="Toggle Visual Phase Format"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </button>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Current Phase</h3>
                
                <div className="h-8 flex items-center">
                  {!showArrows ? (
                    <div className={`text-xl tracking-tight font-bold ${isRed ? 'text-rose-500' : 'text-emerald-500'}`}>{phaseName}</div>
                  ) : (
                    <div className="flex gap-2">
                      <div className={`p-1 rounded-md transition-all ${isNS ? 'bg-emerald-100 text-emerald-600 ring-2 ring-emerald-400 shadow-sm' : 'bg-red-50 text-red-500 ring-1 ring-red-200 opacity-90'}`}>
                        <ArrowUp className="w-6 h-6 stroke-[3px]" />
                      </div>
                      <div className={`p-1 rounded-md transition-all ${isNS ? 'bg-emerald-100 text-emerald-600 ring-2 ring-emerald-400 shadow-sm' : 'bg-red-50 text-red-500 ring-1 ring-red-200 opacity-90'}`}>
                        <ArrowDown className="w-6 h-6 stroke-[3px]" />
                      </div>
                      <div className={`p-1 rounded-md transition-all ${isEW ? 'bg-emerald-100 text-emerald-600 ring-2 ring-emerald-400 shadow-sm' : 'bg-red-50 text-red-500 ring-1 ring-red-200 opacity-90'}`}>
                        <ArrowLeft className="w-6 h-6 stroke-[3px]" />
                      </div>
                      <div className={`p-1 rounded-md transition-all ${isEW ? 'bg-emerald-100 text-emerald-600 ring-2 ring-emerald-400 shadow-sm' : 'bg-red-50 text-red-500 ring-1 ring-red-200 opacity-90'}`}>
                        <ArrowRight className="w-6 h-6 stroke-[3px]" />
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-sm font-mono text-slate-500 mt-3 flex items-center gap-1 font-semibold">
                  Elapsed Time: <span className="text-slate-900 font-black">{elapsedLocal}s</span>
                </p>
              </div>
              <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">DQN AI Engine</h3>
                <div className="text-2xl font-bold h-8 flex items-center">
                  {junctionData?.is_emergency ? (
                    <span className="text-rose-500 uppercase tracking-tighter text-xl">Overridden (EVP)</span>
                  ) : junctionData ? (
                    <span className="text-sky-500">ACTIVE</span>
                  ) : (
                    <span className="text-slate-400">IDLE</span>
                  )}
                </div>
                <p className="text-sm font-mono text-slate-400 mt-3 flex gap-1">Delay Score: <span className="text-slate-700 font-bold">{Math.floor(aiScore)}</span></p>
              </div>
            </motion.div>

            {/* Pure-CSS Vertical Live Queue Bars */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Live YOLO PCU Detectors</h3>
                <p className="text-xs text-slate-500 mt-1 leading-snug">
                  Computer Vision edge nodes actively calculating the accumulated passenger car unit pressure waiting on each incoming road array.
                </p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-xl p-6 shadow-sm h-64 flex justify-around items-end">
                {queueData.map(row => (
                  <div key={row.name} className="flex flex-col items-center gap-3 h-full group">
                    <span className="text-sm font-bold text-slate-700 font-mono transition-transform group-hover:-translate-y-1">{row.queue}</span>
                    <div className="flex-1 w-12 bg-slate-100 rounded-t-xl overflow-hidden flex flex-col justify-end shadow-inner relative">
                      <div
                        className={`w-full ${row.color} transition-all duration-700 rounded-t-xl relative`}
                        style={{ height: `${Math.max(5, Math.min((row.queue / row.max) * 100, 100))}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{row.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Edge Component Health Monitor */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Edge AI Microservices</h3>
              <HealthMonitor sensors={junctionData?.sensors} junctionId={junctionId || undefined} />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
