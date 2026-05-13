/**
 * Notification Service
 * Stores in-app notifications in Firestore (simulates email/SMS delivery).
 * Each notification targets a specific user (uid) or broadcasts to all staff/managers.
 */

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'

const COL = 'notifications'

export const NOTIF_TYPE = {
  RESERVATION_RECEIVED:  'reservation_received',
  RESERVATION_CONFIRMED: 'reservation_confirmed',
  RESERVATION_CANCELLED: 'reservation_cancelled',
  ORDER_PLACED:          'order_placed',
  ORDER_PREPARING:       'order_preparing',
  ORDER_READY:           'order_ready',
  ORDER_SERVED:          'order_served',
  STAFF_ALERT:           'staff_alert',
}

const ICONS = {
  [NOTIF_TYPE.RESERVATION_RECEIVED]:  '📅',
  [NOTIF_TYPE.RESERVATION_CONFIRMED]: '✅',
  [NOTIF_TYPE.RESERVATION_CANCELLED]: '❌',
  [NOTIF_TYPE.ORDER_PLACED]:          '🛒',
  [NOTIF_TYPE.ORDER_PREPARING]:       '👨‍🍳',
  [NOTIF_TYPE.ORDER_READY]:           '🍽️',
  [NOTIF_TYPE.ORDER_SERVED]:          '🎉',
  [NOTIF_TYPE.STAFF_ALERT]:           '🔔',
}

/**
 * Create a notification for a specific user or role audience.
 * @param {{ uid: string, type: string, title: string, message: string, audience?: 'user'|'staff'|'manager' }}
 */
export const createNotification = async ({ uid, type, title, message, audience = 'user' }) => {
  try {
    await addDoc(collection(db, COL), {
      uid: uid || '',
      type,
      title,
      message,
      icon: ICONS[type] ?? '🔔',
      audience,
      read: false,
      createdAt: Timestamp.now(),
    })
    // Simulate email/SMS console log
    console.info(`[Mock Email/SMS] → ${uid || audience}: ${title} — ${message}`)
  } catch (err) {
    console.error('Failed to create notification:', err)
  }
}

/** Fetch all notifications for a user (one-time). */
export const getUserNotifications = async (uid) => {
  const q = query(
    collection(db, COL),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/** Real-time listener for a user's notifications. */
export const subscribeUserNotifications = (uid, callback) => {
  const q = query(collection(db, COL), where('uid', '==', uid))
  return onSnapshot(q, (snap) => {
    const data = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const aMs = a.createdAt?.toMillis?.() ?? 0
        const bMs = b.createdAt?.toMillis?.() ?? 0
        return bMs - aMs
      })
    callback(data)
  })
}

/** Mark a single notification as read. */
export const markNotificationRead = async (id) => {
  await updateDoc(doc(db, COL, id), { read: true })
}

/** Mark all user notifications as read. */
export const markAllRead = async (uid) => {
  const q = query(collection(db, COL), where('uid', '==', uid), where('read', '==', false))
  const snap = await getDocs(q)
  await Promise.all(snap.docs.map((d) => updateDoc(d.ref, { read: true })))
}

// ── Semantic helpers ──────────────────────────────────────────────────────────
// Each helper sends an in-app notification AND triggers an email/SMS via emailService.

import {
  sendReservationReceived,
  sendReservationConfirmed,
  sendReservationCancelled,
  sendOrderPlaced    as emailOrderPlaced,
  sendOrderPreparing as emailOrderPreparing,
  sendOrderReady     as emailOrderReady,
  sendOrderServed    as emailOrderServed,
} from './emailService'

/**
 * @param {string} uid   - Firestore user UID
 * @param {string} email - User's email address for email dispatch
 * @param {string} date
 * @param {string} time
 */
export const notifyReservationReceived = (uid, email, date, time, guests, tableId) => {
  if (email) sendReservationReceived(email, { date, time, guests, tableId })
  return createNotification({
    uid,
    type: NOTIF_TYPE.RESERVATION_RECEIVED,
    title: 'Reservation Received',
    message: `Your table request for ${date} at ${time} is pending staff confirmation.`,
  })
}

export const notifyReservationConfirmed = (uid, email, date, time, tableId, zone, guests) => {
  if (email) sendReservationConfirmed(email, { date, time, guests: guests ?? 1, tableId, zone: zone ?? '' })
  return createNotification({
    uid,
    type: NOTIF_TYPE.RESERVATION_CONFIRMED,
    title: 'Reservation Confirmed!',
    message: `Great news! Your reservation on ${date} at ${time} has been confirmed (Table ${tableId || 'TBD'}).`,
  })
}

export const notifyReservationCancelled = (uid, email, date, time) => {
  if (email) sendReservationCancelled(email, { date, time })
  return createNotification({
    uid,
    type: NOTIF_TYPE.RESERVATION_CANCELLED,
    title: 'Reservation Cancelled',
    message: `Your reservation on ${date} at ${time} has been cancelled.`,
  })
}

export const notifyOrderPlaced = (uid, email, tableId, total) => {
  if (email) emailOrderPlaced(email, { tableId, total })
  return createNotification({
    uid,
    type: NOTIF_TYPE.ORDER_PLACED,
    title: 'Order Placed!',
    message: `Your order for Table ${tableId} ($${Number(total).toFixed(2)}) has been sent to the kitchen.`,
  })
}

export const notifyOrderPreparing = (uid, email, tableId) => {
  if (email) emailOrderPreparing(email, { tableId })
  return createNotification({
    uid,
    type: NOTIF_TYPE.ORDER_PREPARING,
    title: 'Kitchen is Preparing Your Order',
    message: `The kitchen has started preparing your order for Table ${tableId}. Sit tight!`,
  })
}

export const notifyOrderReady = (uid, email, tableId) => {
  if (email) emailOrderReady(email, { tableId })
  return createNotification({
    uid,
    type: NOTIF_TYPE.ORDER_READY,
    title: 'Your Order is Ready!',
    message: `Your order for Table ${tableId} is ready to be served. A staff member will bring it shortly.`,
  })
}

export const notifyOrderServed = (uid, email, tableId) => {
  if (email) emailOrderServed(email, { tableId })
  return createNotification({
    uid,
    type: NOTIF_TYPE.ORDER_SERVED,
    title: 'Enjoy Your Meal!',
    message: `Your order at Table ${tableId} has been served. Bon appétit!`,
  })
}
