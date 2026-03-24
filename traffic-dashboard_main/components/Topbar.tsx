"use client"
import { useState, useEffect } from 'react'
import { Menu, X, AlertTriangle, ShieldCheck, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSidebar } from '@/context/SidebarContext'
import { useHardwareHealth } from '@/context/HardwareHealthContext'
import { useRouter } from 'next/navigation'

export function Topbar() {
  const [time, setTime] = useState<string>('')
  const { isOpen, toggle } = useSidebar()
  const { getFaultedJunctions } = useHardwareHealth()
  const router = useRouter()

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // Get all junctions with active faults
  const faultedJunctions = getFaultedJunctions()
  const hasFaults = faultedJunctions.length > 0
  const hasCriticalFault = faultedJunctions.some(f => f.isCritical)

  // Navigate to simulation tab and open the first faulted junction
  const handleFaultClick = () => {
    const firstFaulted = faultedJunctions[0]?.jid
    if (firstFaulted) {
      // Store the junction to open in sessionStorage so the simulation page can pick it up
      sessionStorage.setItem('intelliflow_open_junction', firstFaulted)
    }
    router.push('/')
  }

  const usePathname = require('next/navigation').usePathname
  const pathname = usePathname()
  const isSecurityTab = pathname === '/security'

  const handleLogout = () => {
    document.cookie = "intelliflow_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    window.location.href = '/login'
  }

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1.2, delay: 0.8, ease: [0.16, 1, 0.3, 1] } as any}
      className={`h-16 w-full fixed top-0 left-0 z-50 flex items-center justify-between px-4 sm:px-6 backdrop-blur-xl transition-all duration-300 ${
        isSecurityTab
          ? "bg-slate-950/80 border-b border-emerald-900/60 shadow-[0_4px_20px_rgba(16,185,129,0.05)] selection:bg-emerald-500/30 text-emerald-500 font-mono"
          : "bg-white/70 border-b border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] selection:bg-blue-100"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger */}
        <button
          onClick={toggle}
          className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-all duration-200 ${
            isSecurityTab
              ? "border-emerald-800/80 bg-black/50 hover:bg-emerald-900/40 hover:border-emerald-500 text-emerald-500 hover:text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
              : "border-slate-200/80 bg-slate-50/80 hover:bg-slate-100 hover:border-slate-300 text-slate-600 hover:text-slate-900 shadow-sm"
          }`}
          aria-label="Toggle sidebar"
        >
          <motion.div animate={{ rotate: 0 }} transition={{ duration: 0.2 }}>
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </motion.div>
        </button>

        <div className={`hidden sm:block text-xl font-bold ${
          isSecurityTab
            ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] tracking-widest uppercase truncate"
            : "bg-linear-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent"
        }`}>
          Intelli-Flow AI
        </div>
      </div>

      {/* Right side — fault banner + clock */}
      <div className="flex items-center gap-3">

        {/* Dynamic Fault Alert — only visible when faults exist */}
        <AnimatePresence>
          {hasFaults && (
            <motion.button
              key="fault-alert"
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={handleFaultClick}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-white text-sm transition-all shadow-md ${
                hasCriticalFault
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30 animate-pulse'
                  : 'bg-amber-500 hover:bg-amber-600 shadow-amber-400/30'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="hidden sm:block">
                {hasCriticalFault ? 'Critical Fault' : 'HW Warning'} — {faultedJunctions.length} node{faultedJunctions.length > 1 ? 's' : ''}
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* User Identity */}
        <div className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-md border text-sm font-bold ${
          isSecurityTab 
            ? "border-emerald-800/50 bg-emerald-950/30 text-emerald-400 font-mono shadow-[0_0_10px_rgba(16,185,129,0.15)]" 
            : "border-slate-200 bg-white text-slate-800 shadow-sm"
        }`}>
          <ShieldCheck className={`w-4 h-4 ${isSecurityTab ? "text-emerald-500 font-mono drop-shadow-[0_0_5px_currentColor]" : "text-slate-500"}`} />
          <span>Root</span>
        </div>

        {/* IST Clock */}
        <div className={`text-sm font-medium px-3 py-1 rounded-md border ${
          isSecurityTab
            ? "font-mono text-emerald-400 bg-black/60 border-emerald-800 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
            : "font-mono text-slate-700 bg-slate-100 border-slate-200 shadow-inner"
        }`}>
          {time || 'Loading...'}
          <span className={`ml-1 text-xs ${isSecurityTab ? "text-emerald-700" : "text-slate-400"}`}>IST</span>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          title="Terminate Session"
          className={`p-1.5 rounded-lg transition-all border ${
            isSecurityTab
              ? "bg-rose-950/40 border-rose-900/50 text-rose-500 hover:bg-rose-900/60 hover:text-rose-400 shadow-[0_0_10px_rgba(225,29,72,0.1)]"
              : "bg-slate-50 border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
          }`}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}
