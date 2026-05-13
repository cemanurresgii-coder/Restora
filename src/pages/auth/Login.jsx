import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { UtensilsCrossed, Mail, Lock, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'
import useAuthStore, { ROLES } from '../../store/useAuthStore'

// ── Forgot-password mini-form ──────────────────────────────────────────────────

function ForgotPassword({ onBack }) {
  const { resetPassword, loading, error, clearError } = useAuthStore()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    const ok = await resetPassword(email.trim())
    if (ok) setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <CheckCircle2 size={44} className="text-emerald-500 mx-auto" />
        <p className="text-sm text-neutral-600">
          Password reset e-mail sent to <strong>{email}</strong>.<br />
          Check your inbox and follow the link.
        </p>
        <button
          onClick={onBack}
          className="text-sm text-brand-600 hover:underline flex items-center gap-1 mx-auto"
        >
          <ArrowLeft size={14} /> Back to Sign In
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-neutral-900">Forgot Password</h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          Enter your e-mail and we'll send a reset link.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => { clearError(); setEmail(e.target.value) }}
            required
            placeholder="you@example.com"
            className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-lg text-sm
              focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
              placeholder-neutral-400 transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600
            text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : null}
          {loading ? 'Sending…' : 'Send Reset Link'}
        </button>
      </form>

      <button
        onClick={onBack}
        className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
      >
        <ArrowLeft size={14} /> Back to Sign In
      </button>
    </div>
  )
}

// ── Main Login ────────────────────────────────────────────────────────────────

export default function Login() {
  const { login, loading, error, clearError } = useAuthStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showForgot, setShowForgot] = useState(false)

  const handleChange = (e) => {
    clearError()
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await login(form.email, form.password)
    const role = useAuthStore.getState().role
    if (role === ROLES.MANAGER) navigate('/manager')
    else if (role === ROLES.STAFF) navigate('/staff')
    else if (role === ROLES.CUSTOMER) navigate('/app')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-orange-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center mb-5">
            <div className="absolute w-24 h-24 rounded-full bg-brand-400 opacity-20 blur-xl" />
            <div className="absolute w-20 h-20 rounded-full bg-orange-300 opacity-20 blur-lg" />
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg"
              style={{ background: 'linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea580c 100%)' }}>
              <UtensilsCrossed size={30} className="text-white drop-shadow" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight"
            style={{ background: 'linear-gradient(135deg, #ea580c, #f97316, #fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Restora
          </h1>
          <p className="text-neutral-500 mt-1.5 text-sm font-medium tracking-wide uppercase">
            {showForgot ? 'Account Recovery' : 'Sign in to your account'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {showForgot ? (
            <ForgotPassword onBack={() => { setShowForgot(false); clearError() }} />
          ) : (
            <>
              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 mb-6">
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      autoComplete="new-password"
                      placeholder="you@example.com"
                      className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-lg text-sm
                        focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
                        placeholder-neutral-400 transition"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-neutral-700">Password</label>
                    <button
                      type="button"
                      onClick={() => { setShowForgot(true); clearError() }}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      autoComplete="off"
                      data-form-type="other"
                      data-lpignore="true"
                      placeholder="••••••••"
                      className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-lg text-sm
                        focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
                        placeholder-neutral-400 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600
                    text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>

              <p className="text-center text-sm text-neutral-500 mt-6">
                Hesabın yok mu?{' '}
                <Link to="/register" className="text-brand-600 font-medium hover:underline">
                  Kayıt ol
                </Link>
              </p>
            </>
          )}
        </div>

        <p className="text-center text-xs text-neutral-400 mt-6">
          Digital Restaurant & Booking System
        </p>
      </div>
    </div>
  )
}
