"use client"

import { useState } from "react"
import { AlertCircle, Flame, ShieldAlert, Zap } from "lucide-react"
import { JunctionDrawer } from "@/components/JunctionDrawer"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
import { useSimData } from "@/hooks/useSimData"

const LiveOSMMap = dynamic(() => import("@/components/LiveOSMMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-slate-100/50 rounded-2xl border border-slate-200 shadow-inner font-bold text-slate-400 animate-pulse">Loading OpenStreetMap Engine...</div>
})

export default function TrafficOverview() {
  const [isEmergencyActive, setIsEmergencyActive] = useState(false)
  const [selectedJunctionId, setSelectedJunctionId] = useState<string | null>(null)
  const { data: simulationData } = useSimData()

  return (
    <div className="w-full h-[calc(100vh-4rem)] relative flex flex-col overflow-hidden">
      
      {/* Emergency Banner moves to absolute overlay above map */}
      <div className="absolute top-4 left-0 right-0 z-20 flex justify-center pointer-events-none">
        <AnimatePresence>
          {isEmergencyActive && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="pointer-events-auto px-4 w-full max-w-4xl"
            >
              <div className="w-full bg-red-600/95 backdrop-blur-md text-white rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgba(220,38,38,0.3)] flex items-start sm:items-center gap-4 border border-red-500/50 relative overflow-hidden group">
                <div className="bg-red-500 p-2.5 rounded-full hidden sm:block shadow-inner relative z-10">
                  <Flame className="w-6 h-6 animate-pulse" />
                </div>
                <div className="flex-1 relative z-10">
                  <div className="flex items-center gap-3 mb-1.5">
                    <h2 className="text-xl font-extrabold tracking-wide uppercase">Critical Alert: Ambulance Detected</h2>
                    <span className="bg-red-900 border border-red-400 text-red-100 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm animate-pulse">Active</span>
                  </div>
                  <p className="text-red-100 leading-snug font-medium text-sm">
                    <strong>Source:</strong> YOLOv11s Vision
                    <span className="hidden sm:inline text-red-300 mx-2">|</span>
                    <strong>Action:</strong> Green corridor active — DQN overridden for emergency arm.
                  </p>
                </div>
                <AlertCircle className="w-10 h-10 text-red-200 animate-pulse shrink-0 drop-shadow-lg relative z-10" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Interactive Canvas Area */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 w-full relative group h-full"
      >
        <LiveOSMMap
          simulationData={simulationData}
          onNodeClick={(id) => setSelectedJunctionId(id)}
          isEmergencyActive={isEmergencyActive}
          selectedJunctionId={selectedJunctionId}
        />

        {/* Helper overlay text */}
        <AnimatePresence>
          {!selectedJunctionId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 0.8, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-slate-200/80 px-6 py-3 rounded-full shadow-lg text-slate-700 font-bold text-sm flex items-center gap-2 pointer-events-none"
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