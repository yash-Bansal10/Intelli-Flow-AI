import { useState, useEffect } from "react"

export interface JunctionData {
  lat: number
  lng: number
  queues: number[]
  score: number
  phase: string
  time_in_phase?: number
  sensors?: any
  is_emergency?: boolean
}

export interface SimulationState {
  simulation_time: number
  junctions: Record<string, JunctionData>
  total_congestion: number
  spatial_dictionary?: {
    junction_names: Record<string, string>
    junction_cities: Record<string, string>
  }
}

export function useSimData() {
  const [data, setData] = useState<SimulationState | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSimData = async () => {
      try {
        const url = process.env.NEXT_PUBLIC_SIM_API_URL || "http://localhost:5000"
        const res = await fetch(`${url}/live_data`)
        if (!res.ok) throw new Error("Backend offline")
        const json = await res.json()
        setData(json)
        setError(null)
      } catch (err: any) {
        setError(err.message)
      }
    }

    fetchSimData()
    const interval = setInterval(fetchSimData, 1000)
    return () => clearInterval(interval)
  }, [])

  return { data, error, isLoading: !data && !error }
}
