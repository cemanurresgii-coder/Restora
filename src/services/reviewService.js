/**
 * Review Service
 * Manages customer reviews for menu items in the Firestore `reviews` collection.
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'

const COL = 'reviews'

/**
 * Fetch all reviews for a specific menu item.
 * @param {string} itemId
 * @returns {Promise<Array>}
 */
export const getItemReviews = async (itemId) => {
  // Only filter by itemId — sort client-side to avoid requiring a composite index.
  const q = query(collection(db, COL), where('itemId', '==', itemId))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const aMs = a.createdAt?.toMillis?.() ?? 0
      const bMs = b.createdAt?.toMillis?.() ?? 0
      return bMs - aMs   // newest first
    })
}

/**
 * Get all reviews (for aggregating ratings).
 * Returns a map: { [itemId]: { avgRating, count } }
 */
export const getAllReviewStats = async () => {
  const snap = await getDocs(collection(db, COL))
  const map = {}
  snap.docs.forEach((d) => {
    const { itemId, rating } = d.data()
    if (!map[itemId]) map[itemId] = { total: 0, count: 0 }
    map[itemId].total += rating
    map[itemId].count += 1
  })
  const stats = {}
  for (const [id, { total, count }] of Object.entries(map)) {
    stats[id] = { avgRating: Math.round((total / count) * 10) / 10, count }
  }
  return stats
}

/**
 * Submit a review for a menu item.
 * @param {{ itemId, uid, userName, rating, comment }}
 * @returns {Promise<string>} New doc ID
 */
export const submitReview = async ({ itemId, uid, userName, rating, comment }) => {
  const docRef = await addDoc(collection(db, COL), {
    itemId,
    uid,
    userName,
    rating,
    comment: comment.trim(),
    createdAt: Timestamp.now(),
  })
  return docRef.id
}

/**
 * Check if a user has already reviewed a specific item.
 * @param {string} uid
 * @param {string} itemId
 * @returns {Promise<boolean>}
 */
export const hasUserReviewed = async (uid, itemId) => {
  const q = query(
    collection(db, COL),
    where('uid', '==', uid),
    where('itemId', '==', itemId)
  )
  const snap = await getDocs(q)
  return !snap.empty
}
