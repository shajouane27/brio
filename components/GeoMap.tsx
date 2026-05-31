'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

function regionFor(niveau?: string): { center: [number, number]; zoom: number; label: string } {
  const n = niveau || ''
  if (['CP', 'CE1', 'CE2', 'CM1', 'CM2'].some((x) => n.includes(x))) {
    return { center: [46.6, 2.4], zoom: 5, label: 'France' }
  }
  if (['6ème', '5ème', '4ème', '3ème'].some((x) => n.includes(x))) {
    return { center: [50, 12], zoom: 3.4, label: 'Europe' }
  }
  return { center: [25, 5], zoom: 1.6, label: 'Monde' }
}

export default function GeoMap({ niveau }: { niveau?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  const { label } = regionFor(niveau)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !containerRef.current || mapRef.current) return
      const { center, zoom } = regionFor(niveau)
      const map = L.map(containerRef.current, { scrollWheelZoom: false, attributionControl: true }).setView(center, zoom)
      mapRef.current = map
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
      }).addTo(map)
      setTimeout(() => map.invalidateSize(), 200)
    })()

    return () => {
      cancelled = true
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [niveau])

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-100 text-brand-700">🗺️</span>
        Carte — {label}
      </h3>
      <div ref={containerRef} className="h-64 w-full rounded-xl overflow-hidden relative z-0" />
    </div>
  )
}
