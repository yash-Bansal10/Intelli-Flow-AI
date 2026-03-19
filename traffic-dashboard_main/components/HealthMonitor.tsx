import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Cpu, Camera, Mic, HardDrive, Tv, Watch } from "lucide-react"

export function HealthMonitor() {
  const metrics = [
    {
      title: "DQN Agent",
      icon: <Activity className="w-5 h-5 text-indigo-500" />,
      stats: [
        { label: "Inference Time", value: "12ms" },
        { label: "Last Action", value: "SWITCH" },
      ],
    },
    {
      title: "ESP32-CAM",
      icon: <Camera className="w-5 h-5 text-sky-500" />,
      stats: [
        { label: "Stream FPS", value: "24.5" },
        { label: "Latency", value: "85ms" },
      ],
    },
    {
      title: "INMP441 Mic",
      icon: <Mic className="w-5 h-5 text-emerald-500" />,
      stats: [
        { label: "Audio Level", value: "-12dB" },
        { label: "Siren Conf.", value: "2%" },
      ],
    },
    {
      title: "ESP32 Controller",
      icon: <Cpu className="w-5 h-5 text-orange-500" />,
      stats: [
        { label: "GPIO Status", value: "OK" },
        { label: "Uptime", value: "14d 2h" },
      ],
    },
    {
      title: "OLED Display",
      icon: <Tv className="w-5 h-5 text-violet-500" />,
      stats: [
        { label: "State", value: "Active" },
        { label: "Refresh", value: "60Hz" },
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

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {metrics.map((metric, i) => (
        <Card key={i} className="bg-white border-slate-200 shadow-sm shadow-slate-200/50 hover:border-blue-200 transition-colors">
          <CardHeader className="p-3 pb-2 flex flex-row items-center gap-2 space-y-0">
            {metric.icon}
            <CardTitle className="text-sm font-semibold text-slate-700">{metric.title}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="space-y-1">
              {metric.stats.map((stat, j) => (
                <div key={j} className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">{stat.label}</span>
                  <span className="font-medium text-slate-800 font-mono">{stat.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
