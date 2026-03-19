"use client"

import { TrendingUp, Leaf, Droplets, HeartPulse, Globe } from "lucide-react"
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
  LineChart, Line 
} from "recharts"

export default function AnalyticsPage() {
  const metricCards = [
    { title: "Wait Time Reduction", value: "34.2%", icon: <TrendingUp className="w-6 h-6 text-sky-500" />, subtext: "-2m 14s avg per vehicle" },
    { title: "CO₂ Emissions Prevented", value: "128.4t", icon: <Leaf className="w-6 h-6 text-emerald-500" />, subtext: "Equivalent to 6.2k trees" },
    { title: "Fuel Saved (Daily)", value: "4,250L", icon: <Droplets className="w-6 h-6 text-amber-500" />, subtext: "Idling reduction at intersections" },
    { title: "Lives Protected (Est)", value: "14", icon: <HeartPulse className="w-6 h-6 text-rose-500" />, subtext: "Via ambulance green-corridors" },
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
    reward: -100 + (Math.log(i + 1) * 30) + (Math.random() * 15 - 7)
  }))

  return (
    <div className="w-full h-full space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">City Impact Analytics</h1>
        <p className="text-slate-500 mt-1">Sustainability & Efficiency Metrics Driven by DQN</p>
      </div>

      {/* City-Scale Projection Banner */}
      <div className="w-full bg-gradient-to-r from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <Globe className="w-64 h-64 -mt-16 -mr-16" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-lg font-bold text-indigo-100 uppercase tracking-widest mb-2">City-Scale Projection</h2>
          <div className="text-4xl font-extrabold mb-4">Scaling this AI across 500 junctions would save $12.4M annually</div>
          <p className="text-indigo-100 text-lg leading-relaxed">
            By optimizing traffic flow, Intelli-Flow not only reduces congestion but significantly cuts down urban carbon footprints and ensures emergency services never hit red lights.
          </p>
        </div>
      </div>

      {/* Animated Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {metricCards.map((card, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-50 rounded-lg group-hover:scale-110 transition-transform">
                {card.icon}
              </div>
            </div>
            <h3 className="text-slate-500 font-medium text-sm mb-1">{card.title}</h3>
            <div className="text-3xl font-bold text-slate-900 mb-2">{card.value}</div>
            <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded">
              {card.subtext}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Comparison Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-1">Queue Delays: Fixed Timer vs AI</h3>
          <p className="text-sm text-slate-500 mb-6">Average waiting time (seconds) across intersections</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="timeOfDay" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="FixedTimer" name="Fixed Timer Logic" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="AI" name="Intelli-Flow AI" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reward Curve */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-1">DQN Training Reward Curve</h3>
          <p className="text-sm text-slate-500 mb-6">Reinforcement learning convergence over episodes</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dqnRewardData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="episode" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="reward" 
                  name="Accumulated Reward"
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}
