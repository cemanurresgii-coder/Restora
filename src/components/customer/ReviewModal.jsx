/**
 * ReviewModal
 * Allows a customer to read existing reviews and submit a new one for a menu item.
 */

import { useEffect, useState } from 'react'
import { Star, X, Send, Loader2, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 5
import toast from 'react-hot-toast'
import { getItemReviews, submitReview, hasUserReviewed } from '../../services/reviewService'
import useAuthStore from '../../store/useAuthStore'

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={24}
            fill={(hovered || value) >= star ? '#f59e0b' : 'none'}
            className={(hovered || value) >= star ? 'text-amber-400' : 'text-neutral-300'}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="text-sm font-semibold text-neutral-600 ml-1">
          {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][value]}
        </span>
      )}
    </div>
  )
}

function ReviewCard({ review }) {
  const date = review.createdAt?.toDate?.()?.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  }) ?? ''
  return (
    <div className="bg-neutral-50 rounded-xl p-3 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center uppercase">
            {review.userName?.[0] ?? '?'}
          </div>
          <span className="text-sm font-medium text-neutral-800">{review.userName}</span>
        </div>
        <div className="flex items-center gap-0.5">
          {[1,2,3,4,5].map((s) => (
            <Star
              key={s}
              size={11}
              fill={review.rating >= s ? '#f59e0b' : 'none'}
              className={review.rating >= s ? 'text-amber-400' : 'text-neutral-300'}
            />
          ))}
        </div>
      </div>
      {review.comment && (
        <p className="text-xs text-neutral-600 leading-relaxed pl-9">{review.comment}</p>
      )}
      {date && <p className="text-[10px] text-neutral-400 pl-9">{date}</p>}
    </div>
  )
}

export default function ReviewModal({ item, onClose }) {
  const { user } = useAuthStore()
  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const load = async () => {
      setLoadingReviews(true)
      try {
        const [data, already] = await Promise.all([
          getItemReviews(item.id),
          user?.uid ? hasUserReviewed(user.uid, item.id) : Promise.resolve(false),
        ])
        setReviews(data)
        setAlreadyReviewed(already)
      } catch {
        // ignore
      } finally {
        setLoadingReviews(false)
      }
    }
    load()
  }, [item.id, user?.uid])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating === 0) { toast.error('Please select a star rating.'); return }
    setSubmitting(true)
    try {
      await submitReview({
        itemId:   item.id,
        uid:      user?.uid ?? '',
        userName: user?.email?.split('@')[0] ?? 'Guest',
        rating,
        comment,
      })
      // Mark as reviewed and reset form immediately after write succeeds
      setAlreadyReviewed(true)
      setRating(0)
      setComment('')
      toast.success('Review submitted! Thank you.')
    } catch {
      toast.error('Failed to submit review. Please try again.')
      return
    } finally {
      setSubmitting(false)
    }

    // Reload reviews list separately — failure here is non-fatal (no error toast)
    try {
      const data = await getItemReviews(item.id)
      setReviews(data)
      setPage(1)
    } catch {
      // silently ignore — review was already saved
    }
  }

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const totalPages   = Math.max(1, Math.ceil(reviews.length / PAGE_SIZE))
  const pagedReviews = reviews.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-neutral-100 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{item.emoji}</span>
            <div>
              <h2 className="font-bold text-neutral-900">{item.name}</h2>
              {avgRating && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Star size={12} fill="#f59e0b" className="text-amber-400" />
                  <span className="text-sm font-semibold text-neutral-700">{avgRating}</span>
                  <span className="text-xs text-neutral-400">({reviews.length} reviews)</span>
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 mt-0.5">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Write a review */}
          {user ? (
            alreadyReviewed ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
                You've already reviewed this item. Thank you for your feedback!
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <h3 className="text-sm font-semibold text-neutral-800">Write a Review</h3>
                <StarPicker value={rating} onChange={setRating} />
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts about this dish…"
                  rows={3}
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
                />
                <button
                  type="submit"
                  disabled={submitting || rating === 0}
                  className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {submitting ? 'Submitting…' : 'Submit Review'}
                </button>
              </form>
            )
          ) : (
            <p className="text-sm text-neutral-400">Log in to write a review.</p>
          )}

          {/* Divider */}
          <div className="border-t border-neutral-100" />

          {/* Existing reviews */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <MessageSquare size={14} className="text-neutral-400" />
              Customer Reviews ({reviews.length})
            </h3>

            {loadingReviews ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand-400 border-t-transparent" />
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-sm text-neutral-400 py-4 text-center">
                No reviews yet. Be the first!
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  {pagedReviews.map((r) => <ReviewCard key={r.id} review={r} />)}
                </div>

                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-brand-600 disabled:opacity-30 transition"
                    >
                      <ChevronLeft size={13} /> Prev
                    </button>
                    <span className="text-xs text-neutral-400">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-brand-600 disabled:opacity-30 transition"
                    >
                      Next <ChevronRight size={13} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
