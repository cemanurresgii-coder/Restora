import { TrendingUp, ShoppingBag, CalendarCheck, LayoutGrid } from 'lucide-react'

// ── Individual KPI card ───────────────────────────────────────────────────────

function KpiCard({ icon: Icon, iconBg, label, value, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>

      <div>
        <p className="text-2xl font-bold text-neutral-900 leading-none">{value}</p>
        <p className="text-sm font-medium text-neutral-700 mt-1">{label}</p>
        <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>
      </div>

      {/* Optional slot for extra content (e.g. progress bar) */}
      {children}
    </div>
  )
}

// ── Utilization progress bar ──────────────────────────────────────────────────

function UtilBar({ pct }) {
  // Colour shifts from green → amber → red as utilization climbs
  const color =
    pct >= 90 ? 'bg-red-500'
    : pct >= 65 ? 'bg-amber-400'
    : 'bg-emerald-500'

  return (
    <div>
      <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-neutral-400 mt-1">
        {pct < 65 ? 'Plenty of room' : pct < 90 ? 'Getting busy' : 'Almost full'}
      </p>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

/**
 * Displays four top-level KPI cards for the manager dashboard.
 *
 * @param {{ kpis: {
 *   totalRevenue: number,
 *   todayOrders: number,
 *   activeReservationsToday: number,
 *   tableUtilization: number,
 *   tableCount: number,
 *   busyTables: number,
 * }}} props
 */
export default function DashboardKPIs({ kpis }) {
  const {
    totalRevenue = 0,
    todayOrders = 0,
    activeReservationsToday = 0,
    tableUtilization = 0,
    tableCount = 0,
    busyTables = 0,
  } = kpis ?? {}

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Revenue */}
      <KpiCard
        icon={TrendingUp}
        iconBg="bg-emerald-500"
        label="Total Revenue"
        value={`$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        subtitle="From all served orders"
      />

      {/* Today's Orders */}
      <KpiCard
        icon={ShoppingBag}
        iconBg="bg-brand-500"
        label="Today's Orders"
        value={todayOrders}
        subtitle="Orders placed today"
      />

      {/* Active Reservations */}
      <KpiCard
        icon={CalendarCheck}
        iconBg="bg-blue-500"
        label="Active Today"
        value={activeReservationsToday}
        subtitle="Pending + confirmed reservations"
      />

      {/* Table Utilization */}
      <KpiCard
        icon={LayoutGrid}
        iconBg="bg-amber-500"
        label="Table Utilization"
        value={`${tableUtilization}%`}
        subtitle={`${busyTables} of ${tableCount} tables in use`}
      >
        <UtilBar pct={tableUtilization} />
      </KpiCard>
    </div>
  )
}
