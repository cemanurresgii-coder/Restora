import { useEffect, useState } from 'react'
import { CalendarCheck, Clock, Users, MessageSquare, Inbox, CheckCircle2, XCircle, Hourglass } from 'lucide-react'
import { subscribeUserReservations, RESERVATION_STATUS } from '../../services/reservationService'
import useAuthStore from '../../store/useAuthStore'

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
    icon: CheckCircle2,
    cls: 'bg-neutral-100 text-neutral-500 border-neutral-200',
  },
}

export default function MyReservations() {
  const { user } = useAuthStore()
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) return
    const unsub = subscribeUserReservations(user.uid, (data) => {
      setReservations(data)
      setLoading(false)
    })
    return () => unsub()
  }, [user?.uid])

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">My Reservations</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {loading ? 'Loading…' : `${reservations.length} reservation${reservations.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-400 border-t-transparent" />
        </div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-20 text-neutral-400">
          <Inbox size={44} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium text-neutral-600">No reservations yet</p>
          <p className="text-sm mt-1">Use the Reserve page to book a table.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((r) => {
            const config = STATUS_CONFIG[r.status] ?? STATUS_CONFIG[RESERVATION_STATUS.PENDING]
            const StatusIcon = config.icon

            return (
              <div key={r.id} className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm">
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-700">
                    <span className="flex items-center gap-1.5 font-medium">
                      <CalendarCheck size={14} className="text-neutral-400" />
                      {r.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} className="text-neutral-400" />
                      {r.time}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users size={14} className="text-neutral-400" />
                      {r.guests} {r.guests === 1 ? 'guest' : 'guests'}
                    </span>
                  </div>

                  {/* Status badge */}
                  <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${config.cls}`}>
                    <StatusIcon size={12} />
                    {config.label}
                  </span>
                </div>

                {/* Note */}
                {r.notes && (
                  <div className="flex items-start gap-2 bg-neutral-50 rounded-xl px-3 py-2.5">
                    <MessageSquare size={13} className="text-neutral-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-neutral-500">{r.notes}</p>
                  </div>
                )}

                {/* Pending helper text */}
                {r.status === RESERVATION_STATUS.PENDING && (
                  <p className="text-xs text-amber-500 mt-3">
                    Awaiting staff confirmation — this page updates automatically.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
