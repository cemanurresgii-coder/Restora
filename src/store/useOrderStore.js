import { create } from 'zustand'
import {
  addOrder,
  getOrders,
  updateOrderStatus,
  subscribeActiveOrders as _subscribeActiveOrders,
} from '../services/orderService'
import {
  notifyOrderPreparing,
  notifyOrderReady,
  notifyOrderServed,
} from '../services/notificationService'

export const ORDER_STATUS = {
  PENDING:    'pending',    // Order placed, not yet seen by kitchen
  PREPARING:  'preparing',  // Kitchen is working on it
  READY:      'ready',      // Ready to be served
  SERVED:     'served',     // Delivered to table
  CANCELLED:  'cancelled',
}

const useOrderStore = create((set, get) => ({
  orders: [],
  activeOrder: null,   // customer's in-progress cart (pre-submission)
  activeOrders: [],    // kitchen's live queue (pending | preparing | ready)
  loading: false,
  error: null,

  // Customer: build order before submitting
  setActiveOrder: (order) => set({ activeOrder: order }),
  clearActiveOrder: () => set({ activeOrder: null }),

  // Submit order to Firestore / mock
  placeOrder: async (orderData) => {
    set({ loading: true, error: null })
    try {
      const id = await addOrder(orderData)
      const newOrder = { id, ...orderData, status: ORDER_STATUS.PENDING }
      set((s) => ({ orders: [newOrder, ...s.orders], activeOrder: null, loading: false }))
      return id
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  fetchOrders: async () => {
    set({ loading: true, error: null })
    try {
      const orders = await getOrders()
      set({ orders, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  updateStatus: async (id, status, staffId = null, staffName = null) => {
    await updateOrderStatus(id, status, staffId, staffName)
    set((s) => ({
      orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)),
      activeOrders: s.activeOrders.map((o) => (o.id === id ? { ...o, status } : o)),
    }))

    // Send in-app notifications + email to the customer
    const order = get().activeOrders.find((o) => o.id === id)
      ?? get().orders.find((o) => o.id === id)
    const uid     = order?.uid
    const email   = order?.customerEmail ?? null
    const tableId = order?.tableId ?? ''
    if (uid) {
      if (status === ORDER_STATUS.PREPARING) notifyOrderPreparing(uid, email, tableId)
      else if (status === ORDER_STATUS.READY)  notifyOrderReady(uid, email, tableId)
      else if (status === ORDER_STATUS.SERVED)  notifyOrderServed(uid, email, tableId)
    }
  },

  // Derived: orders grouped by status for kitchen/staff view
  getOrdersByStatus: (status) => {
    return get().orders.filter((o) => o.status === status)
  },

  /**
   * Opens a real-time Firestore listener that populates `activeOrders`.
   * Call inside a useEffect and use the returned unsubscribe for cleanup.
   * Multiple concurrent calls are safe — each returns its own unsubscribe.
   */
  subscribeActiveOrders: () => {
    const unsub = _subscribeActiveOrders((orders) => {
      set({ activeOrders: orders })
    })
    return unsub
  },
}))

export default useOrderStore
