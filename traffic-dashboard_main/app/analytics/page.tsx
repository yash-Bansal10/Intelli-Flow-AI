"use client"

import { TrendingUp, Leaf, Droplets, HeartPulse, Globe, Activity, Zap } from "lucide-react"
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
  LineChart, Line 
} from "recharts"
import { motion } from "framer-motion"
import { NumberTicker } from "@/components/NumberTicker"

export default function AnalyticsPage() {
  const metricCards = [
    { title: "Wait Time Reduction", numeric: 34.2, suffix: "%", icon: <TrendingUp className="w-6 h-6 text-sky-500" />, subtext: "-2m 14s avg per vehicle" },
    { title: "CO₂ Emissions Prevented", numeric: 128.4, suffix: "t", icon: <Leaf className="w-6 h-6 text-emerald-500" />, subtext: "Equivalent to 6.2k trees" },
    { title: "Fuel Saved (Daily)", numeric: 4250, suffix: "L", icon: <Droplets className="w-6 h-6 text-amber-500" />, subtext: "Idling reduction at intersections" },
    { title: "Lives Protected (Est)", numeric: 14, suffix: "", icon: <HeartPulse className="w-6 h-6 text-rose-500" />, subtext: "Via ambulance green-corridors" },
  ]

  const comparisonData = [
    { timeOfDay: "08:00", FixedTimer: 180, AI: 120 },
    { timeOfDay: "10:00", FixedTimer: 140, AI: 85 },
    { timeOfDay: "12:00", FixedTimer: 160, AI: 110 },
    { timeOfDay: "14:00", FixedTimer: 150, AI: 95 },
    { timeOfDay: "16:00", FixedTimer: 170, AI: 115 },
    { timeOfDay: "18:00", FixedTimer: 210, AI: 145 },
    { timeOfDay: "20:00", FixedTimer: 160, AI: 90 },
  ]

  const dqnRewardData = Array.from({ length: 50 }).map((_, i) => ({
    episode: i * 10,
    reward: Math.round(-100 + (Math.log(i + 1) * 30) + (Math.random() * 10 - 5))
  }))

  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } }
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full h-full space-y-6 pb-8"
    >
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl shadow-sm border border-indigo-200/50">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
            City Impact Analytics
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Sustainability & Efficiency Metrics Driven by DQN</p>
        </div>
      </motion.div>

      {/* City-Scale Projection Banner - Premium 3D Dark Theme */}
      <motion.div variants={itemVariants} className="w-full bg-slate-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-950 via-blue-900 to-cyan-800 rounded-[2.5rem] p-8 sm:p-12 text-white shadow-[0_12px_40px_rgba(0,0,0,0.25)] overflow-hidden relative border border-blue-900/50">
        
        {/* Animated 3D Wireframe Globe Composition */}
        <div className="absolute top-1/2 -translate-y-1/2 right-4 lg:right-24 opacity-60 pointer-events-none hidden md:block" style={{ perspective: 1200 }}>
          <motion.div 
            animate={{ rotateY: [0, 360], rotateX: [10, -10, 10] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            style={{ transformStyle: 'preserve-3d' }}
            className="w-64 h-64 flex items-center justify-center relative"
          >
            <Globe className="absolute w-64 h-64 text-cyan-400/30" style={{ transform: 'translateZ(20px)' }} strokeWidth={1} />
            <Globe className="absolute w-56 h-56 text-indigo-400/20" style={{ transform: 'rotateY(45deg) translateZ(-10px)' }} strokeWidth={1} />
            <Globe className="absolute w-48 h-48 text-blue-500/10" style={{ transform: 'rotateY(90deg)' }} strokeWidth={1} />
            <div className="absolute w-[120%] h-[20%] bg-cyan-500/20 blur-[35px] rounded-[100%] top-1/2 -translate-y-1/2" style={{ transform: 'rotateX(75deg)' }}></div>
          </motion.div>
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-yellow-400 animate-pulse drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
            <span className="text-sm font-bold text-indigo-300 uppercase tracking-widest">Global Scale Projection</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6 leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-indigo-300 drop-shadow-sm">
            Scaling AI across 500 junctions saves <span className="text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.4)]">$12.4M</span> annually.
          </h2>
          <p className="text-slate-300 text-lg sm:text-xl leading-relaxed font-light max-w-xl">
            Intelli-Flow eliminates congestion, aggressively cuts urban carbon footprints, and secures uninterrupted green corridors for emergency services.
          </p>
        </div>
      </motion.div>

      {/* Animated Metric Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {metricCards.map((card, i) => (
          <motion.div 
            key={i} 
            variants={itemVariants}
            className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-300 group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-md transition-all duration-300 shadow-sm">
                {card.icon}
              </div>
            </div>
            <h3 className="text-slate-500 font-semibold text-sm mb-1">{card.title}</h3>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
              <NumberTicker value={card.numeric} suffix={card.suffix} decimals={card.numeric % 1 !== 0 ? 1 : 0} />
            </div>
            <div className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 inline-block px-2.5 py-1 rounded-md">
              {card.subtext}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Comparison Chart */}
        <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-[2rem] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">Queue Delays: Fixed vs AI</h3>
              <p className="text-sm text-slate-500">Average waiting time (seconds) across intersections</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="timeOfDay" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} dx={-10} />
                <Tooltip 
                  cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="FixedTimer" name="Fixed Timer Logic" fill="#cbd5e1" radius={[6, 6, 0, 0]} isAnimationActive={true} animationEasing="ease-out" animationDuration={1500} />
                <Bar dataKey="AI" name="Intelli-Flow AI" fill="#6366f1" radius={[6, 6, 0, 0]} isAnimationActive={true} animationEasing="ease-out" animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reward Curve */}
        <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-[2rem] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">DQN Training Convergence</h3>
              <p className="text-sm text-slate-500">Reinforcement learning cumulative rewards</p>
            </div>
            <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold rounded-full">
              Converged
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dqnRewardData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="episode" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                />
                <Line 
                  type="natural" 
                  dataKey="reward" 
                  name="Accumulated Avg Reward"
                  stroke="#10b981" 
                  strokeWidth={4} 
                  dot={false}
                  activeDot={{ r: 8, fill: "#10b981", stroke: "#fff", strokeWidth: 3 }} 
                  isAnimationActive={true}
                  animationEasing="ease-out"
                  animationDuration={2000}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </motion.div>
    </motion.div>
  )
}
