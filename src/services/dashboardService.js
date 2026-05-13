import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'

export const getDashboardStats = async () => {
  const thisMonth = new Date().toISOString().slice(0, 7) // "YYYY-MM"

  const [reservationsSnap, menuSnap] = await Promise.all([
    getDocs(collection(db, 'reservations')),
    getDocs(collection(db, 'menuItems')),
  ])

  const all = reservationsSnap.docs.map((d) => d.data())
  const thisMonthRes = all.filter((r) => (r.date ?? '').startsWith(thisMonth))

  return {
    totalReservations:    all.length,
    thisMonthReservations: thisMonthRes.length,
    confirmed:  all.filter((r) => r.status === 'confirmed').length,
    pending:    all.filter((r) => r.status === 'pending').length,
    cancelled:  all.filter((r) => r.status === 'cancelled').length,
    totalMenuItems: menuSnap.size,
  }
}
