import { useEffect, useRef, useState } from 'react'
import { Bell, BellRing, CheckCheck, X } from 'lucide-react'
import useAuthStore from '../../store/useAuthStore'
import useNotificationStore from '../../store/useNotificationStore'

function timeAgo(ts) {
  if (!ts) return ''
  const ms = ts.toMillis?.() ?? new Date(ts).getTime()
  const diff = Math.floor((Date.now() - ms) / 1000)
  if (diff < 60)   return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NotificationBell() {
  const { user } = useAuthStore()
  const { notifications, unreadCount, subscribe, unsubscribe, markRead, markAllRead } =
    useNotificationStore()
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

  // Subscribe to real-time notifications when user logs in
  useEffect(() => {
    if (!user?.uid) {
      unsubscribe()
      return
    }
    const unsub = subscribe(user.uid)
    return () => unsub()
  }, [user?.uid]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close panel when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!user) return null

  const BellIcon = unreadCount > 0 ? BellRing : Bell

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl text-neutral-500 hover:bg-neutral-100 transition"
        aria-label="Notifications"
      >
        <BellIcon
          size={18}
          className={unreadCount > 0 ? 'text-brand-500 animate-[wiggle_1s_ease-in-out]' : ''}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white border border-neutral-200 rounded-2xl shadow-xl z-[100] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
            <h3 className="text-sm font-semibold text-neutral-900">
              Notifications {unreadCount > 0 && <span className="text-brand-500">({unreadCount})</span>}
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead(user.uid)}
                  className="text-xs text-brand-600 hover:underline flex items-center gap-1"
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-neutral-300">
                <Bell size={32} className="mb-2 opacity-50" />
                <p className="text-sm text-neutral-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full text-left flex gap-3 px-4 py-3 border-b border-neutral-50 transition hover:bg-neutral-50 ${
                    !n.read ? 'bg-brand-50/40' : ''
                  }`}
                >
                  {/* Icon */}
                  <span className="text-xl shrink-0 mt-0.5">{n.icon ?? '🔔'}</span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium leading-snug ${!n.read ? 'text-neutral-900' : 'text-neutral-600'}`}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-neutral-300 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-neutral-100 text-center">
              <p className="text-xs text-neutral-400">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''} total
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
