/**
 * AdvancedReports
 * ──────────────
 * Staff performance derived from real Firestore order data.
 * Inventory consumption calculated from menu item ingredients × orders served.
 */

import { useEffect, useState } from 'react'
import { Star, Users, Package, AlertTriangle, CheckCircle2, XCircle, Download, RefreshCw } from 'lucide-react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../../firebase/config'
import EmailLog from './EmailLog'

// ── CSV export helper ─────────────────────────────────────────────────────────

function downloadCSV(filename, headers, rows) {
  const escape = (val) => {
    const s = String(val ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ── Ingredient definitions (amount consumed per serving of each menu item) ────
// Maps menu item name → ingredients used
const ITEM_INGREDIENTS = {
  'Bruschetta':          [{ name: 'Sourdough Bread', unit: 'loaves', qty: 0.5 }, { name: 'San Marzano Tomatoes', unit: 'kg', qty: 0.1 }, { name: 'Fresh Basil', unit: 'bunches', qty: 0.2 }],
  'Bruschetta al Pomodoro': [{ name: 'Sourdough Bread', unit: 'loaves', qty: 0.5 }, { name: 'San Marzano Tomatoes', unit: 'kg', qty: 0.1 }, { name: 'Fresh Basil', unit: 'bunches', qty: 0.2 }],
  'Tagliatelle Ragù':    [{ name: 'Carnaroli Rice', unit: 'kg', qty: 0.15 }, { name: 'San Marzano Tomatoes', unit: 'kg', qty: 0.12 }, { name: 'Parmigiano Reggiano', unit: 'kg', qty: 0.04 }],
  'Tagliatelle al Ragù': [{ name: 'Carnaroli Rice', unit: 'kg', qty: 0.15 }, { name: 'San Marzano Tomatoes', unit: 'kg', qty: 0.12 }, { name: 'Parmigiano Reggiano', unit: 'kg', qty: 0.04 }],
  'Mushroom Risotto':    [{ name: 'Carnaroli Rice', unit: 'kg', qty: 0.2 }, { name: 'Wild Porcini', unit: 'kg', qty: 0.08 }, { name: 'Truffle Oil', unit: 'bottles', qty: 0.04 }, { name: 'Parmigiano Reggiano', unit: 'kg', qty: 0.03 }],
  'Risotto ai Funghi':   [{ name: 'Carnaroli Rice', unit: 'kg', qty: 0.2 }, { name: 'Wild Porcini', unit: 'kg', qty: 0.08 }, { name: 'Truffle Oil', unit: 'bottles', qty: 0.04 }, { name: 'Parmigiano Reggiano', unit: 'kg', qty: 0.03 }],
  'Tiramisù':            [{ name: 'Mascarpone Cream', unit: 'kg', qty: 0.1 }, { name: 'Espresso Beans', unit: 'kg', qty: 0.02 }, { name: 'Ladyfinger Biscuits', unit: 'packs', qty: 0.12 }],
  'Panna Cotta':         [{ name: 'Mascarpone Cream', unit: 'kg', qty: 0.08 }],
  'Fresh Lemonade':      [{ name: 'Fresh Lemons', unit: 'kg', qty: 0.15 }],
  'Limonata Fresca':     [{ name: 'Fresh Lemons', unit: 'kg', qty: 0.15 }],
  'Caprese Salad':       [{ name: 'Buffalo Mozzarella', unit: 'kg', qty: 0.15 }, { name: 'San Marzano Tomatoes', unit: 'kg', qty: 0.1 }, { name: 'Fresh Basil', unit: 'bunches', qty: 0.15 }],
  'Insalata Caprese':    [{ name: 'Buffalo Mozzarella', unit: 'kg', qty: 0.15 }, { name: 'San Marzano Tomatoes', unit: 'kg', qty: 0.1 }, { name: 'Fresh Basil', unit: 'bunches', qty: 0.15 }],
  'Spicy Arrabbiata':    [{ name: 'San Marzano Tomatoes', unit: 'kg', qty: 0.15 }],
  'Bistecca Fiorentina': [{ name: 'Fresh Basil', unit: 'bunches', qty: 0.05 }, { name: 'Truffle Oil', unit: 'bottles', qty: 0.02 }],
}

// Base stock levels (simulates a starting inventory count)
const BASE_STOCK = {
  'Sourdough Bread':      { unit: 'loaves', base: 300 },
  'San Marzano Tomatoes': { unit: 'kg',     base: 50  },
  'Parmigiano Reggiano':  { unit: 'kg',     base: 20  },
  'Carnaroli Rice':       { unit: 'kg',     base: 30  },
  'Wild Porcini':         { unit: 'kg',     base: 10  },
  'Mascarpone Cream':     { unit: 'kg',     base: 20  },
  'Espresso Beans':       { unit: 'kg',     base: 12  },
  'Buffalo Mozzarella':   { unit: 'kg',     base: 25  },
  'Truffle Oil':          { unit: 'bottles',base: 8   },
  'Fresh Lemons':         { unit: 'kg',     base: 45  },
  'Ladyfinger Biscuits':  { unit: 'packs',  base: 18  },
  'Fresh Basil':          { unit: 'bunches',base: 70  },
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchStaffPerformance(orders) {
  // 1. Fetch all staff + manager users
  const usersSnap = await getDocs(collection(db, 'users'))
  const staffUsers = usersSnap.docs
    .map((d) => ({ uid: d.id, ...d.data() }))
    .filter((u) => u.role === 'staff' || u.role === 'manager')

  // 2. Aggregate orders processed by each staff member
  const statsMap = {}
  for (const order of orders) {
    const uid  = order.processedByUid
    const name = order.processedByName
    if (!uid) continue
    if (!statsMap[uid]) {
      statsMap[uid] = { uid, name: name ?? uid, ordersProcessed: 0, totalRevenue: 0 }
    }
    statsMap[uid].ordersProcessed += 1
    if (order.status === 'served') statsMap[uid].totalRevenue += order.total ?? 0
  }

  // 3. Merge with user records to get email/role; fill zeros for staff with no orders yet
  const result = staffUsers.map((u) => {
    const stat = statsMap[u.uid] ?? { ordersProcessed: 0, totalRevenue: 0 }
    return {
      uid:             u.uid,
      name:            u.email?.split('@')[0] ?? u.uid,
      email:           u.email ?? '—',
      role:            u.role === 'manager' ? 'Manager' : 'Staff',
      ordersProcessed: stat.ordersProcessed,
      totalRevenue:    stat.totalRevenue,
      status:          'active',
    }
  }).sort((a, b) => b.ordersProcessed - a.ordersProcessed)

  return result
}

function computeInventory(orders) {
  // Sum ingredient consumption from all orders (any status — kitchen uses ingredients regardless)
  const consumed = {}
  for (const order of orders) {
    for (const item of order.items ?? []) {
      const ingredients = ITEM_INGREDIENTS[item.name]
      if (!ingredients) continue
      for (const ing of ingredients) {
        if (!consumed[ing.name]) consumed[ing.name] = 0
        consumed[ing.name] += ing.qty * (item.qty ?? 1)
      }
    }
  }

  return Object.entries(BASE_STOCK).map(([name, { unit, base }]) => {
    const used  = Math.round((consumed[name] ?? 0) * 10) / 10
    const stock = Math.max(0, Math.round((base - used) * 10) / 10)
    const ratio = stock / base
    const status = stock === 0 ? 'critical' : ratio < 0.2 ? 'low' : 'in-stock'
    return { ingredient: name, unit, used, stock, status }
  }).sort((a, b) => {
    const rank = { critical: 0, low: 1, 'in-stock': 2 }
    return (rank[a.status] ?? 3) - (rank[b.status] ?? 3)
  })
}

// ── Badge helpers ─────────────────────────────────────────────────────────────

const INV_STATUS = {
  'in-stock': { label: 'In Stock',  icon: CheckCircle2,  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  low:        { label: 'Low Stock', icon: AlertTriangle, cls: 'bg-amber-50   text-amber-700   border-amber-200'   },
  critical:   { label: 'Critical',  icon: XCircle,       cls: 'bg-red-50     text-red-600     border-red-200'     },
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ icon: Icon, title, subtitle, children, onExport, onRefresh, refreshing }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100">
        <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
          <Icon size={15} className="text-brand-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
          {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-brand-600 border border-neutral-200 hover:border-brand-300 px-3 py-1.5 rounded-lg transition"
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          )}
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-brand-600 border border-neutral-200 hover:border-brand-300 px-3 py-1.5 rounded-lg transition"
            >
              <Download size={12} /> Export CSV
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

// ── Staff Performance table ───────────────────────────────────────────────────

function StaffTable({ staff, loading, onRefresh, refreshing }) {
  const handleExport = () =>
    downloadCSV(
      'staff-performance.csv',
      ['Name', 'Email', 'Role', 'Orders Processed', 'Revenue Generated ($)', 'Status'],
      staff.map((s) => [s.name, s.email, s.role, s.ordersProcessed, s.totalRevenue.toFixed(2), s.status])
    )

  return (
    <Section
      icon={Users}
      title="Staff Performance"
      subtitle="Based on real order processing data from Firestore"
      onExport={staff.length > 0 ? handleExport : undefined}
      onRefresh={onRefresh}
      refreshing={refreshing}
    >
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-7 w-7 border-2 border-brand-400 border-t-transparent" />
        </div>
      ) : staff.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-neutral-400">
          No staff records found. Ensure staff members have been assigned the <code className="bg-neutral-100 px-1 rounded">staff</code> role in Firestore.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide border-b border-neutral-100">
              <tr>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Role</th>
                <th className="px-6 py-3 text-center">Orders Processed</th>
                <th className="px-6 py-3 text-right">Revenue Generated</th>
                <th className="px-6 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {staff.map((s) => (
                <tr key={s.uid} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-3">
                    <p className="font-medium text-neutral-900">{s.name}</p>
                    <p className="text-xs text-neutral-400">{s.email}</p>
                  </td>
                  <td className="px-6 py-3 text-neutral-500">{s.role}</td>
                  <td className="px-6 py-3 text-center">
                    <span className="font-bold text-neutral-800">{s.ordersProcessed}</span>
                    {s.ordersProcessed === 0 && (
                      <span className="text-xs text-neutral-400 block">no data yet</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right font-semibold text-emerald-600">
                    ${s.totalRevenue.toFixed(2)}
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  )
}

// ── Inventory Usage table ─────────────────────────────────────────────────────

function InventoryTable({ inventory, loading }) {
  const criticalCount = inventory.filter((i) => i.status === 'critical').length
  const lowCount      = inventory.filter((i) => i.status === 'low').length

  const handleExport = () =>
    downloadCSV(
      'inventory-usage.csv',
      ['Ingredient', 'Unit', 'Consumed (from orders)', 'In Stock (est.)', 'Status'],
      inventory.map((i) => [i.ingredient, i.unit, i.used, i.stock, i.status])
    )

  return (
    <Section
      icon={Package}
      title="Inventory Usage"
      subtitle="Consumption estimated from real order data · stock is an estimate based on starting levels"
      onExport={inventory.length > 0 ? handleExport : undefined}
    >
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-7 w-7 border-2 border-brand-400 border-t-transparent" />
        </div>
      ) : (
        <>
          {(criticalCount + lowCount) > 0 && (
            <div className="mx-6 mt-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-700">
              <AlertTriangle size={14} className="shrink-0" />
              <span>
                <strong>{criticalCount} critical</strong> and <strong>{lowCount} low-stock</strong> items need attention.
              </span>
            </div>
          )}

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide border-b border-neutral-100">
                <tr>
                  <th className="px-6 py-3 text-left">Ingredient</th>
                  <th className="px-6 py-3 text-left">Unit</th>
                  <th className="px-6 py-3 text-right">Consumed</th>
                  <th className="px-6 py-3 text-right">Est. Stock</th>
                  <th className="px-6 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {inventory.map((item) => {
                  const { label, icon: StatusIcon, cls } = INV_STATUS[item.status]
                  const isUrgent = item.status !== 'in-stock'
                  return (
                    <tr key={item.ingredient} className={`transition-colors ${isUrgent ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-neutral-50'}`}>
                      <td className="px-6 py-3 font-medium text-neutral-900">{item.ingredient}</td>
                      <td className="px-6 py-3 text-neutral-400 capitalize">{item.unit}</td>
                      <td className="px-6 py-3 text-right font-semibold text-neutral-700">{item.used}</td>
                      <td className={`px-6 py-3 text-right font-bold ${item.stock === 0 ? 'text-red-600' : item.stock < 3 ? 'text-amber-600' : 'text-neutral-900'}`}>
                        {item.stock}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`}>
                          <StatusIcon size={10} />{label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-4 px-6 py-4 border-t border-neutral-100 text-xs text-neutral-400">
            {Object.entries(INV_STATUS).map(([key, { label, cls }]) => (
              <span key={key} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${cls}`}>
                {label}
              </span>
            ))}
            <span className="ml-auto italic">Stock calculated from order history · replenish before hitting 0.</span>
          </div>
        </>
      )}
    </Section>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function AdvancedReports() {
  const [orders, setOrders]         = useState([])
  const [staff, setStaff]           = useState([])
  const [inventory, setInventory]   = useState([])
  const [loadingStaff, setLoadingStaff]   = useState(true)
  const [refreshingStaff, setRefreshingStaff] = useState(false)
  const [loadingInv, setLoadingInv] = useState(true)

  const loadData = async (refresh = false) => {
    if (refresh) setRefreshingStaff(true)
    else { setLoadingStaff(true); setLoadingInv(true) }

    try {
      // Fetch orders
      const orderSnap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')))
      const allOrders = orderSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setOrders(allOrders)

      // Staff performance
      const staffData = await fetchStaffPerformance(allOrders)
      setStaff(staffData)

      // Inventory
      setInventory(computeInventory(allOrders))
    } catch (err) {
      console.error('AdvancedReports load error:', err)
    } finally {
      setLoadingStaff(false)
      setLoadingInv(false)
      setRefreshingStaff(false)
    }
  }

  useEffect(() => { loadData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Reports</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Staff performance, inventory, and communication logs — all from live Firestore data.
        </p>
      </div>

      <StaffTable
        staff={staff}
        loading={loadingStaff}
        onRefresh={() => loadData(true)}
        refreshing={refreshingStaff}
      />
      <InventoryTable inventory={inventory} loading={loadingInv} />
      <EmailLog />
    </div>
  )
}
