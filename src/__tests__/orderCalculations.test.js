/**
 * Unit tests for order-related business logic.
 *
 * Covers cart total calculation, item-count aggregation, the cart-to-Firestore
 * item mapping, and the active-order filter that drives the kitchen queue.
 *
 * All functions are pure and extracted from their respective source files so
 * that tests run without any Zustand, Firebase, or React dependencies.
 */

import { describe, it, expect } from 'vitest'

// ── Status constants — mirrors src/store/useOrderStore.js ─────────────────────

const ORDER_STATUS = {
  PENDING:   'pending',
  PREPARING: 'preparing',
  READY:     'ready',
  SERVED:    'served',
  CANCELLED: 'cancelled',
}

/** Statuses that keep an order visible in the kitchen queue. */
const ACTIVE_STATUSES = [ORDER_STATUS.PENDING, ORDER_STATUS.PREPARING, ORDER_STATUS.READY]

// ── Pure logic helpers ────────────────────────────────────────────────────────

/**
 * Calculates the grand total for a cart.
 * Source: CartDrawer in MenuContent.jsx — `cart.reduce((s, i) => s + i.price * i.qty, 0)`
 */
function calculateCartTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0)
}

/**
 * Counts the total number of individual units across all cart lines.
 * Source: MenuContent.jsx — `cart.reduce((sum, i) => sum + i.qty, 0)`
 */
function calculateItemCount(items) {
  return items.reduce((sum, item) => sum + item.qty, 0)
}

/**
 * Converts a customer cart array into the shape stored in Firestore's
 * `orders` collection under the `items` sub-array.
 * Source: MenuContent.handlePlaceOrder()
 */
function formatOrderItems(cartItems) {
  return cartItems.map((i) => ({
    id:            i.id,
    name:          i.name,
    price:         i.price,
    qty:           i.qty,
    customization: i.customization ?? '',
  }))
}

/**
 * Filters an order list down to those still in the active kitchen queue.
 * Source: subscribeActiveOrders() in orderService.js — `where('status', 'in', [...])`
 */
function filterActiveOrders(orders) {
  return orders.filter((o) => ACTIVE_STATUSES.includes(o.status))
}

// ── Test data helpers ─────────────────────────────────────────────────────────

const makeCartItem = (overrides) => ({
  id:    'item-1',
  name:  'Bruschetta',
  price: 8.5,
  qty:   1,
  emoji: '🍅',
  ...overrides,
})

const makeOrder = (overrides) => ({
  id:      'order-1',
  tableId: 'T3',
  total:   16.0,
  status:  ORDER_STATUS.PENDING,
  ...overrides,
})

// ── calculateCartTotal ────────────────────────────────────────────────────────

describe('calculateCartTotal', () => {
  it('returns 0 for an empty cart', () => {
    expect(calculateCartTotal([])).toBe(0)
  })

  it('returns the item price when qty is 1', () => {
    const cart = [makeCartItem({ price: 8.5, qty: 1 })]
    expect(calculateCartTotal(cart)).toBe(8.5)
  })

  it('multiplies price by qty for a single line item', () => {
    const cart = [makeCartItem({ price: 8.5, qty: 3 })]
    expect(calculateCartTotal(cart)).toBe(25.5)
  })

  it('sums totals across multiple distinct items', () => {
    const cart = [
      makeCartItem({ id: '1', price: 8.5,  qty: 2 }), // 17.00
      makeCartItem({ id: '2', price: 16.0, qty: 1 }), // 16.00
      makeCartItem({ id: '3', price: 7.0,  qty: 3 }), // 21.00
    ]
    expect(calculateCartTotal(cart)).toBe(54)
  })

  it('handles floating-point prices without silent rounding errors', () => {
    // 4.5 × 2 = 9.0 — straightforward multiplication
    const cart = [makeCartItem({ price: 4.5, qty: 2 })]
    expect(calculateCartTotal(cart)).toBeCloseTo(9.0, 5)
  })

  it('returns 0 when all items have qty 0', () => {
    const cart = [makeCartItem({ price: 14.5, qty: 0 })]
    expect(calculateCartTotal(cart)).toBe(0)
  })

  it('works correctly with high-price, high-quantity items', () => {
    const cart = [makeCartItem({ price: 100, qty: 10 })]
    expect(calculateCartTotal(cart)).toBe(1000)
  })
})

// ── calculateItemCount ────────────────────────────────────────────────────────

describe('calculateItemCount', () => {
  it('returns 0 for an empty cart', () => {
    expect(calculateItemCount([])).toBe(0)
  })

  it('returns qty for a single-line cart', () => {
    const cart = [makeCartItem({ qty: 3 })]
    expect(calculateItemCount(cart)).toBe(3)
  })

  it('sums quantities across multiple cart lines', () => {
    const cart = [
      makeCartItem({ id: '1', qty: 2 }),
      makeCartItem({ id: '2', qty: 5 }),
      makeCartItem({ id: '3', qty: 1 }),
    ]
    expect(calculateItemCount(cart)).toBe(8)
  })

  it('correctly counts a cart where every item has qty 1', () => {
    const cart = [
      makeCartItem({ id: '1', qty: 1 }),
      makeCartItem({ id: '2', qty: 1 }),
    ]
    expect(calculateItemCount(cart)).toBe(2)
  })
})

// ── formatOrderItems ──────────────────────────────────────────────────────────

describe('formatOrderItems', () => {
  it('returns an empty array for an empty cart', () => {
    expect(formatOrderItems([])).toEqual([])
  })

  it('maps cart items to the Firestore order-item shape', () => {
    const cart = [makeCartItem({ id: 'i1', name: 'Bruschetta', price: 8.5, qty: 2 })]
    const result = formatOrderItems(cart)
    expect(result).toEqual([{ id: 'i1', name: 'Bruschetta', price: 8.5, qty: 2, customization: '' }])
  })

  it('preserves a non-empty customization string', () => {
    const cart = [makeCartItem({ customization: 'no garlic' })]
    const result = formatOrderItems(cart)
    expect(result[0].customization).toBe('no garlic')
  })

  it('defaults customization to empty string when the field is absent', () => {
    const item = { id: 'i2', name: 'Risotto', price: 14.5, qty: 1 }
    // no customization property at all
    const result = formatOrderItems([item])
    expect(result[0].customization).toBe('')
  })

  it('strips extra cart-only properties (e.g. emoji, gradient)', () => {
    const cart = [makeCartItem({ emoji: '🍅', gradient: 'from-red-100' })]
    const result = formatOrderItems(cart)
    expect(result[0]).not.toHaveProperty('emoji')
    expect(result[0]).not.toHaveProperty('gradient')
  })

  it('maps multiple items independently', () => {
    const cart = [
      makeCartItem({ id: 'i1', name: 'Bruschetta', qty: 1 }),
      makeCartItem({ id: 'i2', name: 'Risotto',    qty: 2 }),
    ]
    const result = formatOrderItems(cart)
    expect(result).toHaveLength(2)
    expect(result[1].name).toBe('Risotto')
    expect(result[1].qty).toBe(2)
  })
})

// ── filterActiveOrders ────────────────────────────────────────────────────────

describe('filterActiveOrders', () => {
  it('returns an empty array when the order list is empty', () => {
    expect(filterActiveOrders([])).toEqual([])
  })

  it('includes orders with status PENDING', () => {
    const orders = [makeOrder({ status: ORDER_STATUS.PENDING })]
    expect(filterActiveOrders(orders)).toHaveLength(1)
  })

  it('includes orders with status PREPARING', () => {
    const orders = [makeOrder({ status: ORDER_STATUS.PREPARING })]
    expect(filterActiveOrders(orders)).toHaveLength(1)
  })

  it('includes orders with status READY', () => {
    const orders = [makeOrder({ status: ORDER_STATUS.READY })]
    expect(filterActiveOrders(orders)).toHaveLength(1)
  })

  it('excludes orders with status SERVED (exits the kitchen queue)', () => {
    const orders = [makeOrder({ status: ORDER_STATUS.SERVED })]
    expect(filterActiveOrders(orders)).toHaveLength(0)
  })

  it('excludes orders with status CANCELLED', () => {
    const orders = [makeOrder({ status: ORDER_STATUS.CANCELLED })]
    expect(filterActiveOrders(orders)).toHaveLength(0)
  })

  it('handles a mixed list and returns only the active subset', () => {
    const orders = [
      makeOrder({ id: 'o1', status: ORDER_STATUS.PENDING   }),
      makeOrder({ id: 'o2', status: ORDER_STATUS.SERVED    }),
      makeOrder({ id: 'o3', status: ORDER_STATUS.PREPARING }),
      makeOrder({ id: 'o4', status: ORDER_STATUS.CANCELLED }),
      makeOrder({ id: 'o5', status: ORDER_STATUS.READY     }),
    ]
    const result = filterActiveOrders(orders)
    expect(result).toHaveLength(3)
    const ids = result.map((o) => o.id)
    expect(ids).toContain('o1')
    expect(ids).toContain('o3')
    expect(ids).toContain('o5')
    expect(ids).not.toContain('o2')
    expect(ids).not.toContain('o4')
  })

  it('reflects the correct status count after one order is advanced to SERVED', () => {
    const orders = [
      makeOrder({ id: 'o1', status: ORDER_STATUS.READY }),
      makeOrder({ id: 'o2', status: ORDER_STATUS.PENDING }),
    ]
    const before = filterActiveOrders(orders)
    expect(before).toHaveLength(2)

    // Simulate advancing o1 to SERVED
    const updated = orders.map((o) =>
      o.id === 'o1' ? { ...o, status: ORDER_STATUS.SERVED } : o
    )
    const after = filterActiveOrders(updated)
    expect(after).toHaveLength(1)
    expect(after[0].id).toBe('o2')
  })
})
