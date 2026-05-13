import { useState } from 'react'
import toast from 'react-hot-toast'
import { CalendarDays, Clock, Users, MessageSquare, CheckCircle2, MapPin, Search, ChevronRight, Wand2 } from 'lucide-react'
import { checkTableAvailability } from '../../services/reservationService'
import { TABLES } from '../../store/useReservationStore'
import useReservationStore from '../../store/useReservationStore'
import useAuthStore from '../../store/useAuthStore'
import { notifyReservationReceived } from '../../services/notificationService'

const TIME_SLOTS = [
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
]

const ZONE_EMOJI  = { Indoor: '🪑', Window: '🌅', Outdoor: '🌿' }
const ZONES       = ['Any', 'Indoor', 'Window', 'Outdoor']

const EMPTY_FORM = {
  date: '',
  time: TIME_SLOTS[0],
  guests: 2,
  notes: '',
  preferredZone: 'Any',
}

export default function ReserveContent({ onSuccess }) {
  const { user } = useAuthStore()
  const { createReservation, autoAssignTable } = useReservationStore()

  const [form, setForm] = useState(EMPTY_FORM)
  const [step, setStep] = useState('form')           // 'form' | 'tables' | 'done'
  const [availableTables, setAvailableTables] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [checking, setChecking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [confirmedId, setConfirmedId] = useState(null)

  const today = new Date().toISOString().split('T')[0]

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: name === 'guests' ? parseInt(value) : value }))
    // Reset table step if user changes search params
    if (['date', 'time', 'guests'].includes(name)) {
      setStep('form')
      setSelectedTable(null)
    }
  }

  const handleCheckAvailability = async () => {
    if (!form.date || !form.guests) return
    setError(null)
    setChecking(true)
    try {
      const occupiedIds = await checkTableAvailability(form.date, form.time)
      const free = TABLES.filter(
        (t) => t.capacity >= form.guests && !occupiedIds.includes(t.id)
      )
      setAvailableTables(free)
      setStep('tables')
    } catch {
      setError('Could not check availability. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  const handleAutoAssign = () => {
    const zone = form.preferredZone !== 'Any' ? form.preferredZone : null
    const best = autoAssignTable(form.date, form.time, form.guests, zone)
    if (best) {
      setSelectedTable(best)
      toast.success(`Best table auto-selected: ${best.id} (${best.zone})`)
    } else {
      toast.error('No suitable table found. Please select manually.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedTable) return
    setError(null)
    setLoading(true)
    try {
      const id = await createReservation({
        uid: user.uid,
        name: user.email.split('@')[0],
        email: user.email,
        date: form.date,
        time: form.time,
        guests: form.guests,
        notes: form.notes.trim(),
        tableId: selectedTable.id,
        zone: selectedTable.zone,
      })
      // Send in-app + email notification
      if (user?.uid) {
        notifyReservationReceived(user.uid, user.email, form.date, form.time, form.guests, selectedTable.id)
      }
      setConfirmedId(id)
      setForm(EMPTY_FORM)
      setStep('done')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (confirmedId) {
    return (
      <div className="flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-2xl border border-neutral-200 p-10 max-w-md w-full text-center shadow-sm">
          <CheckCircle2 size={52} className="text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Reservation Received!</h2>
          <p className="text-neutral-500 text-sm mb-1">
            Your request is currently <span className="font-semibold text-amber-600">pending</span> approval.
          </p>
          <p className="text-neutral-400 text-xs mb-1">
            Table <span className="font-semibold">{selectedTable?.id}</span> · {selectedTable?.zone} · up to {selectedTable?.capacity} guests
          </p>
          <p className="text-neutral-400 text-xs mb-6">ID: <span className="font-mono">{confirmedId}</span></p>
          <button
            onClick={() => onSuccess?.()}
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition"
          >
            View My Reservations
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Reserve a Table</h1>
        <p className="text-sm text-neutral-500 mt-1">Fill in the details below and we'll confirm your booking.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Step 1: Details card ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-5 shadow-sm">

          {/* Date */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 mb-1.5">
              <CalendarDays size={15} className="text-neutral-400" />
              Date *
            </label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              min={today}
              required
              className="w-full border border-neutral-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Time */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 mb-1.5">
              <Clock size={15} className="text-neutral-400" />
              Time *
            </label>
            <select
              name="time"
              value={form.time}
              onChange={handleChange}
              required
              className="w-full border border-neutral-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Guests */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 mb-1.5">
              <Users size={15} className="text-neutral-400" />
              Number of Guests *
            </label>
            <input
              type="number"
              name="guests"
              value={form.guests}
              onChange={handleChange}
              min={1}
              max={20}
              required
              className="w-full border border-neutral-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Preferred Zone */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 mb-1.5">
              <MapPin size={15} className="text-neutral-400" />
              Preferred Area
            </label>
            <div className="flex gap-2 flex-wrap">
              {ZONES.map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, preferredZone: z }))}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition
                    ${form.preferredZone === z
                      ? 'border-brand-400 bg-brand-50 text-brand-700 ring-1 ring-brand-400'
                      : 'border-neutral-200 text-neutral-600 hover:border-brand-300'}`}
                >
                  {ZONE_EMOJI[z] ?? '🍽️'} {z}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 mb-1.5">
              <MessageSquare size={15} className="text-neutral-400" />
              Special Requests
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Allergies, high chair, window seat…"
              className="w-full border border-neutral-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* Check availability button */}
          {step === 'form' && (
            <button
              type="button"
              onClick={handleCheckAvailability}
              disabled={!form.date || checking}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
            >
              {checking
                ? <><span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Checking…</>
                : <><Search size={16} /> Check Availability</>
              }
            </button>
          )}

          {/* Re-check link when tables already shown */}
          {step === 'tables' && (
            <button
              type="button"
              onClick={handleCheckAvailability}
              disabled={checking}
              className="w-full text-sm text-brand-600 hover:underline py-1"
            >
              {checking ? 'Checking…' : '↺ Re-check availability'}
            </button>
          )}
        </div>

        {/* ── Step 2: Table selection ───────────────────────────── */}
        {step === 'tables' && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-brand-500" />
                <h2 className="text-sm font-semibold text-neutral-800">
                  {availableTables.length > 0
                    ? `${availableTables.length} table${availableTables.length !== 1 ? 's' : ''} available`
                    : 'No tables available for this slot'}
                </h2>
              </div>
              {availableTables.length > 0 && (
                <button
                  type="button"
                  onClick={handleAutoAssign}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white px-3 py-1.5 rounded-xl transition"
                >
                  <Wand2 size={12} /> Auto-assign
                </button>
              )}
            </div>

            {availableTables.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-4">
                Try a different time or date.
              </p>
            ) : (
              <div className="space-y-2">
                {availableTables.map((table) => {
                  const isSelected = selectedTable?.id === table.id
                  return (
                    <button
                      key={table.id}
                      type="button"
                      onClick={() => setSelectedTable(table)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition
                        ${isSelected
                          ? 'border-brand-400 bg-brand-50 ring-1 ring-brand-400'
                          : 'border-neutral-200 hover:border-brand-300 hover:bg-neutral-50'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{ZONE_EMOJI[table.zone] ?? '🪑'}</span>
                        <div>
                          <p className="text-sm font-semibold text-neutral-800">
                            Table {table.id}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {table.zone} · up to {table.capacity} guests
                          </p>
                        </div>
                      </div>
                      {isSelected
                        ? <CheckCircle2 size={18} className="text-brand-500 shrink-0" />
                        : <ChevronRight size={16} className="text-neutral-300 shrink-0" />
                      }
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>
        )}

        {/* ── Confirm button (only when a table is picked) ─────── */}
        {selectedTable && (
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
          >
            {loading
              ? 'Submitting…'
              : `Confirm — Table ${selectedTable.id} (${selectedTable.zone})`}
          </button>
        )}
      </form>
    </div>
  )
}
