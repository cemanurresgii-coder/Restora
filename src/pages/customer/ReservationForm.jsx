import { useState } from 'react'
import { CalendarDays, Clock, Users, MessageSquare, CheckCircle2 } from 'lucide-react'
import useReservationStore from '../../store/useReservationStore'
import useAuthStore from '../../store/useAuthStore'
import { notifyReservationReceived } from '../../services/notificationService'

const TIME_SLOTS = [
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
]

const EMPTY_FORM = {
  date: '',
  time: TIME_SLOTS[0],
  guests: 2,
  notes: '',
}

export default function ReservationForm() {
  const { user } = useAuthStore()
  const { createReservation } = useReservationStore()

  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [confirmedId, setConfirmedId] = useState(null)

  const today = new Date().toISOString().split('T')[0]

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: name === 'guests' ? parseInt(value) : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
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
        tableId: '',
        zone: '',
      })
      setConfirmedId(id)
      setForm(EMPTY_FORM)
      // Send in-app notification (simulates email/SMS confirmation)
      if (user?.uid) {
        await notifyReservationReceived(user.uid, form.date, form.time)
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (confirmedId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-neutral-200 p-10 max-w-md w-full text-center shadow-sm">
          <CheckCircle2 size={52} className="text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Reservation Received!</h2>
          <p className="text-neutral-500 text-sm mb-1">
            Your request has been submitted and is currently <span className="font-semibold text-amber-600">pending</span> approval.
          </p>
          <p className="text-neutral-400 text-xs mb-6">Confirmation ID: <span className="font-mono">{confirmedId}</span></p>
          <button
            onClick={() => setConfirmedId(null)}
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition"
          >
            Make Another Reservation
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

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-5 shadow-sm">

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

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
        >
          {loading ? 'Submitting…' : 'Request Reservation'}
        </button>
      </form>
    </div>
  )
}
