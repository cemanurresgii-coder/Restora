/**
 * Unit tests for the core reservation business logic.
 *
 * These tests exercise pure functions that mirror the implementations in
 * `useReservationStore.js` — specifically `getAvailableTables` and
 * `isTableOccupied`. By keeping the logic pure (no Zustand, no Firebase),
 * the tests remain fast, deterministic, and dependency-free.
 */

import { describe, it, expect } from 'vitest'

// ── Fixtures — mirrors src/store/useReservationStore.js ───────────────────────

const TABLES = [
  { id: 'T1', zone: 'Indoor',  capacity: 2  },
  { id: 'T2', zone: 'Indoor',  capacity: 4  },
  { id: 'T3', zone: 'Indoor',  capacity: 6  },
  { id: 'T4', zone: 'Window',  capacity: 2  },
  { id: 'T5', zone: 'Window',  capacity: 4  },
  { id: 'T6', zone: 'Outdoor', capacity: 4  },
  { id: 'T7', zone: 'Outdoor', capacity: 8  },
  { id: 'T8', zone: 'Outdoor', capacity: 10 },
]

const STATUS = {
  PENDING:   'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
}

// ── Pure logic helpers — exact mirrors of the store implementations ───────────

/**
 * Returns tables that satisfy two conditions simultaneously:
 *   1. capacity >= guests
 *   2. not already booked (non-cancelled) at the given date + time
 *
 * Source: useReservationStore.getAvailableTables()
 */
function getAvailableTables(reservations, date, time, guests) {
  const occupiedIds = new Set(
    reservations
      .filter((r) => r.date === date && r.time === time && r.status !== STATUS.CANCELLED)
      .map((r) => r.tableId)
  )
  return TABLES.filter((t) => t.capacity >= guests && !occupiedIds.has(t.id))
}

/**
 * Returns true when the table has at least one active (pending or confirmed)
 * reservation, regardless of date/time.
 *
 * Source: useReservationStore.isTableOccupied()
 */
function isTableOccupied(reservations, tableId) {
  return reservations.some(
    (r) => r.tableId === tableId && [STATUS.PENDING, STATUS.CONFIRMED].includes(r.status)
  )
}

// ── Test data helpers ─────────────────────────────────────────────────────────

const makeReservation = (overrides) => ({
  id:      'res-1',
  tableId: 'T1',
  date:    '2026-06-15',
  time:    '19:00',
  guests:  2,
  status:  STATUS.CONFIRMED,
  ...overrides,
})

// ── getAvailableTables ────────────────────────────────────────────────────────

describe('getAvailableTables', () => {
  it('returns all tables when there are no reservations', () => {
    const result = getAvailableTables([], '2026-06-15', '19:00', 1)
    expect(result).toHaveLength(TABLES.length)
  })

  it('excludes a table that is booked for the exact same date and time', () => {
    const reservations = [makeReservation({ tableId: 'T2', status: STATUS.CONFIRMED })]
    const result = getAvailableTables(reservations, '2026-06-15', '19:00', 2)
    const ids = result.map((t) => t.id)
    expect(ids).not.toContain('T2')
  })

  it('includes a table whose booking is on a different date', () => {
    const reservations = [makeReservation({ tableId: 'T2', date: '2026-06-20' })]
    const result = getAvailableTables(reservations, '2026-06-15', '19:00', 2)
    const ids = result.map((t) => t.id)
    expect(ids).toContain('T2')
  })

  it('includes a table whose booking is at a different time on the same date', () => {
    const reservations = [makeReservation({ tableId: 'T2', time: '20:00' })]
    const result = getAvailableTables(reservations, '2026-06-15', '19:00', 2)
    const ids = result.map((t) => t.id)
    expect(ids).toContain('T2')
  })

  it('treats a cancelled booking as available — does NOT block the table', () => {
    const reservations = [makeReservation({ tableId: 'T3', status: STATUS.CANCELLED })]
    const result = getAvailableTables(reservations, '2026-06-15', '19:00', 2)
    const ids = result.map((t) => t.id)
    expect(ids).toContain('T3')
  })

  it('treats a pending booking the same as confirmed — blocks the table', () => {
    const reservations = [makeReservation({ tableId: 'T5', status: STATUS.PENDING })]
    const result = getAvailableTables(reservations, '2026-06-15', '19:00', 2)
    const ids = result.map((t) => t.id)
    expect(ids).not.toContain('T5')
  })

  it('excludes tables whose capacity is less than the requested guest count', () => {
    // T1 (cap 2) and T4 (cap 2) should be excluded when party size is 3
    const result = getAvailableTables([], '2026-06-15', '19:00', 3)
    const ids = result.map((t) => t.id)
    expect(ids).not.toContain('T1')
    expect(ids).not.toContain('T4')
  })

  it('includes a table whose capacity exactly equals the guest count', () => {
    // T1 has capacity 2; a party of 2 should be allowed
    const result = getAvailableTables([], '2026-06-15', '19:00', 2)
    const ids = result.map((t) => t.id)
    expect(ids).toContain('T1')
  })

  it('applies capacity and availability filters together', () => {
    // T2 (cap 4) is booked; T1 (cap 2) lacks capacity; T3 (cap 6) should be free
    const reservations = [makeReservation({ tableId: 'T2' })]
    const result = getAvailableTables(reservations, '2026-06-15', '19:00', 3)
    const ids = result.map((t) => t.id)
    expect(ids).not.toContain('T1') // too small
    expect(ids).not.toContain('T2') // booked
    expect(ids).toContain('T3')     // available and large enough
  })

  it('returns empty array when every qualifying table is booked', () => {
    // Book all tables with capacity >= 2 for the slot
    const reservations = TABLES.map((t, i) =>
      makeReservation({ id: `res-${i}`, tableId: t.id })
    )
    const result = getAvailableTables(reservations, '2026-06-15', '19:00', 1)
    expect(result).toHaveLength(0)
  })

  it('handles multiple bookings at the same slot correctly', () => {
    const reservations = [
      makeReservation({ id: 'r1', tableId: 'T1' }),
      makeReservation({ id: 'r2', tableId: 'T2' }),
      makeReservation({ id: 'r3', tableId: 'T3' }),
    ]
    const result = getAvailableTables(reservations, '2026-06-15', '19:00', 1)
    const ids = result.map((t) => t.id)
    expect(ids).not.toContain('T1')
    expect(ids).not.toContain('T2')
    expect(ids).not.toContain('T3')
    expect(ids).toContain('T4') // still free
  })

  it('returns tables in the original TABLES order', () => {
    const result = getAvailableTables([], '2026-06-15', '19:00', 1)
    const ids = result.map((t) => t.id)
    // T1 should appear before T8
    expect(ids.indexOf('T1')).toBeLessThan(ids.indexOf('T8'))
  })
})

// ── isTableOccupied ───────────────────────────────────────────────────────────

describe('isTableOccupied', () => {
  it('returns false when there are no reservations at all', () => {
    expect(isTableOccupied([], 'T1')).toBe(false)
  })

  it('returns true for a table with a CONFIRMED reservation', () => {
    const reservations = [makeReservation({ tableId: 'T1', status: STATUS.CONFIRMED })]
    expect(isTableOccupied(reservations, 'T1')).toBe(true)
  })

  it('returns true for a table with a PENDING reservation', () => {
    const reservations = [makeReservation({ tableId: 'T1', status: STATUS.PENDING })]
    expect(isTableOccupied(reservations, 'T1')).toBe(true)
  })

  it('returns false for a table with only a CANCELLED reservation', () => {
    const reservations = [makeReservation({ tableId: 'T1', status: STATUS.CANCELLED })]
    expect(isTableOccupied(reservations, 'T1')).toBe(false)
  })

  it('returns false for a table with only a COMPLETED reservation', () => {
    const reservations = [makeReservation({ tableId: 'T1', status: STATUS.COMPLETED })]
    expect(isTableOccupied(reservations, 'T1')).toBe(false)
  })

  it('returns false when checking a different table ID', () => {
    const reservations = [makeReservation({ tableId: 'T2', status: STATUS.CONFIRMED })]
    expect(isTableOccupied(reservations, 'T1')).toBe(false)
  })

  it('returns true even if the active reservation is mixed with cancelled ones', () => {
    const reservations = [
      makeReservation({ id: 'r1', tableId: 'T1', status: STATUS.CANCELLED }),
      makeReservation({ id: 'r2', tableId: 'T1', status: STATUS.CONFIRMED }),
    ]
    expect(isTableOccupied(reservations, 'T1')).toBe(true)
  })
})
