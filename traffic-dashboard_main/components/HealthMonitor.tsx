import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Cpu, Camera, Mic, Tv, Watch } from "lucide-react"
import { motion } from "framer-motion"
import { NumberTicker } from "./NumberTicker"

interface MetricStat {
  label: string;
  value?: string;
  numeric?: number;
  suffix?: string;
  decimals?: number;
}

export function HealthMonitor() {
  const metrics: { title: string, icon: JSX.Element, stats: MetricStat[] }[] = [
    {
      title: "DQN Agent",
      icon: <Activity className="w-5 h-5 text-indigo-500" />,
      stats: [
        { label: "Inference", numeric: 12, suffix: "ms" },
        { label: "Last Action", value: "SWITCH" },
      ],
    },
    {
      title: "ESP32-CAM",
      icon: <Camera className="w-5 h-5 text-sky-500" />,
      stats: [
        { label: "Stream FPS", numeric: 24.5, decimals: 1 },
        { label: "Latency", numeric: 85, suffix: "ms" },
      ],
    },
    {
      title: "INMP441 Mic",
      icon: <Mic className="w-5 h-5 text-emerald-500" />,
      stats: [
        { label: "Audio", numeric: -12, suffix: "dB" },
        { label: "Siren Conf.", numeric: 2, suffix: "%" },
      ],
    },
    {
      title: "ESP32 Controller",
      icon: <Cpu className="w-5 h-5 text-orange-500" />,
      stats: [
        { label: "GPIO", value: "OK" },
        { label: "Uptime", value: "14d 2h" },
      ],
    },
    {
      title: "OLED display",
      icon: <Tv className="w-5 h-5 text-violet-500" />,
      stats: [
        { label: "State", value: "Active" },
        { label: "Refresh", numeric: 60, suffix: "Hz" },
      ],
    },
    {
      title: "Watchdog",
      icon: <Watch className="w-5 h-5 text-rose-500" />,
      stats: [
        { label: "Heartbeat", value: "Active" },
        { label: "Mode", value: "Primary" },
      ],
    },
  ]

  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const cardVariants: any = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } }
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-3 gap-4 w-full"
    >
      {metrics.map((metric, i) => (
        <motion.div key={i} variants={cardVariants}>
          <Card className="bg-white/60 backdrop-blur-md border-slate-200/60 shadow-sm shadow-slate-200/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <CardHeader className="p-3 pb-2 flex flex-row items-center gap-2 space-y-0">
              <div className="p-1.5 bg-slate-50 rounded-lg shadow-sm border border-slate-100">
                {metric.icon}
              </div>
              <CardTitle className="text-sm font-semibold text-slate-700">{metric.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="space-y-1.5">
                {metric.stats.map((stat, j) => (
                  <div key={j} className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">{stat.label}</span>
                    <span className="font-medium text-slate-800 font-mono bg-slate-100/50 px-1.5 py-0.5 rounded">
                      {stat.numeric !== undefined ? (
                        <NumberTicker value={stat.numeric as number} suffix={stat.suffix} decimals={stat.decimals} />
                      ) : (
                        stat.value
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}
