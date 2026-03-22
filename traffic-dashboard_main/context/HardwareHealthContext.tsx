"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react"

// Define the structure for individual hardware health
export type HardwareStatus = Record<string, boolean> // { "Vision AI (YOLOv11)": true, ... }

interface HardwareHealthContextType {
  healthState: Record<string, HardwareStatus>
  junctionNames: Record<string, string>
  junctionCities: Record<string, string>
  setHardwareStatus: (junctionId: string, hardwareName: string, status: boolean) => void
  getHardwareStatus: (junctionId: string, hardwareName: string) => boolean
  getMalfunctionCount: (junctionId: string) => number
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

  // Refs to track in-flight requests and rate limiting
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

  const setHardwareStatus = (junctionId: string, hardwareName: string, status: boolean) => {
    setHealthState((prev) => ({
      ...prev,
      [junctionId]: {
        ...(prev[junctionId] || {}),
        [hardwareName]: status,
      },
    }))
  }

  const getHardwareStatus = (junctionId: string, hardwareName: string) => {
    if (!healthState[junctionId] || healthState[junctionId][hardwareName] === undefined) {
      return true
    }
    return healthState[junctionId][hardwareName]
  }

  const getMalfunctionCount = (junctionId: string) => {
    const status = healthState[junctionId]
    if (!status) return 0
    return Object.values(status).filter(s => s === false).length
  }

  const resolveJunctionName = async (jid: string, lat: number, lng: number) => {
    if (junctionNames[jid] || pendingRef.current.has(jid)) return

    pendingRef.current.add(jid)

    try {
      // Nominatim requires 1s between requests.
      // Calculate how long to wait based on the LAST global request.
      const now = Date.now()
      const timeSinceLast = now - lastRequestTimeRef.current
      const waitTime = Math.max(0, 1100 - timeSinceLast) // 1.1s buffer

      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }

      // Update last request time AFTER the wait to prevent race conditions on next call
      lastRequestTimeRef.current = Date.now()

      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      if (!res.ok) throw new Error("API Limit or Network Error")
      
      const d = await res.json()
      if (d.address) {
        const name = [d.address.road || d.address.suburb || d.address.neighbourhood].filter(Boolean).join(", ")
        const city = d.address.city || d.address.town || d.address.village || d.address.suburb || d.address.state || "Unknown District"
        
        setHealthState(prev => prev) // Trigger re-render if needed, though junctionNames update handles it
        setJunctionNames(prev => ({ ...prev, [jid]: name || `Junction ${jid}` }))
        setJunctionCities(prev => ({ ...prev, [jid]: city }))
      }
    } catch (e) {
      console.error("Geocoding failed for", jid, e)
    } finally {
      pendingRef.current.delete(jid)
    }
  }

  const injectSpatialDictionary = (dict: { junction_names: Record<string, string>, junction_cities: Record<string, string> }) => {
    // Only inject if there is actual new data to avoid infinite re-renders
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
  }

  return (
    <HardwareHealthContext.Provider value={{ 
      healthState, 
      junctionNames, 
      junctionCities,
      setHardwareStatus, 
      getHardwareStatus, 
      getMalfunctionCount,
      resolveJunctionName,
      injectSpatialDictionary
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
