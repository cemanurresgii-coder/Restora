import { create } from 'zustand'
import {
  getReservations,
  createReservation,
  updateReservationStatus,
  RESERVATION_STATUS,
} from '../services/reservationService'

// All tables in the restaurant
export const TABLES = [
  { id: 'T1', zone: 'Indoor',  capacity: 2  },
  { id: 'T2', zone: 'Indoor',  capacity: 4  },
  { id: 'T3', zone: 'Indoor',  capacity: 6  },
  { id: 'T4', zone: 'Window',  capacity: 2  },
  { id: 'T5', zone: 'Window',  capacity: 4  },
  { id: 'T6', zone: 'Outdoor', capacity: 4  },
  { id: 'T7', zone: 'Outdoor', capacity: 8  },
  { id: 'T8', zone: 'Outdoor', capacity: 10 },
]

const useReservationStore = create((set, get) => ({
  reservations: [],
  loading: false,
  error: null,

  fetchReservations: async () => {
    set({ loading: true, error: null })
    try {
      const reservations = await getReservations()
      set({ reservations, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  createReservation: async (data) => {
    const id = await createReservation(data)
    const newRes = { id, ...data, status: RESERVATION_STATUS.PENDING }
    set((s) => ({ reservations: [newRes, ...s.reservations] }))
    return id
  },

  updateStatus: async (id, status) => {
    await updateReservationStatus(id, status)
    set((s) => ({
      reservations: s.reservations.map((r) =>
        r.id === id ? { ...r, status } : r
      ),
    }))
  },

  // Real-time availability: returns tables free for given date+time+guestCount
  getAvailableTables: (date, time, guests) => {
    const { reservations } = get()
    const occupiedIds = new Set(
      reservations
        .filter(
          (r) =>
            r.date === date &&
            r.time === time &&
            r.status !== RESERVATION_STATUS.CANCELLED
        )
        .map((r) => r.tableId)
    )
    return TABLES.filter(
      (t) => t.capacity >= guests && !occupiedIds.has(t.id)
    )
  },

  /**
   * Auto-assign the best available table for the given slot.
   *
   * Algorithm (in priority order):
   *  1. Must be available (not occupied) for date + time
   *  2. Must fit guests (capacity >= guests)
   *  3. Prefer the smallest table that still fits (minimise wasted seats)
   *  4. Break ties by preferring the specified zone, then Indoor > Window > Outdoor
   */
  autoAssignTable: (date, time, guests, preferredZone = null) => {
    const { reservations } = get()
    const occupiedIds = new Set(
      reservations
        .filter(
          (r) =>
            r.date === date &&
            r.time === time &&
            r.status !== RESERVATION_STATUS.CANCELLED
        )
        .map((r) => r.tableId)
    )

    const ZONE_RANK = { Indoor: 0, Window: 1, Outdoor: 2 }

    const available = TABLES
      .filter((t) => t.capacity >= guests && !occupiedIds.has(t.id))
      .sort((a, b) => {
        // Primary: smallest capacity that fits (tight fit)
        const capDiff = a.capacity - b.capacity
        if (capDiff !== 0) return capDiff

        // Secondary: preferred zone first
        if (preferredZone) {
          const aMatch = a.zone === preferredZone ? 0 : 1
          const bMatch = b.zone === preferredZone ? 0 : 1
          if (aMatch !== bMatch) return aMatch - bMatch
        }

        // Tertiary: zone rank
        return (ZONE_RANK[a.zone] ?? 9) - (ZONE_RANK[b.zone] ?? 9)
      })

    return available[0] ?? null
  },

  // Is a specific table occupied right now (pending or confirmed)?
  isTableOccupied: (tableId) => {
    const { reservations } = get()
    return reservations.some(
      (r) =>
        r.tableId === tableId &&
        [RESERVATION_STATUS.PENDING, RESERVATION_STATUS.CONFIRMED].includes(r.status)
    )
  },
}))

export default useReservationStore
