import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  where,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'

const COL = 'orders'

export const getOrders = async () => {
  const snap = await getDocs(query(collection(db, COL), orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * @param {Object} order
 * @param {string} order.tableId
 * @param {string} order.customerName
 * @param {Array}  order.items  - [{ id, name, price, qty, customization }]
 * @param {number} order.total
 * @param {string} order.notes
 */
export const addOrder = async (order) => {
  const docRef = await addDoc(collection(db, COL), {
    ...order,
    status: 'pending',
    createdAt: Timestamp.now(),
  })
  return docRef.id
}

export const updateOrderStatus = async (id, status, staffId = null, staffName = null) => {
  const update = { status, updatedAt: Timestamp.now() }
  if (staffId)   update.processedByUid  = staffId
  if (staffName) update.processedByName = staffName
  await updateDoc(doc(db, COL, id), update)
}

/**
 * Real-time listener for the kitchen's active order queue.
 *
 * Only returns orders with status pending | preparing | ready.
 * Results are sorted oldest-first (FIFO) client-side to avoid requiring
 * a Firestore composite index on (status, createdAt).
 *
 * @param {(orders: Array) => void} callback
 * @returns {() => void} unsubscribe function
 */
export const subscribeActiveOrders = (callback) => {
  const q = query(
    collection(db, COL),
    where('status', 'in', ['pending', 'preparing', 'ready'])
  )
  return onSnapshot(q, (snap) => {
    const orders = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0))
    callback(orders)
  })
}
