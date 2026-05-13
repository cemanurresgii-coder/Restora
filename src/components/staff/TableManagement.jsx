import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Users, Loader2 } from 'lucide-react'
import {
  TABLE_STATUS,
  initializeTables,
  updateTableStatus,
  subscribeTableUpdates,
} from '../../services/tableService'

// ── Status display config ────────────────────────────────────────────────────

const STATUS_CONFIG = {
  [TABLE_STATUS.AVAILABLE]: {
    label: 'Available',
    dot:   'bg-emerald-400',
    card:  'border-emerald-200 bg-emerald-50/60',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  [TABLE_STATUS.RESERVED]: {
    label: 'Reserved',
    dot:   'bg-amber-400',
    card:  'border-amber-200 bg-amber-50/60',
    badge: 'bg-amber-100 text-amber-700',
  },
  [TABLE_STATUS.OCCUPIED]: {
    label: 'Occupied',
    dot:   'bg-red-400',
    card:  'border-red-200 bg-red-50/60',
    badge: 'bg-red-100 text-red-600',
  },
}

// Button appearance for the 3-way status picker
const BTN_ACTIVE = {
  [TABLE_STATUS.AVAILABLE]: 'bg-emerald-500 border-emerald-500 text-white',
  [TABLE_STATUS.RESERVED]:  'bg-amber-400  border-amber-400  text-white',
  [TABLE_STATUS.OCCUPIED]:  'bg-red-500    border-red-500    text-white',
}
const BTN_INACTIVE =
  'bg-white border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'

const STATUS_ORDER = [TABLE_STATUS.AVAILABLE, TABLE_STATUS.RESERVED, TABLE_STATUS.OCCUPIED]

// Zones rendered in this fixed order with a decorative icon
const ZONES = [
  { key: 'Indoor',  icon: '🏠' },
  { key: 'Window',  icon: '🪟' },
  { key: 'Outdoor', icon: '🌿' },
]

// ── Table card ───────────────────────────────────────────────────────────────

function TableCard({ table }) {
  const [busy, setBusy] = useState(false)
  const config = STATUS_CONFIG[table.status] ?? STATUS_CONFIG[TABLE_STATUS.AVAILABLE]

  const handleStatusChange = async (newStatus) => {
    if (newStatus === table.status || busy) return
    setBusy(true)
    try {
      await updateTableStatus(table.id, newStatus)
      // No local state update needed — subscribeTableUpdates will fire and re-render
      toast.success(`Table ${table.tableNumber} → ${STATUS_CONFIG[newStatus].label}`)
    } catch {
      toast.error(`Failed to update Table ${table.tableNumber}.`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`rounded-2xl border p-4 transition-colors ${config.card}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-neutral-900 text-base">Table {table.tableNumber}</p>
            {busy && <Loader2 size={13} className="animate-spin text-neutral-400" />}
          </div>
          <div className="flex items-center gap-1 mt-0.5 text-xs text-neutral-500">
            <Users size={11} />
            <span>{table.capacity} seats</span>
          </div>
        </div>

        {/* Status badge */}
        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${config.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
          {config.label}
        </span>
      </div>

      {/* 3-way status picker */}
      <div className="flex rounded-xl overflow-hidden border border-neutral-200 divide-x divide-neutral-200">
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            onClick={() => handleStatusChange(s)}
            disabled={busy}
            className={`flex-1 py-1.5 text-[11px] font-semibold transition border-0
              ${table.status === s ? BTN_ACTIVE[s] : BTN_INACTIVE}
              disabled:opacity-60`}
          >
            {STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function TableManagement() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [initError, setInitError] = useState(null)

  useEffect(() => {
    // 1. Seed the Firestore collection (merge:true preserves live statuses)
    initializeTables().catch((e) => setInitError(e.message))

    // 2. Subscribe to real-time updates
    const unsub = subscribeTableUpdates((data) => {
      setTables(data)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  // Summary counts for the header bar
  const counts = tables.reduce(
    (acc, t) => ({ ...acc, [t.status]: (acc[t.status] ?? 0) + 1 }),
    {}
  )

  // Group tables by zone for display
  const byZone = ZONES.reduce((acc, { key }) => {
    acc[key] = tables.filter((t) => t.zone === key)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-400 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Table Management</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Real-time floor status — updates push instantly to all connected devices.
        </p>
      </div>

      {initError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          Could not initialise table records: {initError}
        </div>
      )}

      {/* Summary strip */}
      <div className="flex flex-wrap gap-3">
        {[
          { status: TABLE_STATUS.AVAILABLE, color: 'bg-emerald-100 text-emerald-700' },
          { status: TABLE_STATUS.RESERVED,  color: 'bg-amber-100 text-amber-700'    },
          { status: TABLE_STATUS.OCCUPIED,  color: 'bg-red-100 text-red-600'        },
        ].map(({ status, color }) => (
          <div key={status} className={`flex items-center gap-2 px-4 py-2 rounded-xl ${color} font-semibold text-sm`}>
            <span>{counts[status] ?? 0}</span>
            <span className="font-normal">{STATUS_CONFIG[status].label}</span>
          </div>
        ))}
      </div>

      {/* Zone sections */}
      {ZONES.map(({ key, icon }) => {
        const zoneTables = byZone[key]
        if (!zoneTables?.length) return null
        return (
          <section key={key}>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-600 uppercase tracking-wide mb-3">
              <span>{icon}</span>
              {key}
              <span className="ml-1 text-xs font-medium bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full normal-case tracking-normal">
                {zoneTables.length} tables
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {zoneTables.map((table) => (
                <TableCard key={table.id} table={table} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
