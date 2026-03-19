"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Map, Camera, BarChart2, Shield, Settings } from 'lucide-react'

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
    <div className="w-16 lg:w-64 h-full bg-slate-50 border-r border-slate-200 flex flex-col items-center lg:items-start transition-all duration-300 z-40 fixed left-0 top-0 pt-16">
      <div className="w-full flex-1 flex flex-col gap-2 p-2 sm:p-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link 
              key={item.href} 
              href={item.href}
              title={item.label}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                isActive ? 'bg-blue-100 text-blue-700 font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Icon className="w-6 h-6 shrink-0" />
              <span className="hidden lg:block whitespace-nowrap">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
