"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { AlertTriangle, Gauge, HardHat, TrafficCone, Users, Banknote, Eye, X, FileText, ChevronDown, ChevronUp } from "lucide-react"
import { NumberTicker } from "@/components/NumberTicker"

// ── Static demo violation records ────────────────────────────────────────────
const VIOLATIONS = [
  {
    id: "ECH-2024-001",
    type: "Red Light",
    vehicle: "DL 4C AZ 1234",
    owner: "Rajesh Kumar",
    location: "Connaught Place Junction A2",
    time: "2024-03-27 09:14:32",
    fine: 1000,
    status: "Pending",
    statusColor: "text-amber-600 bg-amber-50 border-amber-200",
  },
  {
    id: "ECH-2024-002",
    type: "Overspeed",
    vehicle: "HR 26 DA 9988",
    owner: "Priya Sharma",
    location: "NH-48 Near Rajokri",
    time: "2024-03-27 10:02:11",
    fine: 2000,
    status: "Paid",
    statusColor: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  {
    id: "ECH-2024-003",
    type: "No Helmet",
    vehicle: "UP 32 GH 5521",
    owner: "Amit Singh",
    location: "Karol Bagh Junction B7",
    time: "2024-03-27 11:45:09",
    fine: 1000,
    status: "Pending",
    statusColor: "text-amber-600 bg-amber-50 border-amber-200",
  },
  {
    id: "ECH-2024-004",
    type: "Triple Riding",
    vehicle: "MH 12 AB 3344",
    owner: "Sneha Patel",
    location: "Lajpat Nagar Junction C1",
    time: "2024-03-27 12:30:55",
    fine: 1000,
    status: "Disputed",
    statusColor: "text-rose-600 bg-rose-50 border-rose-200",
  },
  {
    id: "ECH-2024-005",
    type: "Overspeed",
    vehicle: "KA 01 MN 7766",
    owner: "Vikram Rao",
    location: "Ring Road Junction D4",
    time: "2024-03-27 13:15:40",
    fine: 2000,
    status: "Paid",
    statusColor: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  {
    id: "ECH-2024-006",
    type: "Red Light",
    vehicle: "TN 22 CF 8810",
    owner: "Meena Krishnan",
    location: "Saket Junction E9",
    time: "2024-03-27 14:08:19",
    fine: 1000,
    status: "Pending",
    statusColor: "text-amber-600 bg-amber-50 border-amber-200",
  },
]

const VIOLATION_ICON: Record<string, React.ReactNode> = {
  "Red Light":    <TrafficCone className="w-4 h-4 text-rose-500" />,
  "Overspeed":   <Gauge className="w-4 h-4 text-amber-500" />,
  "No Helmet":   <HardHat className="w-4 h-4 text-orange-500" />,
  "Triple Riding": <Users className="w-4 h-4 text-violet-500" />,
}

const containerVariants: any = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.08 } },
}
const itemVariants: any = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } },
}

export default function ViolationsPage() {
  const [imageOpen, setImageOpen] = useState<string | null>(null)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>("All")

  const totalFine = VIOLATIONS.reduce((s, v) => s + v.fine, 0)
  const red    = VIOLATIONS.filter(v => v.type === "Red Light").length
  const speed  = VIOLATIONS.filter(v => v.type === "Overspeed").length
  const helmet = VIOLATIONS.filter(v => v.type === "No Helmet").length
  const triple = VIOLATIONS.filter(v => v.type === "Triple Riding").length

  const statCards = [
    { title: "Total E-Challans",      value: VIOLATIONS.length, suffix: "",    icon: <FileText className="w-6 h-6 text-sky-500" />,    color: "text-sky-500" },
    { title: "Overspeed Violations",  value: speed,             suffix: "",    icon: <Gauge className="w-6 h-6 text-amber-500" />,     color: "text-amber-500" },
    { title: "No Helmet Violations",  value: helmet,            suffix: "",    icon: <HardHat className="w-6 h-6 text-orange-500" />,  color: "text-orange-500" },
    { title: "Red Light Violations",  value: red,               suffix: "",    icon: <TrafficCone className="w-6 h-6 text-rose-500" />, color: "text-rose-500" },
    { title: "Triple Riding",         value: triple,            suffix: "",    icon: <Users className="w-6 h-6 text-violet-500" />,    color: "text-violet-500" },
    { title: "Revenue Generated",     value: totalFine,         suffix: "",    prefix: "₹", icon: <Banknote className="w-6 h-6 text-emerald-500" />, color: "text-emerald-500" },
  ]

  const types = ["All", "Red Light", "Overspeed", "No Helmet", "Triple Riding"]
  const filtered = filterType === "All" ? VIOLATIONS : VIOLATIONS.filter(v => v.type === filterType)

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full h-full space-y-6 pb-8"
    >
      {/* ── Page Header ── */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="p-3 bg-rose-100 text-rose-600 rounded-xl shadow-sm border border-rose-200/50">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
            Violation Analytics
          </h1>
          <p className="text-slate-500 mt-1 font-medium">AI-Detected Traffic Violations & E-Challan Management</p>
        </div>
      </motion.div>

      {/* ── Hero Banner ── */}
      <motion.div variants={itemVariants} className="w-full bg-slate-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-950 via-rose-950 to-orange-900 rounded-[2.5rem] p-8 sm:p-12 text-white shadow-2xl overflow-hidden relative border border-rose-900/50">
        <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none hidden md:block">
          <AlertTriangle className="w-64 h-64 text-rose-300" strokeWidth={0.5} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
            <span className="text-sm font-bold text-rose-300 uppercase tracking-widest">AI Vision — Live Detection</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-rose-100 to-orange-300">
            Automated E-Challan enforcement at <span className="text-rose-400">scale.</span>
          </h2>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-light max-w-xl">
            Computer vision edge nodes detect violations in real-time, automatically generate challans, and relay fine records to the central database without human intervention.
          </p>
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-300 group"
          >
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl w-fit group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-md transition-all duration-300 shadow-sm mb-3">
              {card.icon}
            </div>
            <h3 className="text-slate-500 font-semibold text-xs mb-1 leading-tight">{card.title}</h3>
            <div className={`text-3xl font-extrabold tracking-tight mb-1 ${card.color}`}>
              <NumberTicker value={card.value} prefix={card.prefix} suffix={card.suffix} decimals={0} />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Violation Records Table ── */}
      <motion.div variants={itemVariants} className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Table Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Challan Records</h2>
            <p className="text-sm text-slate-500 mt-0.5">AI-captured violation log with vehicle & owner details</p>
          </div>
          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {types.map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  filterType === t
                    ? "bg-rose-600 text-white border-rose-600 shadow"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Records */}
        <div className="divide-y divide-slate-100">
          {filtered.map(v => (
            <div key={v.id} className="group">
              {/* Row */}
              <div
                className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 hover:bg-slate-50/80 transition-colors cursor-pointer"
                onClick={() => setExpandedRow(expandedRow === v.id ? null : v.id)}
              >
                {/* Violation type icon + ID */}
                <div className="flex items-center gap-3 min-w-[180px]">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    {VIOLATION_ICON[v.type] || <AlertTriangle className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div>
                    <div className="text-xs font-mono text-slate-400">{v.id}</div>
                    <div className="text-sm font-bold text-slate-800">{v.type}</div>
                  </div>
                </div>

                {/* Vehicle & owner */}
                <div className="flex-1 min-w-[160px]">
                  <div className="text-sm font-bold text-slate-800 font-mono tracking-wider">{v.vehicle}</div>
                  <div className="text-xs text-slate-500">{v.owner}</div>
                </div>

                {/* Location */}
                <div className="flex-1 hidden md:block">
                  <div className="text-xs text-slate-500 truncate max-w-[200px]">{v.location}</div>
                  <div className="text-xs font-mono text-slate-400">{v.time}</div>
                </div>

                {/* Fine */}
                <div className="text-right min-w-[80px]">
                  <div className="text-lg font-black text-slate-900">₹{v.fine.toLocaleString()}</div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${v.statusColor}`}>{v.status}</span>
                </div>

                {/* Expand chevron */}
                <div className="text-slate-400 ml-2">
                  {expandedRow === v.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {/* Expanded Detail Row */}
              {expandedRow === v.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-6 pb-5 bg-slate-50/60 border-t border-slate-100"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-sm">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Challan ID</div>
                      <div className="font-mono font-bold text-slate-700">{v.id}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Vehicle No.</div>
                      <div className="font-mono font-bold text-slate-700">{v.vehicle}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Owner Name</div>
                      <div className="font-bold text-slate-700">{v.owner}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Fine Amount</div>
                      <div className="font-black text-slate-900">₹{v.fine.toLocaleString()}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Location</div>
                      <div className="text-slate-600">{v.location}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Timestamp</div>
                      <div className="font-mono text-xs text-slate-600">{v.time}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Evidence</div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setImageOpen(v.id) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Image
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Image Lightbox Modal ── */}
      {imageOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setImageOpen(null)}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <div>
                <div className="text-xs font-mono text-slate-400">Evidence — {imageOpen}</div>
                <div className="text-sm font-bold text-slate-800">AI-Captured Violation Frame</div>
              </div>
              <button onClick={() => setImageOpen(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <img
              src="/violation.webp"
              alt="Violation Evidence"
              className="w-full object-cover"
            />
            <div className="px-5 py-3 bg-slate-50 text-xs text-slate-500 font-mono border-t border-slate-100">
              Captured by Intelli-Flow AI Vision Node · Tamper-proof hash verified
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
