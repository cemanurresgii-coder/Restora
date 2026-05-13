/**
 * VideoModal
 * Shows a full-screen dish preview with a "Watch on YouTube" button.
 * Opens YouTube search results in a new tab — 100% reliable regardless of region.
 */

import { X, PlayCircle, ExternalLink, Clock, Flame, Dumbbell } from 'lucide-react'
import { useEffect } from 'react'

export default function VideoModal({ item, onClose }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const searchQuery   = encodeURIComponent(`${item.name} recipe how to make`)
  const youtubeUrl    = `https://www.youtube.com/results?search_query=${searchQuery}`
  const youtubeShorts = `https://www.youtube.com/results?search_query=${searchQuery}&sp=EgIQAQ%3D%3D`

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Hero image with play overlay */}
        <div className="relative h-56 bg-neutral-900">
          {item.imageUrl && (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover opacity-80"
            />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition"
          >
            <X size={16} />
          </button>

          {/* Dish name overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-xs font-semibold text-orange-300 uppercase tracking-wide">{item.category}</span>
            </div>
            <h2 className="text-xl font-bold text-white leading-tight">{item.name}</h2>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Description */}
          <p className="text-sm text-neutral-600 leading-relaxed">{item.description}</p>

          {/* Quick stats row */}
          <div className="flex items-center gap-4 flex-wrap">
            {item.calories > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-neutral-500">
                <Flame size={12} className="text-orange-400" />
                {item.calories} kcal
              </span>
            )}
            {item.protein > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-neutral-500">
                <Dumbbell size={12} className="text-blue-400" />
                {item.protein}g protein
              </span>
            )}
            <span className="text-sm font-bold text-brand-600 ml-auto">
              ${Number(item.price).toFixed(2)}
            </span>
          </div>

          {/* CTA buttons */}
          <div className="space-y-2">
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition"
            >
              <PlayCircle size={18} />
              Watch Recipe on YouTube
              <ExternalLink size={13} className="opacity-70" />
            </a>
            <a
              href={youtubeShorts}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full border border-neutral-200 hover:border-red-300 hover:bg-red-50 text-neutral-600 hover:text-red-600 text-sm font-medium py-2.5 rounded-xl transition"
            >
              <Clock size={13} />
              YouTube Shorts — quick clips
            </a>
          </div>

          <p className="text-[10px] text-neutral-400 text-center">
            Opens YouTube in a new tab · search results for "{item.name}"
          </p>
        </div>
      </div>
    </div>
  )
}
