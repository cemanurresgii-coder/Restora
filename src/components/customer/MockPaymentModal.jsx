import { useState } from 'react'
import { CreditCard, Lock, X, ShieldCheck } from 'lucide-react'

// ── Input formatting helpers ──────────────────────────────────────────────────

const fmtCard = (v) => {
  const digits = v.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(.{4})(?=.)/g, '$1 ')
}

const fmtExpiry = (v) => {
  const digits = v.replace(/\D/g, '').slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

// ── Labelled input wrapper ────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-600 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full border border-neutral-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white tabular-nums'

// ── Card brand icon (simple heuristic) ───────────────────────────────────────

function CardBrand({ number }) {
  const first = number.replace(/\s/g, '')[0]
  if (first === '4') return <span className="text-blue-600 font-bold text-xs">VISA</span>
  if (first === '5') return <span className="text-red-600 font-bold text-xs">MC</span>
  if (first === '3') return <span className="text-green-700 font-bold text-xs">AMEX</span>
  return <CreditCard size={16} className="text-neutral-300" />
}

// ── Main modal ────────────────────────────────────────────────────────────────

/**
 * Simulated payment modal.
 *
 * Props:
 *   total     {number}   Amount to display on the Pay button
 *   onSuccess {()=>void} Called after the simulated 1.5 s bank delay
 *   onClose   {()=>void} Called when the user dismisses the modal
 */
export default function MockPaymentModal({ total = 0, onSuccess, onClose }) {
  const [card, setCard]       = useState('')
  const [expiry, setExpiry]   = useState('')
  const [cvc, setCvc]         = useState('')
  const [name, setName]       = useState('')
  const [paying, setPaying]   = useState(false)
  const [paid, setPaid]       = useState(false)

  const isComplete =
    card.replace(/\s/g, '').length === 16 &&
    expiry.length === 5 &&
    cvc.length >= 3 &&
    name.trim().length > 0

  const handlePay = () => {
    if (!isComplete || paying) return
    setPaying(true)
    // Simulate a 1.5 s bank API round-trip
    setTimeout(() => {
      setPaid(true)
      setTimeout(() => {
        onSuccess()
      }, 600) // brief "Approved" flash before closing
    }, 1500)
  }

  return (
    // Overlay — z-[60] sits above CartDrawer (z-50)
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!paying ? onClose : undefined} />

      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
              <Lock size={13} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900">Secure Payment</p>
              <p className="text-[11px] text-neutral-400">Restora Restaurant</p>
            </div>
          </div>
          {!paying && (
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
              <X size={18} />
            </button>
          )}
        </div>

        {/* ── Amount chip ── */}
        <div className="px-5 pt-4">
          <div className="flex items-center justify-between bg-neutral-50 rounded-xl px-4 py-3 border border-neutral-100">
            <span className="text-sm text-neutral-500">Amount due</span>
            <span className="text-xl font-bold text-neutral-900">
              ${Number(total).toFixed(2)}
            </span>
          </div>
        </div>

        {/* ── Form ── */}
        <div className="px-5 pt-4 pb-5 space-y-3">
          {/* Card number */}
          <Field label="Card Number">
            <div className="relative">
              <input
                value={card}
                onChange={(e) => setCard(fmtCard(e.target.value))}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                disabled={paying}
                className={inputCls + ' pr-12'}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <CardBrand number={card} />
              </div>
            </div>
          </Field>

          {/* Expiry + CVC */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Expiry (MM/YY)">
              <input
                value={expiry}
                onChange={(e) => setExpiry(fmtExpiry(e.target.value))}
                placeholder="MM/YY"
                maxLength={5}
                disabled={paying}
                className={inputCls}
              />
            </Field>
            <Field label="CVC">
              <input
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="•••"
                maxLength={3}
                type="password"
                disabled={paying}
                className={inputCls}
              />
            </Field>
          </div>

          {/* Cardholder name */}
          <Field label="Cardholder Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="As it appears on the card"
              disabled={paying}
              className={inputCls}
            />
          </Field>

          {/* Pay button */}
          <button
            onClick={handlePay}
            disabled={!isComplete || paying}
            className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition mt-1
              ${paid
                ? 'bg-emerald-500 text-white'
                : 'bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-40'}`}
          >
            {paid ? (
              <>
                <ShieldCheck size={16} />
                Payment Approved!
              </>
            ) : paying ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Lock size={14} />
                Pay ${Number(total).toFixed(2)} Now
              </>
            )}
          </button>

          {/* Disclaimer */}
          <p className="text-center text-[11px] text-neutral-400 flex items-center justify-center gap-1">
            <Lock size={9} />
            Simulated payment — no real charge will be made.
          </p>
        </div>
      </div>
    </div>
  )
}
