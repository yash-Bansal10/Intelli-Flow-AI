"use client"

import { motion } from "framer-motion"
import { Cpu, Activity, Network } from "lucide-react"

export function ProjectOverview() {
  return (
    <div className="relative w-full mb-4 z-20" style={{ perspective: 2500 }}>
      {/* Abstract Background Blobs - Hybrid Twilight Theme */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/15 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/15 rounded-full blur-[70px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

      <motion.div 
        animate={{ rotateY: [0, 360] }}
        transition={{ 
          duration: 18, 
          repeat: Infinity, 
          ease: "linear" 
        }} 
        style={{ transformStyle: "preserve-3d" }}
        className="relative z-10 w-full max-w-5xl h-[280px] sm:h-[320px] mx-auto group"
      >
        
        {/* --- FRONT FACE (Twilight "Not too dark, not too light" frosted glass) --- */}
        <div 
          className="absolute inset-0 w-full h-full bg-slate-700/40 backdrop-blur-2xl border border-slate-300/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-[2.5rem] p-8 lg:p-12 flex flex-col justify-center items-center text-center"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "translateZ(1px)" }}
        >
          {/* Subtle inner reflection line */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          {/* Top Right Label */}
          <div className="absolute top-6 right-8 text-slate-300 text-[10px] sm:text-xs font-semibold tracking-widest uppercase">
            Smart Traffic System
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 mt-4">
            <span className="bg-gradient-to-r from-blue-300 via-cyan-300 to-indigo-300 bg-clip-text text-transparent drop-shadow-md">
              Intelli-Flow AI
            </span>
          </h2>

          <p className="text-base sm:text-lg lg:text-xl text-slate-100 font-medium leading-relaxed max-w-2xl drop-shadow-sm">
            An AI-powered smart traffic optimization system using DQN, real-time telemetry, and intelligent signal control.
          </p>
        </div>

        {/* --- BACK FACE --- */}
        <div 
          className="absolute inset-0 w-full h-full bg-slate-700/40 backdrop-blur-2xl border border-slate-300/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-[2.5rem] p-8 lg:p-12 flex flex-col justify-center items-center"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg) translateZ(1px)" }}
        >
          {/* Subtle inner reflection line */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          <h2 className="text-2xl sm:text-3xl tracking-widest uppercase font-bold text-slate-100 mb-8 mt-2 drop-shadow-sm">
            System Topology
          </h2>

          <div className="grid grid-cols-3 gap-4 sm:gap-8 w-full max-w-3xl">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-500/20 border border-indigo-300/30 flex items-center justify-center text-indigo-300 shadow-sm">
                <Network className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <p className="text-slate-200 font-medium text-xs sm:text-base">IoT Edge Mesh</p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
               <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-cyan-500/20 border border-cyan-300/30 flex items-center justify-center text-cyan-300 shadow-sm">
                <Cpu className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <p className="text-slate-200 font-medium text-xs sm:text-base">DQN Inference</p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
               <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500/20 border border-emerald-300/30 flex items-center justify-center text-emerald-300 shadow-sm">
                <Activity className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <p className="text-slate-200 font-medium text-xs sm:text-base">Live Telemetry</p>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  )
}
