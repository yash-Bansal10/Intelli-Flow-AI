"use client"
import { useEffect, useState } from "react"
import { animate } from "framer-motion"

interface NumberTickerProps {
  value: number
  suffix?: string
  prefix?: string
  duration?: number
  decimals?: number
}

export function NumberTicker({ value, suffix = "", prefix = "", duration = 1.5, decimals = 0 }: NumberTickerProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => setCount(latest)
    })
    return controls.stop
  }, [value, duration])

  return (
    <span>
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </span>
  )
}
