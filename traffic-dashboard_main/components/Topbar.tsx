"use client"
import { useState, useEffect } from 'react'
import { Flame, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'

export function Topbar() {
  const [time, setTime] = useState<string>('')
  
  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1.2, delay: 0.8, ease: [0.16, 1, 0.3, 1] } as any}
      className="h-16 w-full bg-white/70 backdrop-blur-xl border-b border-slate-200/60 fixed top-0 left-0 z-50 flex items-center justify-between px-4 sm:px-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] selection:bg-blue-100"
    >
      <div className="flex items-center gap-3">
        {/* Logo Placeholder */}
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center border border-blue-200 shadow-sm overflow-hidden text-blue-600">
           <Flame className="w-6 h-6" />
        </div>
        <div className="hidden sm:block text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
          Intelli-Flow AI
        </div>
      </div>
      
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Live Agents Status */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50/50 backdrop-blur-sm border border-slate-200/50 rounded-full px-3 py-1 shadow-inner">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Agents</span>
          <div className="flex items-center gap-1.5 ml-1">
             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-[pulse_2s_ease-in-out_infinite]" title="Agent 1"></div>
             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-[pulse_2.2s_ease-in-out_infinite_0.2s]" title="Agent 2"></div>
             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-[pulse_2.1s_ease-in-out_infinite_0.4s]" title="Agent 3"></div>
             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-[pulse_2.3s_ease-in-out_infinite_0.6s]" title="Agent 4"></div>
          </div>
        </div>

        {/* IST Clock */}
        <div className="text-sm font-mono font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded-md border border-slate-200 shadow-inner">
          {time || 'Loading...'} 
          <span className="text-slate-400 ml-1 text-xs">IST</span>
        </div>

        {/* Emergency Trigger Button */}
        <button 
          onClick={() => alert("Emergency Mode Triggered")} 
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-semibold transition-colors shadow-md shadow-red-500/30"
        >
          <AlertTriangle className="w-4 h-4" />
          <span className="hidden sm:block">Emergency Trigger</span>
        </button>
      </div>
    </motion.div>
  )
}
