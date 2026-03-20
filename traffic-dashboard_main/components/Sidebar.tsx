"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Map, Camera, BarChart2, Shield, Settings } from 'lucide-react'
import { motion } from 'framer-motion'

export function Sidebar() {
  const pathname = usePathname()
  
  const navItems = [
    { href: '/', label: 'Overview', icon: Map },
    { href: '/camera', label: 'Live Cam', icon: Camera },
    { href: '/analytics', label: 'Analytics', icon: BarChart2 },
    { href: '/security', label: 'Security', icon: Shield },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <motion.div 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 1.2, delay: 1.0, ease: [0.16, 1, 0.3, 1] } as any}
      className="w-16 lg:w-64 h-full bg-slate-50/80 backdrop-blur-xl border-r border-slate-200/60 flex flex-col items-center lg:items-start transition-all duration-300 z-40 fixed left-0 top-0 pt-16 shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
    >
      <div className="w-full flex-1 flex flex-col gap-2 p-2 sm:p-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link 
              key={item.href} 
              href={item.href}
              title={item.label}
              className={`relative flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group ${
                isActive ? 'text-blue-700 font-semibold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-blue-100/60 rounded-xl shadow-sm border border-blue-200/50"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <motion.div whileHover={{ scale: 1.05 }} className="relative z-10 flex items-center gap-3 w-full">
                <Icon className={`w-6 h-6 shrink-0 transition-colors duration-300 ${isActive ? 'text-blue-600' : 'group-hover:text-blue-500'}`} />
                <span className="hidden lg:block whitespace-nowrap">{item.label}</span>
              </motion.div>
            </Link>
          )
        })}
      </div>
    </motion.div>
  )
}
