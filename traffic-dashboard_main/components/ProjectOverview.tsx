"use client"

import { AlertCircle, Cpu, Camera, BarChart2 } from "lucide-react"

export function ProjectOverview() {
  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-blue-50/80 via-white to-cyan-50/80 p-6 sm:p-10 shadow-sm border border-blue-100/50 mb-0">
      {/* Abstract Background Blobs for depth */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/30 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-200/30 rounded-full blur-[70px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

      {/* Frosted Glass Card */}
      <div className="relative z-10 bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-8 lg:p-10 max-w-5xl mx-auto transition-all duration-500 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)]">
        
        {/* Title */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 inline-block relative">
            Project Overview
            <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-80"></span>
          </h2>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          
          {/* Problem Statement */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-rose-500 font-bold tracking-wide">
              <div className="p-2.5 bg-rose-50 rounded-xl shadow-sm border border-rose-100/50"><AlertCircle className="w-5 h-5" /></div>
              Problem Statement
            </div>
            <p className="text-slate-600 leading-relaxed text-sm font-medium">
              Traditional traffic systems rely on fixed timers and outdated loops, leading to severe rush-hour congestion, compounded carbon emissions, and extremely dangerous delays for emergency responders actively en route.
            </p>
          </div>

          {/* Solution */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-emerald-500 font-bold tracking-wide">
              <div className="p-2.5 bg-emerald-50 rounded-xl shadow-sm border border-emerald-100/50"><Cpu className="w-5 h-5" /></div>
              AI-Driven Solution
            </div>
            <p className="text-slate-600 leading-relaxed text-sm font-medium">
              Intelli-Flow utilizes Deep Q-Networks (DQN) continuously trained on live telemetry data to dynamically optimize signal phases. It prioritizes overall throughput while guaranteeing immediate green-corridors for emergency vehicles.
            </p>
          </div>

          {/* Key Components */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-blue-500 font-bold tracking-wide">
              <div className="p-2.5 bg-blue-50 rounded-xl shadow-sm border border-blue-100/50"><Camera className="w-5 h-5" /></div>
              Key Architecture
            </div>
            <ul className="text-slate-600 space-y-2.5 text-sm font-medium">
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"></span> SUMO TraCI Simulation Engine</li>
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"></span> Deep Q-Network (DQN) Multi-Agent System</li>
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"></span> YOLOv8 Computer Vision Pipeline</li>
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"></span> ESP32 & IoT Edge Infrastructure</li>
            </ul>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-indigo-500 font-bold tracking-wide">
              <div className="p-2.5 bg-indigo-50 rounded-xl shadow-sm border border-indigo-100/50"><BarChart2 className="w-5 h-5" /></div>
              Core Features
            </div>
            <ul className="text-slate-600 space-y-2.5 text-sm font-medium">
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]"></span> Smart Signal Phase Control</li>
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]"></span> Active Emergency Corridor Rendering</li>
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]"></span> Live Impact Analytics & Reporting</li>
              <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]"></span> Zero-Trust HMAC Endpoint Security</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
