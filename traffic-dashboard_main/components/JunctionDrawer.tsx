import { X } from "lucide-react"
import { HealthMonitor } from "./HealthMonitor"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

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
    <div
      className={`fixed top-16 right-0 h-[calc(100vh-4rem)] bg-slate-50 border-l border-slate-200 shadow-2xl w-full sm:w-96 md:w-[450px] lg:w-[500px] z-40 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="p-6 space-y-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Junction {junctionId}</h2>
            <p className="text-slate-500 text-sm mt-1">Real-time Node Telemetry</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-slate-900"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Phase Info Layer */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Current Phase</h3>
            <div className="text-2xl font-bold text-emerald-600">NS_GREEN</div>
            <p className="text-sm font-mono text-slate-400 mt-1">Elapsed: 42s</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">DQN AI Engine</h3>
            <div className="text-2xl font-bold border-indigo-600 text-indigo-600">STAY</div>
            <p className="text-sm font-mono text-slate-400 mt-1">Q-val: [2.4, -0.8]</p>
          </div>
        </div>

        {/* Queue Lengths Chart */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Live Queue Lengths (Vehicles)</h3>
          <div className="h-48 w-full bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={queueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="queue" radius={[4, 4, 0, 0]}>
                  {queueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Component Health Monitor */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Edge Health Monitor</h3>
          <HealthMonitor />
        </div>
      </div>
    </div>
  )
}
