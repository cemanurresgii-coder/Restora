/**
 * ItemCustomizationModal
 * Shown when a customer adds an item to their cart, allowing them to
 * specify quantity and a customization note (e.g. "no onions").
 */

import { useState } from 'react'
import { Minus, Plus, X, ShoppingCart } from 'lucide-react'

const QUICK_OPTIONS = [
  'Extra spicy', 'Mild (no spice)', 'No onions', 'No garlic',
  'Extra cheese', 'No cheese', 'Gluten-free bread', 'Sauce on the side',
  'No cilantro', 'Well done', 'Extra sauce',
]

export default function ItemCustomizationModal({ item, onConfirm, onClose }) {
  const [qty, setQty]             = useState(1)
  const [customization, setCustom] = useState('')

  const toggleQuick = (opt) => {
    setCustom((prev) => {
      const tags = prev ? prev.split(', ').map((s) => s.trim()).filter(Boolean) : []
      if (tags.includes(opt)) return tags.filter((t) => t !== opt).join(', ')
      return [...tags, opt].join(', ')
    })
  }

  const activeTags = customization ? customization.split(',').map((s) => s.trim()).filter(Boolean) : []

  const handleAdd = () => {
    onConfirm({ ...item, qty, customization: customization.trim() })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{item.emoji}</span>
            <div>
              <h2 className="font-bold text-neutral-900 text-sm leading-tight">{item.name}</h2>
              <p className="text-xs text-brand-600 font-semibold mt-0.5">${Number(item.price).toFixed(2)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Quantity */}
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2 block">Quantity</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition"
              >
                <Minus size={14} />
              </button>
              <span className="text-lg font-bold text-neutral-900 w-6 text-center">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(20, q + 1))}
                className="w-9 h-9 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 transition"
              >
                <Plus size={14} />
              </button>
              <span className="text-sm text-neutral-400">
                = <span className="font-semibold text-neutral-700">${(item.price * qty).toFixed(2)}</span>
              </span>
            </div>
          </div>

          {/* Quick options */}
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2 block">
              Quick Options
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleQuick(opt)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition font-medium ${
                    activeTags.includes(opt)
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:border-brand-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Custom note */}
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2 block">
              Special Instructions
            </label>
            <textarea
              value={customization}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Any special requests for this item?"
              rows={2}
              className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={handleAdd}
            className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 rounded-xl transition"
          >
            <ShoppingCart size={16} />
            Add {qty > 1 ? `${qty}× ` : ''}to Order — ${(item.price * qty).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  )
}
