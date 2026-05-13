import { create } from 'zustand'
import {
  subscribeUserNotifications,
  markNotificationRead,
  markAllRead,
} from '../services/notificationService'

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  _unsub: null,

  subscribe: (uid) => {
    // Unsubscribe from any previous listener
    get()._unsub?.()

    set({ loading: true })
    const unsub = subscribeUserNotifications(uid, (data) => {
      const unread = data.filter((n) => !n.read).length
      set({ notifications: data, unreadCount: unread, loading: false })
    })
    set({ _unsub: unsub })
    return unsub
  },

  unsubscribe: () => {
    get()._unsub?.()
    set({ _unsub: null, notifications: [], unreadCount: 0 })
  },

  markRead: async (id) => {
    await markNotificationRead(id)
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }))
  },

  markAllRead: async (uid) => {
    await markAllRead(uid)
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }))
  },
}))

export default useNotificationStore
