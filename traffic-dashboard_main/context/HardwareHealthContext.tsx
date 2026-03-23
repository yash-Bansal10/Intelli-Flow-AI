"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from "react"

export type HardwareStatus = Record<string, boolean>

// Critical hardware whose fault turns alerts RED
export const CRITICAL_HARDWARE = ["Vision AI (YOLOv11)", "IP Cameras (RTSP)", "PCU Calculator"]

interface HardwareHealthContextType {
  healthState: Record<string, HardwareStatus>
  junctionNames: Record<string, string>
  junctionCities: Record<string, string>
  junctionDowntimeMs: Record<string, number>
  activeFaultStartTimes: Record<string, number>
  sessionStartTime: number
  setHardwareStatus: (junctionId: string, hardwareName: string, status: boolean) => void
  getHardwareStatus: (junctionId: string, hardwareName: string) => boolean
  getMalfunctionCount: (junctionId: string) => number
  // Returns all junctions that have at least one fault
  getFaultedJunctions: () => Array<{ jid: string; isCritical: boolean }>
  resolveJunctionName: (junctionId: string, lat: number, lng: number) => void
  injectSpatialDictionary: (dict: { junction_names: Record<string, string>, junction_cities: Record<string, string> }) => void
}

const HardwareHealthContext = createContext<HardwareHealthContextType | undefined>(undefined)

export function HardwareHealthProvider({ children }: { children: ReactNode }) {
  const [healthState, setHealthState] = useState<Record<string, HardwareStatus>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("intelliflow_hardware_health")
      return saved ? JSON.parse(saved) : {}
    }
    return {}
  })

  const [junctionNames, setJunctionNames] = useState<Record<string, string>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("intelliflow_junction_names")
      return saved ? JSON.parse(saved) : {}
    }
    return {}
  })

  const [junctionCities, setJunctionCities] = useState<Record<string, string>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("intelliflow_junction_cities")
      return saved ? JSON.parse(saved) : {}
    }
    return {}
  })

  // Downtime resets every page load — uptime always starts at 100% for demo
  const [junctionDowntimeMs, setJunctionDowntimeMs] = useState<Record<string, number>>({})

  // Session start time resets on every page load
  const [sessionStartTime] = useState<number>(() => Date.now())

  // Track when each junction went into a fault state
  const [activeFaultStartTimes, setActiveFaultStartTimes] = useState<Record<string, number>>({})

  // Refs for geocoding
  const pendingRef = useRef<Set<string>>(new Set())
  const lastRequestTimeRef = useRef<number>(0)

  // Persistence
  useEffect(() => {
    localStorage.setItem("intelliflow_hardware_health", JSON.stringify(healthState))
  }, [healthState])

  useEffect(() => {
    localStorage.setItem("intelliflow_junction_names", JSON.stringify(junctionNames))
  }, [junctionNames])

  useEffect(() => {
    localStorage.setItem("intelliflow_junction_cities", JSON.stringify(junctionCities))
  }, [junctionCities])

  useEffect(() => {
    localStorage.setItem("intelliflow_junction_downtime", JSON.stringify(junctionDowntimeMs))
  }, [junctionDowntimeMs])

  // Watch healthState and track fault start/end times per junction
  useEffect(() => {
    const now = Date.now()
    Object.entries(healthState).forEach(([jid, hwMap]) => {
      const hasFault = Object.values(hwMap).some(v => v === false)
      const wasTracking = activeFaultStartTimes[jid] !== undefined

      if (hasFault && !wasTracking) {
        setActiveFaultStartTimes(prev => ({ ...prev, [jid]: now }))
      } else if (!hasFault && wasTracking) {
        const faultDuration = now - activeFaultStartTimes[jid]
        setActiveFaultStartTimes(prev => {
          const next = { ...prev }
          delete next[jid]
          return next
        })
        setJunctionDowntimeMs(prev => ({
          ...prev,
          [jid]: (prev[jid] || 0) + faultDuration
        }))
      }
    })
  }, [healthState, activeFaultStartTimes])

  const getFaultedJunctions = useCallback(() => {
    return Object.entries(healthState)
      .filter(([, hwMap]) => Object.values(hwMap).some(v => v === false))
      .map(([jid, hwMap]) => {
        const isCritical = CRITICAL_HARDWARE.some(ch => hwMap[ch] === false)
        return { jid, isCritical }
      })
  }, [healthState])

  const setHardwareStatus = useCallback((junctionId: string, hardwareName: string, status: boolean) => {
    setHealthState((prev) => ({
      ...prev,
      [junctionId]: {
        ...(prev[junctionId] || {}),
        [hardwareName]: status,
      },
    }))
  }, [])

  const getHardwareStatus = useCallback((junctionId: string, hardwareName: string) => {
    if (!healthState[junctionId] || healthState[junctionId][hardwareName] === undefined) {
      return true
    }
    return healthState[junctionId][hardwareName]
  }, [healthState])

  const getMalfunctionCount = useCallback((junctionId: string) => {
    const status = healthState[junctionId]
    if (!status) return 0
    return Object.values(status).filter(s => s === false).length
  }, [healthState])

  const resolveJunctionName = useCallback(async (jid: string, lat: number, lng: number) => {
    if (junctionNames[jid] || pendingRef.current.has(jid)) return
    pendingRef.current.add(jid)
    try {
      const now = Date.now()
      const waitTime = Math.max(0, 1100 - (now - lastRequestTimeRef.current))
      if (waitTime > 0) await new Promise(resolve => setTimeout(resolve, waitTime))
      lastRequestTimeRef.current = Date.now()
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      if (!res.ok) throw new Error("API Limit")
      const d = await res.json()
      if (d.address) {
        const name = [d.address.road || d.address.suburb || d.address.neighbourhood].filter(Boolean).join(", ")
        const city = d.address.city || d.address.town || d.address.village || d.address.suburb || d.address.state || "Unknown District"
        setJunctionNames(prev => ({ ...prev, [jid]: name || `Junction ${jid}` }))
        setJunctionCities(prev => ({ ...prev, [jid]: city }))
      }
    } catch (e) {
      console.error("Geocoding failed for", jid, e)
    } finally {
      pendingRef.current.delete(jid)
    }
  }, [junctionNames])

  const injectSpatialDictionary = useCallback((dict: { junction_names: Record<string, string>, junction_cities: Record<string, string> }) => {
    if (dict && Object.keys(dict.junction_names || {}).length > 0) {
      setJunctionNames(prev => {
        const hasNew = Object.keys(dict.junction_names).some(k => !prev[k])
        return hasNew ? { ...prev, ...dict.junction_names } : prev
      })
      setJunctionCities(prev => {
        const hasNew = Object.keys(dict.junction_cities).some(k => !prev[k])
        return hasNew ? { ...prev, ...dict.junction_cities } : prev
      })
    }
  }, [])

  return (
    <HardwareHealthContext.Provider value={{
      healthState,
      junctionNames,
      junctionCities,
      junctionDowntimeMs,
      activeFaultStartTimes,
      sessionStartTime,
      setHardwareStatus,
      getHardwareStatus,
      getMalfunctionCount,
      getFaultedJunctions,
      resolveJunctionName,
      injectSpatialDictionary,
    }}>
      {children}
    </HardwareHealthContext.Provider>
  )
}

export function useHardwareHealth() {
  const context = useContext(HardwareHealthContext)
  if (context === undefined) {
    throw new Error("useHardwareHealth must be used within a HardwareHealthProvider")
  }
  return context
}
