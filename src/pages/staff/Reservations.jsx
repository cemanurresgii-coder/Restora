import { useEffect, useState } from 'react'
import {
  CalendarDays, Users, Clock, CheckCircle2, XCircle,
  Loader2, Search, CircleDot, Plus, X, MapPin, Sofa,
  Wind, Eye, AlertTriangle,
} from 'lucide-react'
import {
  getReservations,
  updateReservationStatus,
  createReservation,
  RESERVATION_STATUS,
  checkTableAvailability,
} from '../../services/reservationService'
import {
  notifyReservationConfirmed,
  notifyReservationCancelled,
} from '../../services/notificationService'

// ── Table definitions ───────────────────────────────────────────────────────
const TABLES = [
  { id: 'T1',  zone: 'Indoor',   capacity: 2,  label: 'Table 1'  },
  { id: 'T2',  zone: 'Indoor',   capacity: 4,  label: 'Table 2'  },
  { id: 'T3',  zone: 'Indoor',   capacity: 6,  label: 'Table 3'  },
  { id: 'T4',  zone: 'Window',   capacity: 2,  label: 'Table 4'  },
  { id: 'T5',  zone: 'Window',   capacity: 4,  label: 'Table 5'  },
  { id: 'T6',  zone: 'Outdoor',  capacity: 4,  label: 'Table 6'  },
  { id: 'T7',  zone: 'Outdoor',  capacity: 8,  label: 'Table 7'  },
  { id: 'T8',  zone: 'Outdoor',  capacity: 10, label: 'Table 8'  },
]

const ZONE_CONFIG = {
  Indoor:  { icon: Sofa,  color: 'bg-violet-50 text-violet-700 border-violet-200' },
  Window:  { icon: Eye,   color: 'bg-sky-50 text-sky-700 border-sky-200' },
  Outdoor: { icon: Wind,  color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

const TIME_SLOTS = [
  '12:00','12:30','13:00','13:30','14:00','14:30',
  '18:00','18:30','19:00','19:30','20:00','20:30','21:00','21:30',
]

const MOCK_RESERVATIONS = [
  { id: 'r1', name: 'Alice Martin', email: 'alice@example.com', date: '2026-04-21', time: '19:00', guests: 4, tableId: 'T2', zone: 'Indoor',  status: 'pending',   notes: 'Window table preferred.' },
  { id: 'r2', name: 'Bob Chen',     email: 'bob@example.com',   date: '2026-04-21', time: '20:00', guests: 2, tableId: 'T4', zone: 'Window',  status: 'confirmed', notes: '' },
  { id: 'r3', name: 'Clara Rossi',  email: 'clara@example.com', date: '2026-04-22', time: '13:00', guests: 6, tableId: 'T3', zone: 'Indoor',  status: 'pending',   notes: 'Birthday celebration.' },
  { id: 'r4', name: 'David Park',   email: 'david@example.com', date: '2026-04-22', time: '19:30', guests: 3, tableId: 'T6', zone: 'Outdoor', status: 'cancelled', notes: '' },
  { id: 'r5', name: 'Emma Wilson',  email: 'emma@example.com',  date: '2026-04-23', time: '18:30', guests: 2, tableId: 'T1', zone: 'Indoor',  status: 'completed', notes: 'Vegetarian menu.' },
]

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-400' },
  confirmed: { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-600',       dot: 'bg-red-400' },
  completed: { label: 'Completed', color: 'bg-neutral-100 text-neutral-500', dot: 'bg-neutral-400' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function ZoneTag({ zone }) {
  const { icon: Icon, color } = ZONE_CONFIG[zone] ?? ZONE_CONFIG.Indoor
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${color}`}>
      <Icon size={10} />
      {zone}
    </span>
  )
}

// ── Availability engine (works without Firebase) ────────────────────────────
function getAvailableTables(reservations, date, time, guests) {
  const occupied = new Set(
    reservations
      .filter((r) => r.date === date && r.time === time && r.status !== 'cancelled')
      .map((r) => r.tableId)
  )
  return TABLES.filter((t) => t.capacity >= guests && !occupied.has(t.id))
}

// ── New Reservation Form ────────────────────────────────────────────────────
function NewReservationModal({ reservations, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', email: '', date: '', time: '', guests: 2, tableId: '', notes: '',
  })
  const [availableTables, setAvailableTables] = useState([])
  const [availabilityChecked, setAvailabilityChecked] = useState(false)
  const [saving, setSaving] = useState(false)

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
    if (['date', 'time', 'guests'].includes(field)) {
      setAvailabilityChecked(false)
      setForm((f) => ({ ...f, [field]: value, tableId: '' }))
    }
  }

  const checkAvailability = () => {
    const tables = getAvailableTables(reservations, form.date, form.time, Number(form.guests))
    setAvailableTables(tables)
    setAvailabilityChecked(true)
  }

  const canCheck = form.date && form.time && form.guests > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.tableId) return
    setSaving(true)
    const table = TABLES.find((t) => t.id === form.tableId)
    try {
      await createReservation({ ...form, zone: table?.zone ?? 'Indoor' })
    } catch {
      // mock: handled by parent
    } finally {
      onSave({ ...form, zone: table?.zone ?? 'Indoor', id: `r${Date.now()}`, status: 'pending' })
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="font-bold text-neutral-900">New Reservation</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Guest info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Guest Name</label>
              <input
                required value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Full name"
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Email</label>
              <input
                required type="email" value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="guest@email.com"
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
          </div>

          {/* Date / Time / Guests */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Date</label>
              <input
                required type="date" value={form.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => set('date', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Time</label>
              <select
                required value={form.time}
                onChange={(e) => set('time', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
              >
                <option value="">Select</option>
                {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Guests</label>
              <input
                type="number" min={1} max={10} value={form.guests}
                onChange={(e) => set('guests', Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
          </div>

          {/* Availability check */}
          <button
            type="button"
            disabled={!canCheck}
            onClick={checkAvailability}
            className="w-full py-2 text-sm font-medium rounded-xl border border-brand-400 text-brand-600
              hover:bg-brand-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Check Table Availability
          </button>

          {/* Table selection */}
          {availabilityChecked && (
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-2">
                Select Table
                {availableTables.length === 0 && (
                  <span className="ml-2 text-red-500 font-normal flex items-center gap-1 inline-flex">
                    <AlertTriangle size={11} /> No tables available for this slot
                  </span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableTables.map((t) => {
                  const { icon: Icon, color } = ZONE_CONFIG[t.zone]
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, tableId: t.id }))}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition
                        ${form.tableId === t.id
                          ? 'border-brand-400 bg-brand-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                    >
                      <div>
                        <p className="text-xs font-semibold text-neutral-900">{t.label}</p>
                        <p className="text-[11px] text-neutral-400">Up to {t.capacity} guests</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${color}`}>
                        <Icon size={9} />
                        {t.zone}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Special Requests</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              placeholder="Allergies, occasion, seating preferences…"
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.tableId}
              className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition
                disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              Confirm Reservation
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function Reservations() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [updating, setUpdating] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getReservations()
        setReservations(data.length ? data : MOCK_RESERVATIONS)
      } catch {
        setReservations(MOCK_RESERVATIONS)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleStatus = async (id, status) => {
    setUpdating(id)
    try {
      await updateReservationStatus(id, status)
      const r = reservations.find((res) => res.id === id)
      // Send notification to customer
      if (r?.uid) {
        if (status === RESERVATION_STATUS.CONFIRMED) {
          notifyReservationConfirmed(r.uid, r.date, r.time, r.tableId)
        } else if (status === RESERVATION_STATUS.CANCELLED) {
          notifyReservationCancelled(r.uid, r.date, r.time)
        }
      }
    } catch {}
    setReservations((prev) => prev.map((r) => r.id === id ? { ...r, status } : r))
    setUpdating(null)
  }

  const handleNewReservation = (reservation) => {
    setReservations((prev) => [reservation, ...prev])
    setShowModal(false)
  }

  const filtered = reservations.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase())
    return matchSearch && (filterStatus === 'all' || r.status === filterStatus)
  })

  const counts = Object.keys(STATUS_CONFIG).reduce((acc, s) => {
    acc[s] = reservations.filter((r) => r.status === s).length
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              <CalendarDays size={22} className="text-brand-500" />
              Reservations
            </h1>
            <p className="text-sm text-neutral-500 mt-0.5">{reservations.length} total reservations</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
          >
            <Plus size={16} />
            New Reservation
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {Object.entries(counts).map(([status, count]) => {
            const cfg = STATUS_CONFIG[status]
            return (
              <div key={status} className="bg-white rounded-xl border border-neutral-100 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-500 capitalize">{status}</p>
                  <p className="text-2xl font-bold text-neutral-900">{count}</p>
                </div>
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
              </div>
            )
          })}
        </div>

        {/* Zone capacity overview */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 mb-5">
          <h2 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-1.5">
            <MapPin size={15} className="text-brand-500" />
            Table Map
          </h2>
          <div className="flex flex-wrap gap-2">
            {TABLES.map((t) => {
              const taken = reservations.some(
                (r) => r.tableId === t.id && ['pending', 'confirmed'].includes(r.status)
              )
              const { icon: Icon, color } = ZONE_CONFIG[t.zone]
              return (
                <div
                  key={t.id}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border text-center min-w-[64px]
                    ${taken ? 'bg-red-50 border-red-200' : 'bg-neutral-50 border-neutral-200'}`}
                >
                  <span className={`text-[10px] font-semibold ${taken ? 'text-red-500' : 'text-neutral-500'}`}>
                    {t.id}
                  </span>
                  <Icon size={16} className={taken ? 'text-red-400' : 'text-neutral-400'} />
                  <span className="text-[10px] text-neutral-400">{t.zone}</span>
                  <span className={`text-[10px] font-bold ${taken ? 'text-red-500' : 'text-emerald-600'}`}>
                    {taken ? 'Taken' : 'Free'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-8 pr-4 py-2 text-sm border border-neutral-200 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['all', ...Object.keys(STATUS_CONFIG)].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition capitalize
                  ${filterStatus === s
                    ? 'bg-brand-500 text-white'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-brand-400" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-100">
                    {['Guest', 'Date & Time', 'Guests', 'Table', 'Status', 'Notes', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-neutral-400">No reservations found</td>
                    </tr>
                  ) : filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-neutral-900">{r.name}</p>
                        <p className="text-xs text-neutral-400">{r.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-neutral-700">
                          <CalendarDays size={13} className="text-neutral-400" />
                          {r.date}
                        </div>
                        <div className="flex items-center gap-1 text-neutral-400 text-xs mt-0.5">
                          <Clock size={12} />{r.time}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-neutral-700">
                          <Users size={13} className="text-neutral-400" />{r.guests}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-neutral-900">{r.tableId ?? '—'}</p>
                        {r.zone && <ZoneTag zone={r.zone} />}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-500 max-w-[140px] truncate">
                        {r.notes || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {updating === r.id ? (
                          <Loader2 size={16} className="animate-spin text-neutral-400" />
                        ) : r.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleStatus(r.id, RESERVATION_STATUS.CONFIRMED)}
                              className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                              <CheckCircle2 size={14} /> Confirm
                            </button>
                            <button onClick={() => handleStatus(r.id, RESERVATION_STATUS.CANCELLED)}
                              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium">
                              <XCircle size={14} /> Cancel
                            </button>
                          </div>
                        ) : r.status === 'confirmed' ? (
                          <button onClick={() => handleStatus(r.id, RESERVATION_STATUS.COMPLETED)}
                            className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700 font-medium">
                            <CircleDot size={14} /> Complete
                          </button>
                        ) : (
                          <span className="text-xs text-neutral-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <NewReservationModal
          reservations={reservations}
          onSave={handleNewReservation}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
