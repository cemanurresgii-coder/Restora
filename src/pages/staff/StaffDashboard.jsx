import { useEffect, useState } from 'react'
import {
  CalendarCheck, Clock, Users, MessageSquare,
  CheckCircle2, XCircle, Inbox,
} from 'lucide-react'
import {
  subscribePendingReservations,
  updateReservationStatus,
  RESERVATION_STATUS,
} from '../../services/reservationService'
import {
  notifyReservationConfirmed,
  notifyReservationCancelled,
} from '../../services/notificationService'
import useOrderStore from '../../store/useOrderStore'
import MenuContent from '../customer/MenuContent'
import TableManagement from '../../components/staff/TableManagement'
import OrderQueue from '../../components/staff/OrderQueue'

// ── Pending Reservations tab ─────────────────────────────────────────────────

function ReservationsTab() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionState, setActionState] = useState({})

  useEffect(() => {
    const unsub = subscribePendingReservations((data) => {
      setReservations(data)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const handleAction = async (id, status) => {
    const key = status === RESERVATION_STATUS.CONFIRMED ? 'confirming' : 'rejecting'
    setActionState((s) => ({ ...s, [id]: key }))
    try {
      await updateReservationStatus(id, status)
      // Send email + in-app notification to the customer
      const res = reservations.find((r) => r.id === id)
      if (res?.uid) {
        if (status === RESERVATION_STATUS.CONFIRMED) {
          notifyReservationConfirmed(res.uid, res.email ?? null, res.date, res.time, res.tableId, res.zone, res.guests)
        } else if (status === RESERVATION_STATUS.CANCELLED) {
          notifyReservationCancelled(res.uid, res.email ?? null, res.date, res.time)
        }
      }
    } catch {
      setActionState((s) => ({ ...s, [id]: 'error' }))
    }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-400 border-t-transparent" />
    </div>
  )

  if (reservations.length === 0) return (
    <div className="text-center py-20 text-neutral-400">
      <Inbox size={44} className="mx-auto mb-3 opacity-40" />
      <p className="font-medium text-neutral-600">All caught up!</p>
      <p className="text-sm mt-1">No pending reservations right now.</p>
    </div>
  )

  return (
    <div className="space-y-4">
      {reservations.map((r) => {
        const state = actionState[r.id]
        const busy = state === 'confirming' || state === 'rejecting'
        return (
          <div
            key={r.id}
            className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm"
            style={{ opacity: busy ? 0.6 : 1 }}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="font-semibold text-neutral-900">{r.name || r.email}</p>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-neutral-500">
                  <span className="flex items-center gap-1"><CalendarCheck size={12} />{r.date}</span>
                  <span className="flex items-center gap-1"><Clock size={12} />{r.time}</span>
                  <span className="flex items-center gap-1"><Users size={12} />{r.guests} {r.guests === 1 ? 'guest' : 'guests'}</span>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200 whitespace-nowrap">
                Pending
              </span>
            </div>

            {r.notes && (
              <div className="flex items-start gap-2 bg-neutral-50 rounded-xl px-3 py-2.5 mb-3">
                <MessageSquare size={12} className="text-neutral-400 mt-0.5 shrink-0" />
                <p className="text-xs text-neutral-600">{r.notes}</p>
              </div>
            )}

            {state === 'error' && (
              <p className="text-xs text-red-500 mb-3">Something went wrong. Please try again.</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => handleAction(r.id, RESERVATION_STATUS.CONFIRMED)}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium py-2.5 rounded-xl transition disabled:opacity-50"
              >
                <CheckCircle2 size={15} />
                {state === 'confirming' ? 'Confirming…' : 'Confirm'}
              </button>
              <button
                onClick={() => handleAction(r.id, RESERVATION_STATUS.CANCELLED)}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-2 border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium py-2.5 rounded-xl transition disabled:opacity-50"
              >
                <XCircle size={15} />
                {state === 'rejecting' ? 'Rejecting…' : 'Reject'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { key: 'reservations', label: 'Reservations' },
  { key: 'tables',       label: 'Tables'        },
  { key: 'kitchen',      label: 'Kitchen Queue' },
  { key: 'menu',         label: 'Menu'          },
]

// ── Main dashboard ───────────────────────────────────────────────────────────

export default function StaffDashboard() {
  const [activeTab, setActiveTab] = useState('reservations')

  // Start the active-orders listener on mount so the Kitchen Queue badge
  // count is always accurate, even before the tab is first visited.
  const { activeOrders, subscribeActiveOrders } = useOrderStore()
  useEffect(() => {
    const unsub = subscribeActiveOrders()
    return () => unsub()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const kitchenCount = activeOrders.length

  return (
    <div>
      {/* Tab bar */}
      <div className="bg-white border-b border-neutral-200 sticky top-14 z-40">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1 py-2 overflow-x-auto">
            {TABS.map(({ key, label }) => {
              const isKitchen = key === 'kitchen'
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap
                    ${activeTab === key
                      ? 'bg-brand-50 text-brand-600'
                      : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'}`}
                >
                  {label}
                  {/* Live order count badge on Kitchen Queue tab */}
                  {isKitchen && kitchenCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-brand-500 text-white text-[10px] font-bold rounded-full">
                      {kitchenCount > 9 ? '9+' : kitchenCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'reservations' && (
        <div className="max-w-3xl mx-auto px-4 py-6">
          <ReservationsTab />
        </div>
      )}
      {activeTab === 'tables'  && <TableManagement />}
      {activeTab === 'kitchen' && <OrderQueue />}
      {activeTab === 'menu'    && <MenuContent hideCart />}
    </div>
  )
}
