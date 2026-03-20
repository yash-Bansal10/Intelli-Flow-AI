"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Cpu, Activity, Network } from "lucide-react"

export default function PresentationSlide() {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div 
      className="relative min-h-screen w-full bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 overflow-hidden flex items-center justify-center p-6"
      style={{ perspective: 1800 }}
    >
      
      {/* --- Ambient Glowing Spheres --- */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
        className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-500 rounded-full blur-[120px] mix-blend-screen pointer-events-none"
      />
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 3, ease: "easeInOut", delay: 0.2 }}
        className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600 rounded-full blur-[130px] mix-blend-screen pointer-events-none"
      />
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 2.8, ease: "easeInOut", delay: 0.4 }}
        className="absolute bottom-[-15%] right-[-5%] w-[450px] h-[450px] bg-blue-600 rounded-full blur-[100px] mix-blend-screen pointer-events-none"
      />

      {/* --- Main 3D Flippable Glass Container --- */}
      <motion.div 
        onClick={() => setIsFlipped(!isFlipped)}
        initial={{ opacity: 0, rotateY: -25, scale: 0.9, z: -100 }}
        animate={{ 
          opacity: 1, 
          rotateY: isFlipped ? 180 : 0, 
          scale: 1, 
          z: 0 
        }}
        transition={{ 
          duration: 1.4, 
          ease: [0.16, 1, 0.3, 1] // Custom highly elegant ease-out cubic
        }} 
        style={{ transformStyle: "preserve-3d" }}
        className="relative z-10 w-full max-w-5xl h-[450px] md:h-[500px] cursor-pointer group"
      >
        
        {/* --- FRONT FACE --- */}
        <div 
          className="absolute inset-0 w-full h-full bg-blue-500/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_40px_0_rgba(0,0,0,0.6)] rounded-[2rem] p-10 md:p-16 overflow-hidden flex flex-col justify-between"
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Subtle top inner reflection */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

          {/* Top Right Label */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="absolute top-10 right-10 text-white/50 text-xs md:text-sm font-semibold tracking-[0.2em] uppercase"
          >
            Smart Traffic System
          </motion.div>

          {/* Content Container */}
          <div className="flex-1 flex flex-col justify-center max-w-2xl mt-8">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8"
            >
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                Intelli-Flow AI
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-xl md:text-2xl text-slate-300 font-light leading-relaxed drop-shadow-sm"
            >
              An AI-powered smart traffic optimization system using DQN, real-time telemetry, and intelligent signal control.
            </motion.p>
          </div>
          
          <div className="absolute bottom-8 right-10 text-white/30 text-xs font-semibold tracking-wider uppercase group-hover:text-white/60 transition-colors animate-pulse">
            Click to view topology
          </div>
        </div>

        {/* --- BACK FACE (Revealed on 180° flip) --- */}
        <div 
          className="absolute inset-0 w-full h-full bg-slate-900/60 backdrop-blur-3xl border border-cyan-500/20 shadow-[0_8px_40px_0_rgba(0,0,0,0.6)] rounded-[2rem] p-10 md:p-16 overflow-hidden flex flex-col justify-center items-center"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {/* Subtle top inner reflection */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none" />
          
          <h2 className="text-3xl tracking-widest uppercase font-bold text-white mb-12 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            System Topology
          </h2>

          <div className="grid grid-cols-3 gap-8 w-full max-w-3xl">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <Network className="w-8 h-8" />
              </div>
              <p className="text-slate-300 font-medium">IoT Edge Mesh</p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4">
               <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                <Cpu className="w-8 h-8" />
              </div>
              <p className="text-slate-300 font-medium">DQN Inference</p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4">
               <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                <Activity className="w-8 h-8" />
              </div>
              <p className="text-slate-300 font-medium">Real-time Telemetry</p>
            </div>
          </div>

          <div className="absolute bottom-8 right-10 text-white/30 text-xs font-semibold tracking-wider uppercase group-hover:text-cyan-400/60 transition-colors">
            Click to return
          </div>
        </div>

      </motion.div>
    </div>
  )
}
