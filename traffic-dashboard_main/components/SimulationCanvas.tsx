"use client"
import React from "react"
import { motion } from "framer-motion"

interface SimulationCanvasProps {
  onNodeClick: (id: string) => void
  isEmergencyActive: boolean
}

const JUNC_POSITIONS = {
  J1: { cx: 200, cy: 300, name: "Connaught Inner" },
  J2: { cx: 400, cy: 150, name: "Barakhamba Rd" },
  J3: { cx: 600, cy: 300, name: "Kasturba Gandhi" },
  J4: { cx: 400, cy: 450, name: "Janpath Intersection" },
  J5: { cx: 400, cy: 300, name: "Central Park" },
}

const EDGES = [
  { from: "J1", to: "J5" },
  { from: "J2", to: "J5" },
  { from: "J3", to: "J5" },
  { from: "J4", to: "J5" },
  { from: "J1", to: "J2" },
  { from: "J2", to: "J3" },
  { from: "J3", to: "J4" },
  { from: "J4", to: "J1" },
]

export function SimulationCanvas({ onNodeClick, isEmergencyActive }: SimulationCanvasProps) {
  // Mock ambulance route array for glowing line
  const ambulanceRoute = ["J1", "J5", "J3"]

  return (
    <div className="w-full h-full min-h-[500px] lg:h-[700px] bg-slate-100 rounded-3xl border border-slate-200 overflow-hidden relative shadow-inner">
      <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
        {/* Draw Normal Edges */}
        {EDGES.map((edge, i) => {
          const fromNode = JUNC_POSITIONS[edge.from as keyof typeof JUNC_POSITIONS]
          const toNode = JUNC_POSITIONS[edge.to as keyof typeof JUNC_POSITIONS]
          return (
            <line
              key={`edge-${i}`}
              x1={fromNode.cx}
              y1={fromNode.cy}
              x2={toNode.cx}
              y2={toNode.cy}
              stroke="#cbd5e1"
              strokeWidth="20"
              strokeLinecap="round"
            />
          )
        })}

        {/* Draw Emergency Route Glowing Overlay */}
        {isEmergencyActive && (
          <motion.polyline
            points={ambulanceRoute
              .map((id) => `${JUNC_POSITIONS[id as keyof typeof JUNC_POSITIONS].cx},${JUNC_POSITIONS[id as keyof typeof JUNC_POSITIONS].cy}`)
              .join(" ")}
            fill="none"
            stroke="#ef4444"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        )}

        {/* Draw Vehicles (Dots) - mock random placement near nodes */}
        {Array.from({ length: 40 }).map((_, i) => {
          const randNode = Object.values(JUNC_POSITIONS)[i % 5]
          const offsetX = (Math.random() - 0.5) * 80
          const offsetY = (Math.random() - 0.5) * 80
          return (
            <circle
              key={`vehicle-${i}`}
              cx={randNode.cx + offsetX}
              cy={randNode.cy + offsetY}
              r="4"
              fill={i % 4 === 0 ? "#eab308" : "#3b82f6"} // yellow cabs or blue cars
              className="animate-pulse"
              style={{ animationDelay: `${Math.random() * 2}s` }}
            />
          )
        })}

        {/* Draw Junctions / Intersections */}
        {Object.entries(JUNC_POSITIONS).map(([id, pos]) => (
          <g key={id} onClick={() => onNodeClick(id)} className="cursor-pointer group">
            <circle
              cx={pos.cx}
              cy={pos.cy}
              r="24"
              fill="#1e293b"
              className="group-hover:fill-indigo-600 transition-colors"
            />
            <circle
              cx={pos.cx}
              cy={pos.cy}
              r="10"
              fill="#22c55e"
              className={isEmergencyActive && ambulanceRoute.includes(id) ? "fill-red-500 animate-pulse" : ""}
            />
            <text
              x={pos.cx}
              y={pos.cy - 35}
              textAnchor="middle"
              fill="#334155"
              fontFamily="sans-serif"
              fontSize="14"
              fontWeight="bold"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {pos.name}
            </text>
            {/* Health Pulse Ring */}
            <circle
              cx={pos.cx}
              cy={pos.cy}
              r="28"
              fill="none"
              stroke="#6366f1"
              strokeWidth="2"
              className="opacity-0 group-hover:opacity-100 animate-ping group-hover:animate-none group-active:animate-ping"
            />
          </g>
        ))}
      </svg>
      {/* Decorative Gradient Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/10 to-slate-200/30 mix-blend-overlay"></div>
    </div>
  )
}
