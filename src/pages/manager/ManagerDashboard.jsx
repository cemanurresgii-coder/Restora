import { useEffect, useState } from 'react'
import { RefreshCw, CalendarDays, TrendingUp, Users } from 'lucide-react'
import { getOrders } from '../../services/orderService'
import { getReservations } from '../../services/reservationService'
import { getTables } from '../../services/tableService'
import DashboardKPIs from '../../components/manager/DashboardKPIs'
import AnalyticsCharts from '../../components/manager/AnalyticsCharts'

// ── Pure aggregation helpers ──────────────────────────────────────────────────

function daysBetween(start, end) {
  const ms = end - start
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

function computeRevenueTrend(orders, startDate, endDate) {
  const days = daysBetween(startDate, endDate) + 1
  return Array.from({ length: Math.min(days, 60) }, (_, i) => {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const label   = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    const revenue = orders
      .filter((o) => {
        const orderDate = o.createdAt?.toDate?.()?.toISOString()?.split('T')[0]
        return orderDate === dateStr && o.status === 'served'
      })
      .reduce((sum, o) => sum + (o.total ?? 0), 0)

    return { date: label, revenue }
  })
}

function computeRevenueByTable(orders) {
  const map = {}
  for (const order of orders) {
    if (order.status !== 'served') continue
    const table = order.tableId ?? 'Unknown'
    if (!map[table]) map[table] = { tableId: table, revenue: 0, orders: 0 }
    map[table].revenue += order.total ?? 0
    map[table].orders  += 1
  }
  return Object.values(map)
    .sort((a, b) => b.revenue - a.revenue)
}

function computePopularItems(orders, topN = 5) {
  const map = {}
  for (const order of orders) {
    for (const item of order.items ?? []) {
      const key = item.name ?? 'Unknown'
      if (!map[key]) map[key] = { name: key, count: 0, revenue: 0 }
      map[key].count   += item.qty   ?? 1
      map[key].revenue += (item.price ?? 0) * (item.qty ?? 1)
    }
  }
  return Object.values(map)
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
}

function computePeakHours(reservations, topN = 8) {
  const map = {}
  for (const r of reservations) {
    if (!r.time || r.status === 'cancelled') continue
    const slot = r.time.slice(0, 5)
    map[slot] = (map[slot] ?? 0) + 1
  }
  return Object.entries(map)
    .map(([time, count]) => ({ time, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
    .reverse()
}

// Filter orders/reservations within a date range
function filterByDateRange(items, startDate, endDate, getDate) {
  const startStr = startDate.toISOString().split('T')[0]
  const endStr   = endDate.toISOString().split('T')[0]
  return items.filter((item) => {
    const d = getDate(item)
    return d >= startStr && d <= endStr
  })
}

// ── Date range presets ────────────────────────────────────────────────────────

const PRESETS = [
  { label: 'Today',    days: 0  },
  { label: '7 days',   days: 7  },
  { label: '14 days',  days: 14 },
  { label: '30 days',  days: 30 },
  { label: '90 days',  days: 90 },
]

function getPresetRange(days) {
  const end   = new Date()
  const start = new Date()
  if (days === 0) {
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
  } else {
    start.setDate(start.getDate() - (days - 1))
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
  }
  return { start, end }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ManagerDashboard() {
  const [allOrders, setAllOrders]             = useState([])
  const [allReservations, setAllReservations] = useState([])
  const [tables, setTables]                   = useState([])

  const [kpis, setKpis]                       = useState(null)
  const [revenueTrend, setRevenueTrend]       = useState([])
  const [popularItems, setPopularItems]       = useState([])
  const [peakHours, setPeakHours]             = useState([])
  const [revenueByTable, setRevenueByTable]   = useState([])
  const [loading, setLoading]                 = useState(true)
  const [error, setError]                     = useState(null)
  const [lastFetched, setLastFetched]         = useState(null)

  // Date range state
  const [activePreset, setActivePreset] = useState(14)
  const [customStart, setCustomStart]   = useState('')
  const [customEnd, setCustomEnd]       = useState('')
  const [useCustom, setUseCustom]       = useState(false)

  const getDateRange = () => {
    if (useCustom && customStart && customEnd) {
      return { start: new Date(customStart + 'T00:00:00'), end: new Date(customEnd + 'T23:59:59') }
    }
    return getPresetRange(activePreset)
  }

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [orders, reservations, tbls] = await Promise.all([
        getOrders(),
        getReservations(),
        getTables(),
      ])
      setAllOrders(orders)
      setAllReservations(reservations)
      setTables(tbls)
      setLastFetched(new Date())
    } catch (err) {
      setError(err.message ?? 'Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Recompute whenever data or date range changes
  useEffect(() => {
    if (!allOrders.length && !allReservations.length && !tables.length) return

    const { start, end } = getDateRange()

    const rangeOrders = filterByDateRange(
      allOrders, start, end,
      (o) => o.createdAt?.toDate?.()?.toISOString()?.split('T')[0] ?? ''
    )
    const rangeReservations = filterByDateRange(
      allReservations, start, end,
      (r) => r.date ?? ''
    )

    const today = new Date().toISOString().split('T')[0]

    // KPIs
    const totalRevenue = rangeOrders
      .filter((o) => o.status === 'served')
      .reduce((sum, o) => sum + (o.total ?? 0), 0)

    const todayOrders = allOrders.filter((o) => {
      const dateStr = o.createdAt?.toDate?.()?.toISOString()?.split('T')[0]
      return dateStr === today
    }).length

    const avgOrderValue = rangeOrders.filter((o) => o.status === 'served').length
      ? (totalRevenue / rangeOrders.filter((o) => o.status === 'served').length)
      : 0

    const activeReservationsToday = allReservations.filter(
      (r) => r.date === today && ['pending', 'confirmed'].includes(r.status)
    ).length

    const busyTables = tables.filter((t) => ['occupied', 'reserved'].includes(t.status)).length
    const tableUtilization = tables.length ? Math.round((busyTables / tables.length) * 100) : 0

    const totalGuests = rangeReservations
      .filter((r) => r.status !== 'cancelled')
      .reduce((sum, r) => sum + (r.guests ?? 0), 0)

    setKpis({
      totalRevenue,
      todayOrders,
      avgOrderValue,
      activeReservationsToday,
      tableUtilization,
      tableCount: tables.length,
      busyTables,
      totalGuests,
      rangeOrderCount: rangeOrders.length,
      rangeReservationCount: rangeReservations.filter((r) => r.status !== 'cancelled').length,
    })

    setRevenueTrend(computeRevenueTrend(allOrders, start, end))
    setPopularItems(computePopularItems(rangeOrders))
    setPeakHours(computePeakHours(rangeReservations))
    setRevenueByTable(computeRevenueByTable(rangeOrders))
  }, [allOrders, allReservations, tables, activePreset, customStart, customEnd, useCustom]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePreset = (days) => {
    setActivePreset(days)
    setUseCustom(false)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {lastFetched
              ? `Last updated at ${lastFetched.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
              : 'Loading restaurant data…'}
          </p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-2 border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-sm font-medium px-3 py-2 rounded-xl transition disabled:opacity-40"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Date range selector */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-600 shrink-0">
            <CalendarDays size={15} className="text-neutral-400" />
            Date Range
          </div>

          {/* Preset buttons */}
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(({ label, days }) => (
              <button
                key={days}
                onClick={() => handlePreset(days)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  !useCustom && activePreset === days
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-brand-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Custom date inputs */}
          <div className="flex items-center gap-2 ml-auto">
            <input
              type="date"
              value={customStart}
              onChange={(e) => { setCustomStart(e.target.value); setUseCustom(true) }}
              className={`text-xs border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400 ${
                useCustom ? 'border-brand-400' : 'border-neutral-200'
              }`}
            />
            <span className="text-xs text-neutral-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => { setCustomEnd(e.target.value); setUseCustom(true) }}
              className={`text-xs border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400 ${
                useCustom ? 'border-brand-400' : 'border-neutral-200'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-neutral-100 h-32 animate-pulse" />
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-neutral-100 h-60 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-neutral-100 h-52 animate-pulse" />
            <div className="bg-white rounded-2xl border border-neutral-100 h-52 animate-pulse" />
          </div>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-600">
          {error}
          <button onClick={fetchAll} className="ml-3 underline font-medium">Retry</button>
        </div>
      )}

      {/* Content */}
      {!loading && !error && kpis && (
        <>
          {/* Extra summary bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Avg Order Value', value: `$${kpis.avgOrderValue.toFixed(2)}`, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Orders in Range', value: kpis.rangeOrderCount, icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
              { label: 'Reservations', value: kpis.rangeReservationCount, icon: CalendarDays, color: 'text-purple-600 bg-purple-50' },
              { label: 'Total Guests', value: kpis.totalGuests, icon: Users, color: 'text-orange-600 bg-orange-50' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl border border-neutral-100 shadow-sm px-4 py-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon size={14} />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">{label}</p>
                  <p className="text-base font-bold text-neutral-900">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <DashboardKPIs kpis={kpis} />
          <AnalyticsCharts
            revenueTrend={revenueTrend}
            popularItems={popularItems}
            peakHours={peakHours}
            revenueByTable={revenueByTable}
          />
        </>
      )}
    </div>
  )
}
