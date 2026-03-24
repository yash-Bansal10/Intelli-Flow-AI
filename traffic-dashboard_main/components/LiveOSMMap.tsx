"use client"

import { useEffect, useRef } from "react"
import type { SimulationState } from "@/hooks/useSimData"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { Clock, AlertTriangle, AlertCircle } from "lucide-react"
import { useHardwareHealth } from "@/context/HardwareHealthContext"

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
  const faultMarkersRef = useRef<Record<string, L.Marker>>({})
  const evpMarkersRef = useRef<Record<string, L.Marker>>({})
  const boundsSet = useRef(false)
  
  const { getMalfunctionCount, healthState, junctionNames } = useHardwareHealth()

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

      // Congestion-score-based coloring
      const score = data.score || 0
      let color: string
      if (score >= 100) {
        color = '#ef4444' // Red — high congestion
      } else if (score >= 50) {
        color = '#f59e0b' // Orange-yellow — moderate
      } else {
        color = '#10b981' // Green — clear
      }
      // Emergency overrides all
      const isEvpActive = data.is_emergency === true
      if (isEvpActive) color = '#22c55e' // Neon Green Wave
      const radius = isEvpActive ? 16 : (isEmergencyActive ? 16 : 10)

      const malCount = getMalfunctionCount(jid)
      const jName = simulationData?.spatial_dictionary?.junction_names?.[jid] || junctionNames[jid] || jid // Use real-world name from atlas if available

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
        const updateTooltip = (name: string, c: string, s: number, ph: string) => `
          <div style="font-family: inherit; margin: 0; padding: 4px; min-width: 140px;">
            <h4 style="font-weight: bold; font-size: 13px; margin-bottom: 2px; color: #1e293b;">${name}</h4>
            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
               <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${c};"></span>
               <p style="margin: 0; color: #64748b; font-size: 11px; font-weight: 600;">Phase: ${ph}</p>
            </div>
            <p style="margin: 0; color: #64748b; font-size: 11px;">AI Congestion: <strong>${Math.floor(s)}</strong></p>
            ${isEvpActive ? '<p style="margin: 4px 0 0 0; color: #ef4444; font-size: 10px; font-weight: 800; text-transform: uppercase;">🚨 EVP OVERRIDE ACTIVE</p>' : ''}
            <p style="margin: 4px 0 0 0; color: #3b82f6; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Click for Live Telemetry</p>
          </div>
        `

        marker.bindTooltip(updateTooltip(jName, color, data.score, data.phase), { 
          direction: 'top', 
          offset: [0, -10], 
          opacity: 0.95, 
          className: 'custom-leaflet-tooltip' 
        })

        // Click opens the React Junction Drawer
        marker.on('click', () => onNodeClick(jid))

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
        const updateTooltip = (name: string, c: string, s: number, ph: string) => `
          <div style="font-family: inherit; margin: 0; padding: 4px; min-width: 140px;">
            <h4 style="font-weight: bold; font-size: 13px; margin-bottom: 2px; color: #1e293b;">${name}</h4>
            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
               <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${c};"></span>
               <p style="margin: 0; color: #64748b; font-size: 11px; font-weight: 600;">Phase: ${ph}</p>
            </div>
            <p style="margin: 0; color: #64748b; font-size: 11px;">AI Congestion: <strong>${Math.floor(s)}</strong></p>
            ${isEvpActive ? '<p style="margin: 4px 0 0 0; color: #ef4444; font-size: 10px; font-weight: 800; text-transform: uppercase;">🚨 EVP OVERRIDE ACTIVE</p>' : ''}
            <p style="margin: 4px 0 0 0; color: #3b82f6; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Click for Live Telemetry</p>
          </div>
        `
        marker.setTooltipContent(updateTooltip(jName, color, data.score, data.phase))
      }

      // Day 9: Severity Fault Indicators — RED for critical HW, YELLOW for non-critical
      const CRITICAL_HW = ["Vision AI (YOLOv11)", "IP Cameras (RTSP)", "PCU Calculator"]
      if (malCount > 0) {
        const hwMap = healthState[jid] || {}
        const hasCriticalFault = CRITICAL_HW.some(hw => hwMap[hw] === false)
        const alertColor = hasCriticalFault ? "#ef4444" : "#f59e0b"
        const pulseClass = hasCriticalFault ? "animate-pulse" : ""
        
        const faultIcon = L.divIcon({
          className: 'custom-fault-icon',
          html: `
            <div class="flex items-center justify-center ${pulseClass}" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${alertColor}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 25], // Positioned above the circle marker
        })

        if (!faultMarkersRef.current[jid]) {
          faultMarkersRef.current[jid] = L.marker([data.lat, data.lng], { icon: faultIcon, interactive: false }).addTo(map)
        } else {
          faultMarkersRef.current[jid].setLatLng([data.lat, data.lng])
          faultMarkersRef.current[jid].setIcon(faultIcon)
          faultMarkersRef.current[jid].setOpacity(1)
        }
      } else {
        if (faultMarkersRef.current[jid]) {
          faultMarkersRef.current[jid].setOpacity(0)
        }
      }

      // EVP Icon Overlays
      if (isEvpActive) {
        const evpIcon = L.divIcon({
          className: 'custom-evp-icon',
          html: `
            <div class="flex items-center justify-center animate-bounce shadow-xl bg-white rounded-full p-1 border-2 border-red-500" style="filter: drop-shadow(0 4px 6px rgba(225,29,72,0.6));">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11h12Z"/><path d="M14 8h5.36a2 2 0 0 1 1.76 1.05l3 6A2 2 0 0 1 24 16v2h-10"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 8h4"/><path d="M10 6v4"/>
              </svg>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 40], // Stack slightly higher than the map circle
        })

        if (!evpMarkersRef.current[jid]) {
          evpMarkersRef.current[jid] = L.marker([data.lat, data.lng], { icon: evpIcon, interactive: false }).addTo(map)
        } else {
          evpMarkersRef.current[jid].setLatLng([data.lat, data.lng])
          evpMarkersRef.current[jid].setIcon(evpIcon)
          evpMarkersRef.current[jid].setOpacity(1)
        }
      } else {
        if (evpMarkersRef.current[jid]) {
          evpMarkersRef.current[jid].setOpacity(0)
        }
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
