import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { UtensilsCrossed, Mail, Lock, Loader2, AlertCircle } from 'lucide-react'
import useAuthStore from '../../store/useAuthStore'

export default function Register() {
  const { register, loading, error, clearError } = useAuthStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', confirm: '' })
  const [localError, setLocalError] = useState('')

  const handleChange = (e) => {
    clearError()
    setLocalError('')
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setLocalError('Şifreler eşleşmiyor.')
      return
    }
    await register(form.email, form.password)
    const user = useAuthStore.getState().user
    if (user) navigate('/menu')
  }

  const displayError = localError || error

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-orange-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-500 rounded-2xl mb-4 shadow-lg">
            <UtensilsCrossed size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Hesap Oluştur</h1>
          <p className="text-neutral-500 mt-1 text-sm">Restora'ya ücretsiz kaydol</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {displayError && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 mb-6">
              <AlertCircle size={16} className="shrink-0" />
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                E-posta
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="ornek@eposta.com"
                  className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-lg text-sm
                    focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
                    placeholder-neutral-400 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Şifre
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="En az 6 karakter"
                  className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-lg text-sm
                    focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
                    placeholder-neutral-400 transition"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Şifre Tekrar
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="password"
                  name="confirm"
                  value={form.confirm}
                  onChange={handleChange}
                  required
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
              {loading ? 'Kaydediliyor…' : 'Kayıt Ol'}
            </button>
          </form>

          <p className="text-center text-sm text-neutral-500 mt-6">
            Zaten hesabın var mı?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">
              Giriş yap
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-neutral-400 mt-6">
          Digital Restaurant & Booking System
        </p>
      </div>
    </div>
  )
}
