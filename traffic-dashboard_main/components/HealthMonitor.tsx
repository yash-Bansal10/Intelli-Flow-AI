import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Cpu, Camera, Mic, Tv, Watch, Route, Wifi, CloudRain, ScanLine, CarFront } from "lucide-react"
import { motion } from "framer-motion"
import { NumberTicker } from "./NumberTicker"

interface MetricStat {
  label: string;
  value?: string;
  numeric?: number;
  suffix?: string;
  decimals?: number;
}

export function HealthMonitor({ sensors, junctionId }: { sensors?: any, junctionId?: string }) {
  const metrics: { title: string, icon: JSX.Element, stats: MetricStat[] }[] = [
    {
      title: "Vision AI (YOLOv11)",
      icon: <ScanLine className="w-5 h-5 text-indigo-500" />,
      stats: [{ label: "Inference", value: sensors?.yolo_inference || "12ms" }, { label: "State", value: "Active" }]
    },
    {
      title: "PCU Calculator",
      icon: <CarFront className="w-5 h-5 text-indigo-400" />,
      stats: [{ label: "Processing", value: sensors?.pcu_calcs || "0.0/sec" }, { label: "Queue", value: "Counting" }]
    },
    {
      title: "Sensor Fusion",
      icon: <Cpu className="w-5 h-5 text-indigo-600" />,
      stats: [{ label: "Status", value: sensors?.sensor_fusion || "Synced" }, { label: "Nodes", numeric: 4 }]
    },
    {
      title: "IP Cameras (RTSP)",
      icon: <Camera className="w-5 h-5 text-sky-500" />,
      stats: [{ label: "Stream", value: sensors?.cam_status || "Active" }, { label: "Night Mode", value: sensors?.night_vision || "Auto" }]
    },
    {
      title: "Vehicle Presence",
      icon: <Route className="w-5 h-5 text-amber-500" />,
      stats: [{ label: "LiDAR Conf", value: sensors?.lidar_conf || "98%" }, { label: "Radar Speed", value: sensors?.radar_speed || "30 km/h" }]
    },
    {
      title: "Audio Detection",
      icon: <Mic className="w-5 h-5 text-emerald-400" />,
      stats: [{ label: "Siren Det.", value: sensors?.audio_siren || "None Detected" }, { label: "Mic", value: "Online" }]
    },
    {
      title: "Weather Sensing",
      icon: <CloudRain className="w-5 h-5 text-sky-400" />,
      stats: [{ label: "Condition", value: sensors?.weather || "Clear" }, { label: "Rain/Fog", value: "Negative" }]
    },
    {
      title: "Traffic AI Engine",
      icon: <Activity className="w-5 h-5 text-rose-500" />,
      stats: [{ label: "DQN Latency", value: sensors?.dqn_latency || "8ms" }, { label: "Max Press.", value: "Opt." }]
    },
    {
      title: "Safety Controller",
      icon: <Watch className="w-5 h-5 text-emerald-600" />,
      stats: [{ label: "Watchdog", value: sensors?.watchdog || "OK" }, { label: "Darkening", value: "10s lock" }]
    },
    {
      title: "Intersection Mesh",
      icon: <Wifi className="w-5 h-5 text-violet-500" />,
      stats: [{ label: "V2X Sync", value: sensors?.v2x_sync || "3ms" }, { label: "Corridor", value: "Idle" }]
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
