import { useEffect, useState, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import { AlertCircle, Clock, UtensilsCrossed, ChevronRight, CheckCheck, Inbox, Volume2, VolumeX } from 'lucide-react'
import useOrderStore, { ORDER_STATUS } from '../../store/useOrderStore'
import useAuthStore from '../../store/useAuthStore'

// ── Web Audio API notification beep ──────────────────────────────────────────

function playNewOrderBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const now = ctx.currentTime
    // Two-tone alert: high + low
    ;[880, 660].forEach((freq, i) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + i * 0.18)
      gain.gain.setValueAtTime(0.25, now + i * 0.18)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.3)
      osc.start(now + i * 0.18)
      osc.stop(now + i * 0.18 + 0.32)
    })
  } catch {
    // Browser may block AudioContext without user gesture — ignore silently
  }
}

// ── Utility ──────────────────────────────────────────────────────────────────

/**
 * Returns a human-readable elapsed time string from a Firestore Timestamp
 * or a JS Date/epoch value. Falls back to "just now" for missing values.
 */
function getTimeAgo(timestamp) {
  if (!timestamp) return 'just now'
  const ms = timestamp.toMillis?.() ?? new Date(timestamp).getTime()
  const diffMin = Math.floor((Date.now() - ms) / 60_000)
  if (diffMin < 1) return 'just now'
  if (diffMin === 1) return '1 min ago'
  return `${diffMin} min ago`
}

// ── Kanban column definitions ─────────────────────────────────────────────────

const COLUMNS = [
  {
    status:      ORDER_STATUS.PENDING,
    label:       'Pending',
    icon:        Clock,
    nextStatus:  ORDER_STATUS.PREPARING,
    nextLabel:   'Start Preparing',
    headerBg:    'bg-amber-50',
    headerText:  'text-amber-700',
    headerBorder:'border-amber-200',
    countBg:     'bg-amber-100 text-amber-700',
    advanceBtn:  'bg-amber-500 hover:bg-amber-600 text-white',
    dot:         'bg-amber-400',
  },
  {
    status:      ORDER_STATUS.PREPARING,
    label:       'Preparing',
    icon:        UtensilsCrossed,
    nextStatus:  ORDER_STATUS.READY,
    nextLabel:   'Mark Ready',
    headerBg:    'bg-blue-50',
    headerText:  'text-blue-700',
    headerBorder:'border-blue-200',
    countBg:     'bg-blue-100 text-blue-700',
    advanceBtn:  'bg-blue-500 hover:bg-blue-600 text-white',
    dot:         'bg-blue-400',
  },
  {
    status:      ORDER_STATUS.READY,
    label:       'Ready to Serve',
    icon:        CheckCheck,
    nextStatus:  ORDER_STATUS.SERVED,
    nextLabel:   'Mark Served',
    headerBg:    'bg-emerald-50',
    headerText:  'text-emerald-700',
    headerBorder:'border-emerald-200',
    countBg:     'bg-emerald-100 text-emerald-700',
    advanceBtn:  'bg-emerald-500 hover:bg-emerald-600 text-white',
    dot:         'bg-emerald-400',
  },
]

// ── Order card ────────────────────────────────────────────────────────────────

function OrderCard({ order, col, onAdvance, timeNow }) {
  const [busy, setBusy] = useState(false)

  const handleAdvance = async () => {
    setBusy(true)
    try {
      await onAdvance(order.id, col.nextStatus)
    } finally {
      setBusy(false)
    }
  }

  const items = order.items ?? []
  const hasSpecialRequests = items.some((i) => i.customization?.trim())

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm flex flex-col gap-3">
      {/* ── Card header: table + time ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-brand-600 text-base">
            Table {order.tableId}
          </span>
          {hasSpecialRequests && (
            <span
              title="This order has special requests"
              className="flex items-center gap-1 bg-amber-100 text-amber-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
            >
              <AlertCircle size={9} />
              Requests
            </span>
          )}
        </div>
        <span className="text-xs text-neutral-400 tabular-nums">
          {getTimeAgo(order.createdAt)}
        </span>
      </div>

      {/* ── Customer name (if present) ── */}
      {order.customerName && (
        <p className="text-xs text-neutral-500 -mt-1">{order.customerName}</p>
      )}

      {/* ── Item list ── */}
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="space-y-1">
            {/* Item row */}
            <div className="flex items-baseline gap-1.5 text-sm">
              <span className="text-neutral-900 font-medium leading-snug">{item.name}</span>
              <span className="text-neutral-400">×{item.qty}</span>
              <span className="text-brand-600 font-semibold ml-auto whitespace-nowrap text-xs">
                ${(Number(item.price) * item.qty).toFixed(2)}
              </span>
            </div>

            {/* Special request — highlighted in amber */}
            {item.customization?.trim() && (
              <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 ml-1">
                <AlertCircle size={11} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-snug">{item.customization}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Order notes (top-level) ── */}
      {order.notes?.trim() && (
        <div className="flex items-start gap-1.5 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2">
          <AlertCircle size={11} className="text-neutral-400 shrink-0 mt-0.5" />
          <p className="text-xs text-neutral-600 leading-snug">{order.notes}</p>
        </div>
      )}

      {/* ── Total ── */}
      <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
        <span className="text-xs text-neutral-500">Order total</span>
        <span className="font-bold text-neutral-900 text-sm">${Number(order.total ?? 0).toFixed(2)}</span>
      </div>

      {/* ── Advance button ── */}
      <button
        onClick={handleAdvance}
        disabled={busy}
        className={`w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl transition disabled:opacity-50 ${col.advanceBtn}`}
      >
        {busy ? 'Updating…' : col.nextLabel}
        {!busy && <ChevronRight size={15} />}
      </button>
    </div>
  )
}

// ── Kanban column ─────────────────────────────────────────────────────────────

function KanbanColumn({ col, orders, onAdvance, timeNow }) {
  const Icon = col.icon
  return (
    <div className={`flex flex-col rounded-2xl border ${col.headerBorder} overflow-hidden min-w-[280px] flex-1`}>
      {/* Column header */}
      <div className={`flex items-center justify-between px-4 py-3 ${col.headerBg}`}>
        <div className={`flex items-center gap-2 font-semibold text-sm ${col.headerText}`}>
          <Icon size={15} />
          {col.label}
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.countBg}`}>
          {orders.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 flex flex-col gap-3 p-3 bg-neutral-50/60 min-h-[120px]">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-neutral-300 text-xs gap-2">
            <Inbox size={28} className="opacity-50" />
            <span>No orders</span>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              col={col}
              onAdvance={onAdvance}
              timeNow={timeNow}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OrderQueue() {
  const { activeOrders, subscribeActiveOrders, updateStatus } = useOrderStore()
  const { user } = useAuthStore()

  const [soundEnabled, setSoundEnabled] = useState(true)

  // Tick every 30 s so "X min ago" labels refresh without a full re-render cascade
  const [timeNow, setTimeNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setTimeNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  // Start the real-time Firestore listener; clean up when the tab unmounts
  useEffect(() => {
    const unsub = subscribeActiveOrders()
    return () => unsub()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Notify staff when a new order arrives in the active queue.
  // prevCountRef starts as null so the initial snapshot load is silently skipped.
  const prevCountRef = useRef(null)
  useEffect(() => {
    if (prevCountRef.current === null) {
      prevCountRef.current = activeOrders.length
      return
    }
    const diff = activeOrders.length - prevCountRef.current
    if (diff > 0) {
      toast(`🔔 ${diff} new order${diff > 1 ? 's' : ''} received!`, {
        duration: 6000,
        style: { background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' },
      })
      if (soundEnabled) playNewOrderBeep()

      // Request desktop notification permission and fire one
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(`🍽️ ${diff} new order${diff > 1 ? 's' : ''}!`, {
            body: 'Check the kitchen queue.',
            icon: '/vite.svg',
          })
        } else if (Notification.permission === 'default') {
          Notification.requestPermission()
        }
      }
    }
    prevCountRef.current = activeOrders.length
  }, [activeOrders.length, soundEnabled])

  const handleAdvance = useCallback(
    (id, status) => updateStatus(id, status, user?.uid ?? null, user?.email?.split('@')[0] ?? null),
    [updateStatus, user]
  )

  // Partition activeOrders into per-column buckets
  const byStatus = COLUMNS.reduce((acc, col) => {
    acc[col.status] = activeOrders.filter((o) => o.status === col.status)
    return acc
  }, {})

  const totalActive = activeOrders.length

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Kitchen Queue</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Live order board — advance each order as it progresses through the kitchen.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled((v) => !v)}
            title={soundEnabled ? 'Mute alerts' : 'Enable alerts'}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition ${
              soundEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-neutral-100 text-neutral-400 border-neutral-200'
            }`}
          >
            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            {soundEnabled ? 'Sound On' : 'Sound Off'}
          </button>

          {totalActive > 0 && (
            <span className="flex items-center gap-2 bg-brand-50 text-brand-700 border border-brand-200 text-sm font-semibold px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              {totalActive} active {totalActive === 1 ? 'order' : 'orders'}
            </span>
          )}
        </div>
      </div>

      {/* Kanban board — horizontal scroll on small screens */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.status}
            col={col}
            orders={byStatus[col.status]}
            onAdvance={handleAdvance}
            timeNow={timeNow}
          />
        ))}
      </div>
    </div>
  )
}
