/**
 * EmailLog
 * Shows all outbound email/SMS communications logged in Firestore.
 * Part of the Manager Reports section.
 */

import { useEffect, useState } from 'react'
import { Mail, RefreshCw, CheckCircle2, Clock, Download } from 'lucide-react'
import { getEmailLog } from '../../services/emailService'

const TYPE_COLORS = {
  reservation_received:  'bg-blue-50   text-blue-700   border-blue-200',
  reservation_confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  reservation_cancelled: 'bg-red-50    text-red-700    border-red-200',
  order_placed:          'bg-amber-50  text-amber-700  border-amber-200',
  order_preparing:       'bg-orange-50 text-orange-700 border-orange-200',
  order_ready:           'bg-teal-50   text-teal-700   border-teal-200',
  order_served:          'bg-purple-50 text-purple-700 border-purple-200',
  password_reset:        'bg-neutral-50 text-neutral-600 border-neutral-200',
}

const STATUS_ICON = {
  sent:      <CheckCircle2 size={11} className="text-emerald-500" />,
  simulated: <Clock        size={11} className="text-amber-500"   />,
}

function downloadCSV(logs) {
  const headers = ['Date', 'To', 'Subject', 'Type', 'Status', 'Channel']
  const rows = logs.map((l) => [
    l.createdAt?.toDate?.()?.toLocaleString() ?? '',
    l.to,
    l.subject,
    l.typeLabel ?? l.type,
    l.status,
    l.channel,
  ])
  const escape = (v) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url; a.download = 'email-log.csv'; a.click()
  URL.revokeObjectURL(url)
}

export default function EmailLog() {
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await getEmailLog(200)
      setLogs(data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const sentCount      = logs.filter((l) => l.status === 'sent').length
  const simulatedCount = logs.filter((l) => l.status === 'simulated').length

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100">
        <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
          <Mail size={15} className="text-brand-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-neutral-900">Email &amp; SMS Log</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            {logs.length} messages &mdash; {sentCount} sent, {simulatedCount} simulated
          </p>
        </div>
        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <button
              onClick={() => downloadCSV(logs)}
              className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-brand-600 border border-neutral-200 hover:border-brand-300 px-3 py-1.5 rounded-lg transition"
            >
              <Download size={12} /> Export CSV
            </button>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-brand-600 border border-neutral-200 hover:border-brand-300 px-3 py-1.5 rounded-lg transition"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* EmailJS config hint */}
      {simulatedCount > 0 && (
        <div className="mx-6 mt-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
          <Clock size={13} className="shrink-0 mt-0.5" />
          <span>
            <strong>{simulatedCount} messages</strong> were simulated (no EmailJS credentials configured).
            Set <code className="bg-amber-100 px-1 rounded">VITE_EMAILJS_*</code> env vars to activate real delivery.
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-7 w-7 border-2 border-brand-400 border-t-transparent" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-neutral-400 text-sm">
          No emails logged yet — they appear here as customers make reservations and orders.
        </div>
      ) : (
        <div className="divide-y divide-neutral-50">
          {logs.map((log) => {
            const date = log.createdAt?.toDate?.()
            const isExpanded = expanded === log.id
            return (
              <div key={log.id} className="px-6 py-3 hover:bg-neutral-50 transition-colors">
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : log.id)}
                >
                  <div className="flex items-center gap-1 shrink-0">
                    {STATUS_ICON[log.status] ?? <Clock size={11} />}
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${TYPE_COLORS[log.type] ?? 'bg-neutral-50 text-neutral-600 border-neutral-200'}`}>
                    {log.typeLabel ?? log.type}
                  </span>
                  <span className="text-sm text-neutral-800 truncate flex-1">{log.to}</span>
                  <span className="text-xs text-neutral-400 shrink-0">
                    {date ? date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </span>
                </div>
                {isExpanded && (
                  <div className="mt-2 ml-8 bg-neutral-50 rounded-xl p-3 space-y-1">
                    <p className="text-xs font-semibold text-neutral-700">{log.subject}</p>
                    <pre className="text-xs text-neutral-500 whitespace-pre-wrap leading-relaxed font-sans">{log.body}</pre>
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
