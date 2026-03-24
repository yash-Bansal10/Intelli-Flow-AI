"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Map, Camera, BarChart2, Shield, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSidebar } from '@/context/SidebarContext'

export function Sidebar() {
  const pathname = usePathname()
  const { isOpen } = useSidebar()

  const navItems = [
    { href: '/', label: 'Simulation', icon: Map },
    { href: '/camera', label: 'Demo', icon: Camera },
    { href: '/analytics', label: 'Analytics', icon: BarChart2 },
    { href: '/security', label: 'Security', icon: Shield },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  const isSecurityTab = pathname === '/security'

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="sidebar"
          initial={{ x: -280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -280, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`w-16 lg:w-64 h-full backdrop-blur-xl flex flex-col items-center lg:items-start z-40 fixed left-0 top-0 pt-16 transition-all duration-300 ${
            isSecurityTab
              ? "bg-slate-950/90 border-r border-emerald-900/60 shadow-[4px_0_24px_rgba(16,185,129,0.05)] text-emerald-500 font-mono"
              : "bg-slate-50/80 border-r border-slate-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
          }`}
        >
          <div className={`w-full flex-1 flex flex-col gap-2 p-2 sm:p-4 overflow-y-auto ${isSecurityTab ? "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-emerald-900/80 [&::-webkit-scrollbar-thumb]:rounded-full" : ""}`}>
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`relative flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group ${
                    isSecurityTab
                      ? (isActive ? "text-emerald-400 font-bold tracking-wider drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]" : "text-emerald-700/60 hover:text-emerald-400 uppercase tracking-widest text-[11px] lg:text-sm")
                      : (isActive ? "text-blue-700 font-semibold" : "text-slate-500 hover:text-slate-900")
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className={`absolute inset-0 rounded-xl transition-colors duration-300 ${
                        isSecurityTab 
                          ? "bg-emerald-950/40 border-emerald-500/50 shadow-[inset_0_0_15px_rgba(16,185,129,0.2)]"
                          : "bg-blue-100/60 shadow-sm border border-blue-200/50"
                      }`}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <motion.div whileHover={{ scale: 1.05 }} className="relative z-10 flex items-center justify-center lg:justify-start gap-3 w-full">
                    <Icon className={`w-6 h-6 shrink-0 transition-all duration-300 ${
                      isSecurityTab
                        ? (isActive ? "text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]" : "group-hover:text-emerald-500 group-hover:drop-shadow-[0_0_5px_currentColor]")
                        : (isActive ? "text-blue-600" : "group-hover:text-blue-500")
                    }`} />
                    <span className="hidden lg:block whitespace-nowrap">{item.label}</span>
                  </motion.div>
                </Link>
              )
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
