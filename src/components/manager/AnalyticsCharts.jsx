import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { TrendingUp, Star, Clock, Table2 } from 'lucide-react'

// Brand palette constants for recharts (cannot use Tailwind classes inside SVG)
const BRAND   = '#f97316' // brand-500
const NEUTRAL = '#737373' // neutral-500

// ── Shared section wrapper ────────────────────────────────────────────────────

function ChartCard({ icon: Icon, title, subtitle, children, isEmpty, emptyMsg }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={15} className="text-neutral-400" />
        <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
      </div>
      {subtitle && <p className="text-xs text-neutral-400 mb-4">{subtitle}</p>}

      {isEmpty ? (
        <div className="flex items-center justify-center h-40 text-xs text-neutral-300">
          {emptyMsg ?? 'No data yet'}
        </div>
      ) : children}
    </div>
  )
}

// ── Custom tooltip for Revenue chart ─────────────────────────────────────────

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-neutral-200 rounded-xl px-3 py-2 shadow-lg">
      <p className="text-xs text-neutral-500 mb-0.5">{label}</p>
      <p className="text-sm font-bold text-neutral-900">
        ${Number(payload[0].value).toFixed(2)}
      </p>
    </div>
  )
}

// ── 1. Revenue Trend (Area chart) ─────────────────────────────────────────────

function RevenueTrendChart({ data }) {
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0)
  const hasData = totalRevenue > 0

  return (
    <ChartCard
      icon={TrendingUp}
      title="Revenue Trend"
      subtitle="Served orders · last 14 days"
      isEmpty={!hasData}
      emptyMsg="No served orders in the last 14 days"
    >
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={BRAND} stopOpacity={0.18} />
              <stop offset="95%" stopColor={BRAND} stopOpacity={0}    />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: NEUTRAL }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(v) => `$${v}`}
            tick={{ fontSize: 10, fill: NEUTRAL }}
            axisLine={false}
            tickLine={false}
            width={46}
          />

          <Tooltip content={<RevenueTooltip />} />

          <Area
            type="monotone"
            dataKey="revenue"
            stroke={BRAND}
            strokeWidth={2}
            fill="url(#revenueGrad)"
            dot={false}
            activeDot={{ r: 4, fill: BRAND, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ── 2. Top 5 Popular Items (custom ranked list) ───────────────────────────────

function PopularItemsChart({ data }) {
  const maxCount = data[0]?.count ?? 1

  return (
    <ChartCard
      icon={Star}
      title="Top 5 Menu Items"
      subtitle="By total quantity ordered"
      isEmpty={data.length === 0}
      emptyMsg="No order data yet"
    >
      <div className="space-y-3 mt-1">
        {data.map((item, idx) => (
          <div key={item.name}>
            {/* Row header */}
            <div className="flex items-baseline justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                {/* Rank badge */}
                <span className={`text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0
                  ${idx === 0 ? 'bg-amber-400 text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                  {idx + 1}
                </span>
                <span className="text-sm font-medium text-neutral-800 truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <span className="text-xs text-neutral-500">{item.count}×</span>
                <span className="text-xs font-semibold text-brand-600">
                  ${item.revenue.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Fill bar */}
            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-400 rounded-full transition-all"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  )
}

// ── 3. Peak Hours (horizontal bar chart) ─────────────────────────────────────

function PeakHoursChart({ data }) {
  return (
    <ChartCard
      icon={Clock}
      title="Peak Hours"
      subtitle="Reservations by time slot (excl. cancelled)"
      isEmpty={data.length === 0}
      emptyMsg="No reservation data yet"
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 6, bottom: 0, left: 0 }}
        >
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: NEUTRAL }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="time"
            tick={{ fontSize: 11, fill: NEUTRAL }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            formatter={(v) => [v, 'Reservations']}
            cursor={{ fill: '#fafafa' }}
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid #e5e5e5',
              fontSize: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,.06)',
            }}
          />
          <Bar dataKey="count" fill={BRAND} radius={[0, 4, 4, 0]} maxBarSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ── 4. Revenue Per Table (bar chart) ─────────────────────────────────────────

const TABLE_COLORS = ['#f97316','#fb923c','#fdba74','#fed7aa','#ffedd5','#fff7ed','#fef3c7','#fde68a']

function RevenueByTableChart({ data }) {
  return (
    <ChartCard
      icon={Table2}
      title="Revenue per Table"
      subtitle="Served orders grouped by table ID"
      isEmpty={data.length === 0}
      emptyMsg="No served orders yet"
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
          <XAxis
            dataKey="tableId"
            tick={{ fontSize: 10, fill: NEUTRAL }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `$${v}`}
            tick={{ fontSize: 10, fill: NEUTRAL }}
            axisLine={false}
            tickLine={false}
            width={46}
          />
          <Tooltip
            formatter={(v, name) => [`$${Number(v).toFixed(2)}`, 'Revenue']}
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid #e5e5e5',
              fontSize: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,.06)',
            }}
            cursor={{ fill: '#fafafa' }}
          />
          <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={36}>
            {data.map((entry, index) => (
              <Cell key={entry.tableId} fill={TABLE_COLORS[index % TABLE_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Orders count below chart */}
      {data.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {data.map((entry, i) => (
            <span key={entry.tableId} className="text-[10px] text-neutral-500">
              <span
                className="inline-block w-2 h-2 rounded-full mr-1"
                style={{ background: TABLE_COLORS[i % TABLE_COLORS.length] }}
              />
              {entry.tableId}: {entry.orders} order{entry.orders !== 1 ? 's' : ''}
            </span>
          ))}
        </div>
      )}
    </ChartCard>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Renders analytics charts for the manager dashboard.
 */
export default function AnalyticsCharts({ revenueTrend, popularItems, peakHours, revenueByTable = [] }) {
  return (
    <div className="space-y-4">
      {/* Full-width revenue trend */}
      <RevenueTrendChart data={revenueTrend} />

      {/* Two-column: popular items + peak hours */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PopularItemsChart data={popularItems} />
        <PeakHoursChart    data={peakHours}    />
      </div>

      {/* Full-width: revenue per table */}
      <RevenueByTableChart data={revenueByTable} />
    </div>
  )
}
