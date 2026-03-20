"use client"

import { useState } from "react"
import { AlertCircle, Flame, ShieldAlert, Zap } from "lucide-react"
import { SimulationCanvas } from "@/components/SimulationCanvas"
import { JunctionDrawer } from "@/components/JunctionDrawer"
import { ProjectOverview } from "@/components/ProjectOverview"
import { motion, AnimatePresence } from "framer-motion"

export default function TrafficOverview() {
  const [isEmergencyActive, setIsEmergencyActive] = useState(false)
  const [selectedJunctionId, setSelectedJunctionId] = useState<string | null>(null)

  const cinematicTransition: any = { duration: 1.2, ease: [0.16, 1, 0.3, 1] }

  return (
    <div className="w-full h-full space-y-6 relative flex flex-col">
      {/* Header and Controls */}
      <motion.div
        initial={{ opacity: 0, y: -20, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ ...cinematicTransition, delay: 0.2 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
            Connaught Place Network
          </h1>
          <p className="text-slate-500 mt-1">Live SUMO TraCI Simulation & DQN Telemetry</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEmergencyActive(!isEmergencyActive)}
            className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all duration-300 shadow-sm hover:-translate-y-0.5 ${isEmergencyActive
              ? 'bg-red-500 text-white border border-red-400 hover:bg-red-600 shadow-[0_4px_15px_rgba(239,68,68,0.4)]'
              : 'bg-white/80 backdrop-blur-md text-slate-700 border border-slate-200/50 hover:bg-white hover:shadow-md'
              }`}
          >
            {isEmergencyActive ? <ShieldAlert className="w-5 h-5 animate-pulse" /> : <Zap className="w-5 h-5 text-yellow-500" />}
            {isEmergencyActive ? 'Disable Emergency Mode' : 'Simulate Emergency Protocol'}
          </button>
        </div>
      </motion.div>

      {/* Glassmorphism Project Overview Slide */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ ...cinematicTransition, delay: 0.7 }}
      >
        <ProjectOverview />
      </motion.div>

      {/* Emergency Global Alert Banner */}
      <AnimatePresence>
        {isEmergencyActive && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', y: 0, scale: 1 }}
            exit={{ opacity: 0, height: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="overflow-hidden mb-2"
          >
            <div className="w-full bg-red-600/95 backdrop-blur-md text-white rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgba(220,38,38,0.3)] flex items-start sm:items-center gap-4 border border-red-500/50 mt-4 relative overflow-hidden group">
              {/* Subtle animated danger stripes inside banner */}
              <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgNDBsNDAtNDBIMjBMMCAyMHYyMHptMzgtdTYyLTgyeiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==')] pointer-events-none group-hover:bg-[length:50px_50px] transition-all duration-1000"></div>

              <div className="bg-red-500 p-2.5 rounded-full hidden sm:block shadow-inner relative z-10">
                <Flame className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1 relative z-10">
                <div className="flex items-center gap-3 mb-1.5">
                  <h2 className="text-xl font-extrabold tracking-wide uppercase">Critical Alert: Ambulance Detected</h2>
                  <span className="bg-red-900 border border-red-400 text-red-100 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm animate-pulse">Active</span>
                </div>
                <p className="text-red-100 leading-snug font-medium text-sm">
                  <strong>Source:</strong> Node J1 INMP441 Mic | <strong className="ml-2">YAMNet Audio Siren Conf:</strong> <span className="text-white font-bold tracking-widest">98.4%</span>
                  <br className="sm:hidden" />
                  <span className="hidden sm:inline text-red-300 mx-2">|</span>
                  <strong>Action:</strong> Overriding DQN phases along corridor J1 → J5 → J3 to force ALL_GREEN.
                </p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-200 animate-pulse shrink-0 drop-shadow-lg relative z-10" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Interactive Canvas Area */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="flex-1 w-full relative group"
      >
        <SimulationCanvas
          onNodeClick={(id) => setSelectedJunctionId(id)}
          isEmergencyActive={isEmergencyActive}
        />

        {/* Helper overlay text */}
        <AnimatePresence>
          {!selectedJunctionId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 0.8, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-slate-200/80 px-6 py-3 rounded-full shadow-lg text-slate-700 font-bold text-sm flex items-center gap-2 pointer-events-none group-hover:opacity-100 transition-opacity"
            >
              <Zap className="w-4 h-4 text-blue-500 animate-pulse" />
              Click any junction node to view edge telemetry
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Slide-in Junction Drawer */}
      <JunctionDrawer
        isOpen={selectedJunctionId !== null}
        onClose={() => setSelectedJunctionId(null)}
        junctionId={selectedJunctionId}
      />

    </div>
  )
}