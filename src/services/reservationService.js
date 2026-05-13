import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'

const COL = 'reservations'

export const RESERVATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
}

export const getReservations = async () => {
  const snap = await getDocs(query(collection(db, COL), orderBy('date', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const createReservation = async ({ uid, name, email, date, time, guests, tableId, zone, notes }) => {
  const docRef = await addDoc(collection(db, COL), {
    uid: uid || '',
    name,
    email,
    date,
    time,
    guests,
    tableId: tableId || '',
    zone: zone || '',
    notes: notes || '',
    status: RESERVATION_STATUS.PENDING,
    createdAt: Timestamp.now(),
  })
  return docRef.id
}

/**
 * Returns tableIds already booked for a given date+time slot.
 * Falls back gracefully if Firebase is not configured.
 */
export const checkTableAvailability = async (date, time) => {
  try {
    const snap = await getDocs(
      query(collection(db, COL), orderBy('date', 'desc'))
    )
    const all = snap.docs.map((d) => d.data())
    return all
      .filter((r) => r.date === date && r.time === time && r.status !== 'cancelled')
      .map((r) => r.tableId)
  } catch {
    return []
  }
}

export const updateReservationStatus = async (id, status) => {
  await updateDoc(doc(db, COL, id), { status })
}

// Real-time listener — all reservations belonging to a specific user (sorted client-side)
export const subscribeUserReservations = (uid, callback) => {
  const q = query(collection(db, COL), where('uid', '==', uid))
  return onSnapshot(q, (snap) => {
    const data = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
    callback(data)
  })
}

// Real-time listener — only pending reservations (sorted client-side)
export const subscribePendingReservations = (callback) => {
  const q = query(collection(db, COL), where('status', '==', RESERVATION_STATUS.PENDING))
  return onSnapshot(q, (snap) => {
    const data = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    callback(data)
  })
}
