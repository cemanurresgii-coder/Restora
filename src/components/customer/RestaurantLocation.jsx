/**
 * RestaurantLocation
 * ──────────────────
 * Interactive map powered by Leaflet + OpenStreetMap (no API key required).
 * Features:
 *  - Zoomable, pannable map with restaurant marker + popup
 *  - "Get Directions" opens Google Maps with turn-by-turn routing
 *  - Transport mode tabs (Walking, Driving, Transit) with estimated times
 *  - Contact info and opening hours sidebar
 */

import { useEffect, useRef, useState } from 'react'
import { MapPin, Phone, Mail, Clock, Navigation, Car, PersonStanding, Train, ExternalLink } from 'lucide-react'

// ── Restaurant coordinates ────────────────────────────────────────────────────
const RESTAURANT = {
  lat:  40.9906,
  lng:  29.0291,
  name: 'Restora',
  address: 'Bağdat Caddesi No: 42, Kadıköy, İstanbul',
}

// ── Contact / Hours data ──────────────────────────────────────────────────────
const CONTACT = [
  { icon: MapPin, label: 'Address',      value: RESTAURANT.address,         href: `https://www.google.com/maps/dir/?api=1&destination=${RESTAURANT.lat},${RESTAURANT.lng}` },
  { icon: Phone,  label: 'Reservations', value: '+90 (212) 555 01 23',      href: 'tel:+902125550123' },
  { icon: Mail,   label: 'Email',        value: 'reservations@restora.com', href: 'mailto:reservations@restora.com' },
]

const HOURS = [
  { days: 'Monday – Friday', time: '12:00 – 22:30', open: true  },
  { days: 'Saturday',        time: '11:00 – 23:00', open: true  },
  { days: 'Sunday',          time: '11:00 – 22:00', open: true  },
]

const TRANSPORT = [
  { key: 'walking',  icon: PersonStanding, label: 'Walk',    time: '~12 min', travelMode: 'walking'  },
  { key: 'driving',  icon: Car,            label: 'Drive',   time: '~5 min',  travelMode: 'driving'  },
  { key: 'transit',  icon: Train,          label: 'Transit', time: '~8 min',  travelMode: 'transit'  },
]

// ── Detect today's open status ────────────────────────────────────────────────
function isOpenNow() {
  const now = new Date()
  const day  = now.getDay() // 0=Sun, 6=Sat
  const hour = now.getHours() + now.getMinutes() / 60
  if (day === 0) return hour >= 11 && hour < 22          // Sunday
  if (day === 6) return hour >= 11 && hour < 23          // Saturday
  return hour >= 12 && hour < 22.5                       // Mon–Fri
}

// ── Interactive Leaflet Map ───────────────────────────────────────────────────
function InteractiveMap({ onGetDirections }) {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const [mapError, setMapError]   = useState(false)
  const [mapReady, setMapReady]   = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    let aborted = false

    const initMap = async () => {
      try {
        // Dynamically import Leaflet to avoid SSR issues
        const L = (await import('leaflet')).default

        // If cleanup ran while we were awaiting the import, bail out
        if (aborted) return

        // Fix default icon paths (Vite asset hashing workaround)
        delete L.Icon.Default.prototype._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })

        // Destroy any existing map instance on this container (StrictMode / HMR)
        if (mapRef.current) {
          mapRef.current.remove()
          mapRef.current = null
        }
        // Clear Leaflet's internal container flag so it can re-initialize
        if (containerRef.current) {
          delete containerRef.current._leaflet_id
        }

        if (aborted || !containerRef.current) return

        const map = L.map(containerRef.current, {
          center:    [RESTAURANT.lat, RESTAURANT.lng],
          zoom:      16,
          zoomControl: true,
          scrollWheelZoom: true,
        })

        // OpenStreetMap tile layer (free, no API key)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map)

        // Custom branded marker
        const customIcon = L.divIcon({
          className: '',
          html: `<div style="
            width:40px;height:40px;background:#f97316;border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);border:3px solid #fff;
            box-shadow:0 4px 12px rgba(0,0,0,0.25);
          ">
            <div style="
              transform:rotate(45deg);width:100%;height:100%;
              display:flex;align-items:center;justify-content:center;font-size:16px;
            ">🍽️</div>
          </div>`,
          iconSize:   [40, 40],
          iconAnchor: [20, 40],
          popupAnchor:[0, -44],
        })

        L.marker([RESTAURANT.lat, RESTAURANT.lng], { icon: customIcon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width:160px;font-family:sans-serif;">
              <p style="font-weight:700;font-size:14px;margin:0 0 4px;">${RESTAURANT.name}</p>
              <p style="font-size:12px;color:#737373;margin:0 0 8px;">${RESTAURANT.address}</p>
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=${RESTAURANT.lat},${RESTAURANT.lng}"
                target="_blank"
                rel="noopener noreferrer"
                style="
                  display:inline-block;background:#f97316;color:#fff;
                  font-size:11px;font-weight:600;padding:4px 10px;
                  border-radius:8px;text-decoration:none;
                "
              >Get Directions →</a>
            </div>
          `, { maxWidth: 220 })
          .openPopup()

        if (aborted) {
          map.remove()
          return
        }

        mapRef.current = map
        setMapReady(true)
      } catch (err) {
        if (!aborted) {
          console.error('Map init error:', err)
          setMapError(true)
        }
      }
    }

    initMap()

    return () => {
      aborted = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-neutral-400 text-sm">
        Map unavailable — check your internet connection.
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* Leaflet CSS */}
      {!mapReady && (
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
      )}
      <style>{`
        .leaflet-container { font-family: inherit; }
        .leaflet-popup-content-wrapper { border-radius: 14px !important; box-shadow: 0 8px 24px rgba(0,0,0,.12) !important; }
        .leaflet-popup-tip { background: #fff !important; }
      `}</style>
      <div ref={containerRef} className="w-full h-full" />
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-400 border-t-transparent" />
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function RestaurantLocation() {
  const [activeTransport, setActiveTransport] = useState('walking')
  const openNow = isOpenNow()

  const getDirectionsUrl = (travelMode) => {
    const modes = { walking: 'walking', driving: 'driving', transit: 'transit' }
    return `https://www.google.com/maps/dir/?api=1&destination=${RESTAURANT.lat},${RESTAURANT.lng}&travelmode=${modes[travelMode] ?? 'walking'}`
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Find Us</h1>
          <p className="text-sm text-neutral-500 mt-1">
            We're in the heart of Kadıköy — easy to reach by metro, bus, or ferry.
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
          openNow
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-red-50 text-red-600 border-red-200'
        }`}>
          <span className={`w-2 h-2 rounded-full ${openNow ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
          {openNow ? 'Open Now' : 'Closed'}
        </div>
      </div>

      {/* ── Interactive Map ── */}
      <div className="bg-white rounded-2xl overflow-hidden border border-neutral-200 shadow-sm">
        {/* Transport mode selector */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100 flex-wrap">
          <Navigation size={14} className="text-neutral-400 shrink-0" />
          <span className="text-xs font-medium text-neutral-500 mr-1">Get Directions:</span>
          {TRANSPORT.map(({ key, icon: Icon, label, time, travelMode }) => (
            <button
              key={key}
              onClick={() => setActiveTransport(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                activeTransport === key
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-brand-300'
              }`}
            >
              <Icon size={11} />
              {label}
              <span className={`${activeTransport === key ? 'text-orange-100' : 'text-neutral-400'}`}>
                {time}
              </span>
            </button>
          ))}
          <a
            href={getDirectionsUrl(activeTransport)}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-800 transition"
          >
            <ExternalLink size={12} />
            Open in Google Maps
          </a>
        </div>

        {/* Leaflet map */}
        <div style={{ height: '380px' }}>
          <InteractiveMap />
        </div>

        {/* Map attribution notice */}
        <div className="px-4 py-2 border-t border-neutral-100 text-[10px] text-neutral-400">
          Map data © OpenStreetMap contributors · Interactive map powered by Leaflet
        </div>
      </div>

      {/* ── Info cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Contact */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Contact</h2>
          {CONTACT.map(({ icon: Icon, label, value, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 group"
            >
              <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-brand-100 transition">
                <Icon size={14} className="text-brand-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-400">{label}</p>
                <p className="text-sm font-medium text-neutral-800 group-hover:text-brand-600 transition leading-snug">
                  {value}
                </p>
              </div>
            </a>
          ))}
        </div>

        {/* Opening hours */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
            <Clock size={13} className="text-neutral-400" /> Opening Hours
          </h2>
          <div className="space-y-3">
            {HOURS.map(({ days, time }) => {
              const todayIdx = new Date().getDay()
              const isSat = todayIdx === 6
              const isSun = todayIdx === 0
              const isToday = (days.includes('Saturday') && isSat) || (days.includes('Sunday') && isSun) || (days.includes('Monday') && !isSat && !isSun)
              return (
                <div key={days} className={`flex items-center justify-between ${isToday ? 'text-brand-600' : ''}`}>
                  <span className={`text-sm ${isToday ? 'font-semibold text-brand-700' : 'text-neutral-600'}`}>
                    {days}
                    {isToday && <span className="ml-1.5 text-[10px] bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded-full font-semibold">Today</span>}
                  </span>
                  <span className={`text-sm font-semibold tabular-nums ${isToday ? 'text-brand-700' : 'text-neutral-900'}`}>
                    {time}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="pt-2 border-t border-neutral-100">
            <p className="text-xs text-neutral-400">
              Kitchen closes 30 min before closing. Last reservation accepted 1 hour prior.
            </p>
          </div>
        </div>
      </div>

      {/* ── How to reach us ── */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm">
        <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">How to Reach Us</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Train,         label: 'Metro',  desc: 'Kadıköy M4 station — 3 min walk along Bağdat Caddesi' },
            { icon: Car,           label: 'By Car', desc: 'Parking available on Söğütlüçeşme Caddesi (paid)' },
            { icon: PersonStanding,label: 'Ferry',  desc: 'Kadıköy Ferry Terminal — 12 min walk along the coast' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                <Icon size={14} className="text-neutral-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-800">{label}</p>
                <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
