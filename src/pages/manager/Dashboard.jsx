import { useEffect, useState } from 'react'
import {
  TrendingUp, Users, CalendarCheck, UtensilsCrossed,
  Clock, Loader2, ArrowUpRight, Euro, Star, Award,
  ChefHat, TableProperties,
} from 'lucide-react'
import { getDashboardStats } from '../../services/dashboardService'

// ── Mock data ────────────────────────────────────────────────────────────────

const WEEKLY_DATA = [
  { day: 'Mon', revenue: 820 },
  { day: 'Tue', revenue: 1140 },
  { day: 'Wed', revenue: 960 },
  { day: 'Thu', revenue: 1380 },
  { day: 'Fri', revenue: 2100 },
  { day: 'Sat', revenue: 2580 },
  { day: 'Sun', revenue: 1760 },
]

const REVENUE_PER_TABLE = [
  { tableId: 'T7', zone: 'Outdoor', revenue: 3240, covers: 18 },
  { tableId: 'T3', zone: 'Indoor',  revenue: 2870, covers: 22 },
  { tableId: 'T5', zone: 'Window',  revenue: 2560, covers: 14 },
  { tableId: 'T8', zone: 'Outdoor', revenue: 2210, covers: 12 },
  { tableId: 'T2', zone: 'Indoor',  revenue: 1980, covers: 20 },
  { tableId: 'T4', zone: 'Window',  revenue: 1640, covers: 10 },
]

const POPULAR_ITEMS = [
  { name: 'Bistecca Fiorentina', category: 'Mains',    orders: 47, revenue: 1316, emoji: '🥩' },
  { name: 'Tagliatelle al Ragù', category: 'Mains',    orders: 63, revenue: 1008, emoji: '🍝' },
  { name: 'Tiramisù',            category: 'Desserts', orders: 58, revenue:  406, emoji: '☕' },
  { name: 'Risotto ai Funghi',   category: 'Mains',    orders: 41, revenue:  595, emoji: '🍄' },
  { name: 'Insalata Caprese',    category: 'Starters', orders: 39, revenue:  351, emoji: '🥗' },
]

const STAFF_PERFORMANCE = [
  { name: 'Sofia Bianchi', role: 'Waiter',  covers: 84, rating: 4.9, upsells: 23, shifts: 5 },
  { name: 'Marco Ricci',   role: 'Waiter',  covers: 71, rating: 4.7, upsells: 17, shifts: 5 },
  { name: 'Giulia Ferro',  role: 'Waiter',  covers: 68, rating: 4.8, upsells: 19, shifts: 4 },
  { name: 'Luca Romano',   role: 'Waiter',  covers: 52, rating: 4.5, upsells: 11, shifts: 4 },
  { name: 'Anna Conti',    role: 'Hostess', covers: 94, rating: 4.9, upsells: 0,  shifts: 5 },
]

const MAX_REVENUE = Math.max(...WEEKLY_DATA.map((d) => d.revenue))
const MAX_TABLE_REV = REVENUE_PER_TABLE[0].revenue

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, trend, color }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 text-emerald-500 text-xs font-medium mt-1">
              <ArrowUpRight size={13} />
              {trend} vs last month
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  )
}

function BarChart({ data }) {
  return (
    <div className="flex items-end gap-2 h-40 px-1">
      {data.map((d, i) => {
        const height = Math.round((d.revenue / MAX_REVENUE) * 100)
        const isToday = i === ((new Date().getDay() + 6) % 7) // Mon=0
        return (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
            <span className="text-[11px] text-neutral-400">€{(d.revenue / 1000).toFixed(1)}k</span>
            <div className="w-full" style={{ height: `${height}%` }}>
              <div className={`w-full h-full rounded-t-md transition-all ${isToday ? 'bg-brand-500' : 'bg-brand-200 hover:bg-brand-400'}`} />
            </div>
            <span className={`text-[11px] font-medium ${isToday ? 'text-brand-600' : 'text-neutral-400'}`}>
              {d.day}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function RevenuePerTable({ data }) {
  return (
    <div className="space-y-2.5">
      {data.map((t) => {
        const pct = Math.round((t.revenue / MAX_TABLE_REV) * 100)
        const zoneColor = { Indoor: 'bg-violet-400', Window: 'bg-sky-400', Outdoor: 'bg-emerald-400' }
        return (
          <div key={t.tableId}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-700 w-6">{t.tableId}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md text-white ${zoneColor[t.zone] ?? 'bg-neutral-400'}`}>
                  {t.zone}
                </span>
                <span className="text-[11px] text-neutral-400">{t.covers} covers</span>
              </div>
              <span className="text-xs font-bold text-neutral-900">€{t.revenue.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-400 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PopularItems({ items }) {
  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={item.name} className="flex items-center gap-3">
          <span className="text-xs font-bold text-neutral-300 w-4 text-right">{idx + 1}</span>
          <span className="text-xl">{item.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-neutral-900 truncate">{item.name}</p>
            <p className="text-[11px] text-neutral-400">{item.orders} orders · €{item.revenue}</p>
          </div>
          {idx === 0 && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full">
              <Star size={9} fill="currentColor" /> Top
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function StaffTable({ staff }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-100">
            {['Staff Member', 'Role', 'Covers', 'Upsells', 'Shifts', 'Rating'].map((h) => (
              <th key={h} className="text-left pb-2.5 text-xs font-semibold text-neutral-400 uppercase tracking-wide whitespace-nowrap pr-4">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-50">
          {staff.map((s, idx) => (
            <tr key={s.name} className="hover:bg-neutral-50 transition-colors">
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  {idx === 0 && <Award size={14} className="text-amber-400 shrink-0" />}
                  <span className="font-medium text-neutral-900">{s.name}</span>
                </div>
              </td>
              <td className="py-3 pr-4">
                <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-medium">
                  {s.role}
                </span>
              </td>
              <td className="py-3 pr-4 font-semibold text-neutral-900">{s.covers}</td>
              <td className="py-3 pr-4 text-neutral-600">{s.upsells}</td>
              <td className="py-3 pr-4 text-neutral-600">{s.shifts}</td>
              <td className="py-3">
                <div className="flex items-center gap-1">
                  <Star size={12} fill="#f59e0b" className="text-amber-400" />
                  <span className="font-semibold text-neutral-900">{s.rating}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getDashboardStats()
        setStats(data)
      } catch {
        setStats({
          totalReservations: 38,
          confirmedReservations: 24,
          pendingReservations: 9,
          totalMenuItems: 32,
          revenueThisMonth: 12840,
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-brand-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-7">
          <h1 className="text-xl font-bold text-neutral-900">Manager Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          <StatCard label="Revenue (Month)" value={`€${stats.revenueThisMonth.toLocaleString()}`} icon={Euro}         trend="+12%" color="bg-brand-500" />
          <StatCard label="Reservations"    value={stats.totalReservations}                       icon={CalendarCheck} trend="+8%"  color="bg-emerald-500" />
          <StatCard label="Confirmed"       value={stats.confirmedReservations}                   icon={Users}                      color="bg-blue-500" />
          <StatCard label="Menu Items"      value={stats.totalMenuItems}                          icon={UtensilsCrossed}             color="bg-violet-500" />
        </div>

        {/* Row 1: Weekly chart + Revenue per table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* Weekly revenue bar chart */}
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-neutral-900 text-sm">Weekly Revenue</h2>
                <p className="text-xs text-neutral-400 mt-0.5">This week's daily breakdown</p>
              </div>
              <TrendingUp size={18} className="text-brand-400" />
            </div>
            <BarChart data={WEEKLY_DATA} />
          </div>

          {/* Revenue per table */}
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-neutral-900 text-sm">Revenue per Table</h2>
                <p className="text-xs text-neutral-400 mt-0.5">This month · all zones</p>
              </div>
              <TableProperties size={18} className="text-brand-400" />
            </div>
            <RevenuePerTable data={REVENUE_PER_TABLE} />
          </div>
        </div>

        {/* Row 2: Popular items + Pending */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          {/* Popular menu items */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-neutral-900 text-sm">Popular Menu Items</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Most ordered this month</p>
              </div>
              <Star size={18} className="text-amber-400" />
            </div>
            <PopularItems items={POPULAR_ITEMS} />
          </div>

          {/* Pending reservations */}
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-neutral-900 text-sm">Pending</h2>
              <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                {stats.pendingReservations}
              </span>
            </div>
            <div className="space-y-3">
              {Array.from({ length: Math.min(stats.pendingReservations, 5) }, (_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">Table {i + 1}</p>
                    <p className="text-xs text-neutral-400 flex items-center gap-1">
                      <Clock size={11} />{18 + i}:00 — {2 + i} guests
                    </p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                </div>
              ))}
              {stats.pendingReservations === 0 && (
                <p className="text-sm text-neutral-400 text-center py-4">All clear</p>
              )}
            </div>
          </div>
        </div>

        {/* Row 3: Staff performance */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-neutral-900 text-sm">Staff Performance</h2>
              <p className="text-xs text-neutral-400 mt-0.5">This month · ranked by covers served</p>
            </div>
            <ChefHat size={18} className="text-brand-400" />
          </div>
          <StaffTable staff={STAFF_PERFORMANCE} />
        </div>
      </div>
    </div>
  )
}
