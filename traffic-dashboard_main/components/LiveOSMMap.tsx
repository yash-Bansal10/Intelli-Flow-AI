"use client"

import { useEffect, useRef } from "react"
import type { SimulationState } from "@/hooks/useSimData"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { Clock, AlertTriangle } from "lucide-react"

export interface LiveOSMMapProps {
  simulationData: SimulationState | null
  onNodeClick: (id: string) => void
  isEmergencyActive: boolean
  selectedJunctionId?: string | null
}

export default function LiveOSMMap({ simulationData, onNodeClick, isEmergencyActive, selectedJunctionId }: LiveOSMMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markersRef = useRef<Record<string, L.CircleMarker>>({})
  const boundsSet = useRef(false)

  // Initialize Map Once
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return

    // Fix leaflet default icon issue in Next.js
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    })

    const map = L.map(mapContainer.current, {
      center: [28.6315, 77.2167], // Default Connaught Place
      zoom: 15,
      zoomControl: false,
    })

    // Beautiful, distraction-free CartoDB Light base map
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 20
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)
    mapInstance.current = map

    return () => {
      mapInstance.current?.remove()
      mapInstance.current = null
    }
  }, [])

  // Update Markers when Simulation Data changes
  useEffect(() => {
    const map = mapInstance.current
    if (!map || !simulationData?.junctions) return

    const junctions = simulationData.junctions
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180
    let hasCoords = false

    Object.entries(junctions).forEach(([jid, data]) => {
      if (!data.lat || !data.lng) return

      minLat = Math.min(minLat, data.lat)
      maxLat = Math.max(maxLat, data.lat)
      minLng = Math.min(minLng, data.lng)
      maxLng = Math.max(maxLng, data.lng)
      hasCoords = true

      // Determine colors
      const isRed = data.phase.includes("RED")
      const color = isEmergencyActive ? '#ef4444' : (isRed ? '#f43f5e' : '#10b981')
      const radius = isEmergencyActive ? 16 : 10

      // Create or update marker
      if (!markersRef.current[jid]) {
        const marker = L.circleMarker([data.lat, data.lng], {
          radius: radius,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(map)

        // Custom Tooltip (Hover)
        marker.bindTooltip(`
          <div style="font-family: inherit; margin: 0; padding: 4px;">
            <h4 style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">AI Junction ${jid}</h4>
            <p style="margin: 0; color: #64748b; font-size: 12px;">Phase: <span style="color: ${color}; font-weight: bold;">${data.phase}</span></p>
            <p style="margin: 0; color: #64748b; font-size: 12px;">AI Score: <strong>${data.score}</strong> (Delay)</p>
            <p style="margin: 4px 0 0 0; color: #3b82f6; font-size: 10px; font-weight: bold; text-transform: uppercase;">Click for Telemetry</p>
          </div>
        `, { direction: 'top', offset: [0, -10], opacity: 0.95, className: 'custom-leaflet-tooltip' })

        // Click opens the React Junction Drawer
        marker.on('click', () => {
          onNodeClick(jid)
        })

        // Add glow effect on hover
        marker.on('mouseover', function(this: L.CircleMarker) {
          this.setStyle({ weight: 4, color: '#38bdf8' })
        })
        marker.on('mouseout', function(this: L.CircleMarker) {
          this.setStyle({ weight: 2, color: '#ffffff' })
        })

        markersRef.current[jid] = marker
      } else {
        const marker = markersRef.current[jid]
        marker.setLatLng([data.lat, data.lng])
        marker.setStyle({ fillColor: color, radius: radius })
        
        // Update tooltip content dynamically
        marker.setTooltipContent(`
          <div style="font-family: inherit; margin: 0; padding: 4px;">
            <h4 style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">AI Junction ${jid}</h4>
            <p style="margin: 0; color: #64748b; font-size: 12px;">Phase: <span style="color: ${color}; font-weight: bold;">${data.phase}</span></p>
            <p style="margin: 0; color: #64748b; font-size: 12px;">AI Score: <strong>${data.score}</strong> (Delay)</p>
            <p style="margin: 4px 0 0 0; color: #3b82f6; font-size: 10px; font-weight: bold; text-transform: uppercase;">Click for Telemetry</p>
          </div>
        `)
      }
    })

    // Auto-center map on first valid data packet
    if (hasCoords && !boundsSet.current) {
      map.fitBounds([
        [minLat - 0.002, minLng - 0.002],
        [maxLat + 0.002, maxLng + 0.002]
      ], { animate: true, padding: [50, 50] })
      boundsSet.current = true
    }

  }, [simulationData, isEmergencyActive, onNodeClick])

  // Cinematic Auto-Zoom & Pan Offset
  useEffect(() => {
    const map = mapInstance.current
    if (!map || !selectedJunctionId || !simulationData?.junctions) return
    
    const jData = simulationData.junctions[selectedJunctionId]
    if (jData && jData.lat && jData.lng) {
      // 1. Fly to the exact WGS84 coordinate at street-level zoom
      map.flyTo([jData.lat, jData.lng], 17.5, { animate: true, duration: 1.2 })
      
      // 2. Offset the camera explicitly to keep the node fully visible in the left half
      // Panning the camera +250px Right actively pushes the junction -250px Left on the screen!
      setTimeout(() => {
        if (mapInstance.current) {
          mapInstance.current.panBy([250, 0], { animate: true, duration: 0.8 })
        }
      }, 1300)
    }
    // Only fire when the target ID changes, not on continuous data stream
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJunctionId])

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-slate-200/50 shadow-inner">
      <div ref={mapContainer} className="w-full h-full z-0" />

      {/* Analytics Overlay Header */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
        
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 border border-slate-200 shadow-lg rounded-xl flex items-center gap-3 w-max transition-all">
          <Clock className="w-5 h-5 text-indigo-500" />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Sim Time</p>
            <p className="text-xl font-black text-slate-800 leading-none font-mono">
              {simulationData ? simulationData.simulation_time : "--"}s
            </p>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md px-4 py-2 border border-slate-200 shadow-lg rounded-xl flex items-center gap-3 w-max transition-all">
          <AlertTriangle className={`w-5 h-5 ${isEmergencyActive ? 'text-red-500 animate-pulse' : 'text-amber-500'}`} />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">City Congestion</p>
            <p className={`text-xl font-black leading-none font-mono ${isEmergencyActive ? 'text-red-500' : 'text-amber-600'}`}>
              {simulationData ? Math.floor(simulationData.total_congestion) : "--"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
