import { useEffect, useState } from 'react'
import {
  CalendarCheck, Clock, Users, MessageSquare, Inbox,
  CheckCircle2, XCircle, Hourglass, CircleDot, MapPin,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getReservations,
  updateReservationStatus,
  RESERVATION_STATUS,
} from '../../services/reservationService'
import {
  notifyReservationConfirmed,
  notifyReservationCancelled,
} from '../../services/notificationService'

const STATUS_CONFIG = {
  [RESERVATION_STATUS.PENDING]: {
    label: 'Pending',
    icon: Hourglass,
    cls: 'bg-amber-50 text-amber-600 border-amber-200',
  },
  [RESERVATION_STATUS.CONFIRMED]: {
    label: 'Confirmed',
    icon: CheckCircle2,
    cls: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  },
  [RESERVATION_STATUS.CANCELLED]: {
    label: 'Cancelled',
    icon: XCircle,
    cls: 'bg-red-50 text-red-500 border-red-200',
  },
  [RESERVATION_STATUS.COMPLETED]: {
    label: 'Completed',
    icon: CircleDot,
    cls: 'bg-neutral-100 text-neutral-500 border-neutral-200',
  },
}

const ALL = 'All'
const FILTERS = [ALL, ...Object.values(RESERVATION_STATUS)]

export default function ManagerReservations() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading]           = useState(true)
  const [activeFilter, setActiveFilter] = useState(ALL)
  const [busyId, setBusyId]             = useState(null)

  useEffect(() => {
    getReservations()
      .then(setReservations)
      .finally(() => setLoading(false))
  }, [])

  const filtered = activeFilter === ALL
    ? reservations
    : reservations.filter((r) => r.status === activeFilter)

  const countFor = (f) =>
    f === ALL ? reservations.length : reservations.filter((r) => r.status === f).length

  const changeStatus = async (r, newStatus) => {
    setBusyId(r.id)
    try {
      await updateReservationStatus(r.id, newStatus)
      setReservations((prev) =>
        prev.map((res) => (res.id === r.id ? { ...res, status: newStatus } : res))
      )

      // Notify the customer (simulates email/SMS)
      if (r.uid) {
        if (newStatus === RESERVATION_STATUS.CONFIRMED) {
          await notifyReservationConfirmed(r.uid, r.date, r.time, r.tableId)
          toast.success(`Reservation confirmed — notification sent to ${r.name || r.email}.`)
        } else if (newStatus === RESERVATION_STATUS.CANCELLED) {
          await notifyReservationCancelled(r.uid, r.date, r.time)
          toast(`Reservation cancelled — customer notified.`, {
            icon: '❌',
            style: { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' },
          })
        } else if (newStatus === RESERVATION_STATUS.COMPLETED) {
          toast.success('Marked as completed.')
        }
      }
    } catch {
      toast.error('Could not update status. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Reservations</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {loading ? 'Loading…' : `${reservations.length} total`}
        </p>
      </div>

      {/* Filter tabs */}
      {!loading && (
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition capitalize
                ${activeFilter === f
                  ? 'bg-brand-600 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
            >
              {f} <span className="ml-1 opacity-70">({countFor(f)})</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-400 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-neutral-400">
          <Inbox size={44} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium text-neutral-600">No reservations found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const config     = STATUS_CONFIG[r.status] ?? STATUS_CONFIG[RESERVATION_STATUS.PENDING]
            const StatusIcon = config.icon
            const isBusy     = busyId === r.id

            return (
              <div key={r.id} className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-semibold text-neutral-900">{r.name || r.email}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <CalendarCheck size={12} /> {r.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {r.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {r.guests} {r.guests === 1 ? 'guest' : 'guests'}
                      </span>
                      {r.tableId && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> Table {r.tableId}{r.zone ? ` · ${r.zone}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${config.cls}`}>
                    <StatusIcon size={12} />
                    {config.label}
                  </span>
                </div>

                {r.notes && (
                  <div className="flex items-start gap-2 bg-neutral-50 rounded-xl px-3 py-2 mt-2">
                    <MessageSquare size={12} className="text-neutral-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-neutral-500">{r.notes}</p>
                  </div>
                )}

                {/* Action buttons for pending reservations */}
                {r.status === RESERVATION_STATUS.PENDING && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => changeStatus(r, RESERVATION_STATUS.CONFIRMED)}
                      disabled={isBusy}
                      className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                    >
                      <CheckCircle2 size={12} />
                      {isBusy ? 'Updating…' : 'Confirm & Notify'}
                    </button>
                    <button
                      onClick={() => changeStatus(r, RESERVATION_STATUS.CANCELLED)}
                      disabled={isBusy}
                      className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                    >
                      <XCircle size={12} />
                      Decline
                    </button>
                  </div>
                )}

                {/* Mark completed for confirmed reservations */}
                {r.status === RESERVATION_STATUS.CONFIRMED && (
                  <div className="mt-3">
                    <button
                      onClick={() => changeStatus(r, RESERVATION_STATUS.COMPLETED)}
                      disabled={isBusy}
                      className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-800 border border-neutral-200 hover:border-neutral-300 bg-neutral-50 hover:bg-neutral-100 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                    >
                      <CircleDot size={12} />
                      {isBusy ? 'Updating…' : 'Mark Completed'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
