import { X } from "lucide-react"
import { HealthMonitor } from "./HealthMonitor"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { motion, AnimatePresence } from "framer-motion"
import { NumberTicker } from "./NumberTicker"

interface JunctionDrawerProps {
  isOpen: boolean
  onClose: () => void
  junctionId: string | null
}

const queueData = [
  { name: 'North', queue: 15, color: '#3b82f6' },
  { name: 'South', queue: 8, color: '#10b981' },
  { name: 'East', queue: 24, color: '#f59e0b' },
  { name: 'West', queue: 5, color: '#8b5cf6' },
]

export function JunctionDrawer({ isOpen, onClose, junctionId }: JunctionDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%", opacity: 0, filter: "blur(20px)" }}
          animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ x: "100%", opacity: 0, filter: "blur(20px)" }}
          transition={{ type: "spring", stiffness: 350, damping: 35 }}
          className="fixed top-16 right-0 h-[calc(100vh-4rem)] bg-white/80 backdrop-blur-3xl border-l border-slate-200/50 shadow-2xl w-full sm:w-96 md:w-[450px] lg:w-[500px] z-40 overflow-y-auto"
        >
          <div className="p-6 space-y-8">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
              <div>
                <motion.h2 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                  className="text-2xl font-bold tracking-tight text-slate-900"
                >
                  Junction {junctionId}
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                  className="text-slate-500 text-sm mt-1"
                >
                  Real-time Node Telemetry
                </motion.p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-200/80 rounded-full transition-colors text-slate-500 hover:text-slate-900 shadow-sm"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Phase Info Layer */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Current Phase</h3>
                <div className="text-2xl font-bold text-emerald-600">NS_GREEN</div>
                <p className="text-sm font-mono text-slate-400 mt-1 flex gap-1">Elapsed: <NumberTicker value={42} suffix="s" /></p>
              </div>
              <div className="bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">DQN AI Engine</h3>
                <div className="text-2xl font-bold text-indigo-600">STAY</div>
                <p className="text-sm font-mono text-slate-400 mt-1">Q-val: [2.4, -0.8]</p>
              </div>
            </motion.div>

            {/* Queue Lengths Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Live Queue Lengths</h3>
              <div className="h-48 w-full bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={queueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip 
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255,255,255,0.95)' }}
                    />
                    <Bar dataKey="queue" radius={[6, 6, 0, 0]} isAnimationActive={true} animationDuration={1500} animationEasing="ease-out">
                      {queueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Component Health Monitor */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Edge Health Monitor</h3>
              <HealthMonitor />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
