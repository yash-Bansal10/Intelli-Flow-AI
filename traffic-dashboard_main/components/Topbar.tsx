"use client"
import { useState, useEffect } from 'react'
import { Menu, X, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useSidebar } from '@/context/SidebarContext'

export function Topbar() {
  const [time, setTime] = useState<string>('')
  const { isOpen, toggle } = useSidebar()

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
        {/* Hamburger — replaces logo icon */}
        <button
          onClick={toggle}
          className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50/80 hover:bg-slate-100 hover:border-slate-300 text-slate-600 hover:text-slate-900 transition-all duration-200 shadow-sm"
          aria-label="Toggle sidebar"
        >
          <motion.div
            animate={{ rotate: isOpen ? 0 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </motion.div>
        </button>

        <div className="hidden sm:block text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
          Intelli-Flow AI
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        {/* Live Agents Status removed per user request */}

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
