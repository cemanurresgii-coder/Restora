/**
 * DietaryProfile
 * Lets customers save their dietary preferences to their Firestore profile.
 * These are loaded back in MenuContent to auto-apply filters.
 */

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Leaf, WheatOff, AlertCircle, Milk, Flame, Save, User, ShieldCheck } from 'lucide-react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import useAuthStore from '../../store/useAuthStore'

const DIETARY_OPTIONS = [
  { key: 'vegan',      label: 'Vegan',       desc: 'Plant-based — no meat, dairy, or eggs', icon: Leaf,        color: 'emerald' },
  { key: 'glutenFree', label: 'Gluten-Free', desc: 'No wheat, barley, rye or spelt',        icon: WheatOff,    color: 'amber'   },
  { key: 'nutFree',    label: 'Nut-Free',    desc: 'No tree nuts or peanuts',                icon: AlertCircle, color: 'blue'    },
  { key: 'dairyFree',  label: 'Dairy-Free',  desc: 'No milk, cheese, butter or cream',       icon: Milk,        color: 'purple'  },
  { key: 'spicy',      label: 'Spicy Only',  desc: 'Show only spicy dishes',                 icon: Flame,       color: 'red'     },
]

const ALLERGY_TAGS = [
  'Shellfish', 'Eggs', 'Sesame', 'Soy', 'Celery', 'Mustard', 'Lupin', 'Molluscs', 'Sulphites',
]

const COLOR_MAP = {
  emerald: 'border-emerald-300 bg-emerald-50 text-emerald-700 ring-emerald-300',
  amber:   'border-amber-300   bg-amber-50   text-amber-700   ring-amber-300',
  blue:    'border-blue-300    bg-blue-50    text-blue-700    ring-blue-300',
  purple:  'border-purple-300  bg-purple-50  text-purple-700  ring-purple-300',
  red:     'border-red-300     bg-red-50     text-red-700     ring-red-300',
}

const DEFAULT_PREFS = {
  vegan: false, glutenFree: false, nutFree: false, dairyFree: false, spicy: false,
  allergies: [],
  notes: '',
}

export default function DietaryProfile() {
  const { user } = useAuthStore()
  const [prefs, setPrefs]     = useState(DEFAULT_PREFS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)

  // Load existing preferences
  useEffect(() => {
    if (!user?.uid) { setLoading(false); return }
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (snap.exists()) {
          const data = snap.data()
          if (data.dietaryPrefs) setPrefs({ ...DEFAULT_PREFS, ...data.dietaryPrefs })
        }
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
  }, [user?.uid])

  const toggle = (key) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] }))

  const toggleAllergy = (tag) =>
    setPrefs((p) => ({
      ...p,
      allergies: p.allergies.includes(tag)
        ? p.allergies.filter((t) => t !== tag)
        : [...p.allergies, tag],
    }))

  const handleSave = async () => {
    if (!user?.uid) return
    setSaving(true)
    try {
      await setDoc(doc(db, 'users', user.uid), { dietaryPrefs: prefs }, { merge: true })
      toast.success('Dietary preferences saved! Menu will auto-filter for you.')
    } catch {
      toast.error('Could not save preferences. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-400 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
          <User size={18} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Dietary Profile</h1>
          <p className="text-sm text-neutral-500">Your preferences are saved and used to auto-filter the menu.</p>
        </div>
      </div>

      {/* Email display */}
      {user?.email && (
        <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3">
          <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
          <span className="text-sm text-neutral-600">{user.email}</span>
        </div>
      )}

      {/* Dietary filters */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-neutral-800 mb-4">Dietary Restrictions</h2>
        <div className="space-y-3">
          {DIETARY_OPTIONS.map(({ key, label, desc, icon: Icon, color }) => {
            const isOn = prefs[key]
            const cls  = COLOR_MAP[color]
            return (
              <button
                key={key}
                onClick={() => toggle(key)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl border-2 text-left transition
                  ${isOn ? cls + ' ring-1' : 'border-neutral-200 bg-white hover:border-neutral-300'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                  ${isOn ? 'bg-white/50' : 'bg-neutral-100'}`}>
                  <Icon size={15} className={isOn ? '' : 'text-neutral-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isOn ? '' : 'text-neutral-700'}`}>{label}</p>
                  <p className={`text-xs mt-0.5 ${isOn ? 'opacity-80' : 'text-neutral-400'}`}>{desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                  ${isOn ? 'bg-current border-current' : 'border-neutral-300'}`}>
                  {isOn && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Additional allergies */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-neutral-800 mb-1">Additional Allergens</h2>
        <p className="text-xs text-neutral-400 mb-4">These are shown in your profile — staff will be informed when you order.</p>
        <div className="flex flex-wrap gap-2">
          {ALLERGY_TAGS.map((tag) => {
            const selected = prefs.allergies.includes(tag)
            return (
              <button
                key={tag}
                onClick={() => toggleAllergy(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition
                  ${selected
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:border-orange-300'}`}
              >
                {tag}
              </button>
            )
          })}
        </div>
      </div>

      {/* Free-form notes */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-neutral-800 mb-3">Additional Notes</h2>
        <textarea
          value={prefs.notes}
          onChange={(e) => setPrefs((p) => ({ ...p, notes: e.target.value }))}
          rows={3}
          placeholder="Any other dietary requirements, health conditions, or preferences you'd like us to know…"
          className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
        />
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
      >
        <Save size={16} />
        {saving ? 'Saving…' : 'Save Preferences'}
      </button>

      <p className="text-xs text-neutral-400 text-center">
        Your dietary preferences are saved securely and used only to personalise your menu experience.
      </p>
    </div>
  )
}
