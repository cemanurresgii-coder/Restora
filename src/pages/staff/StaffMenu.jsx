import { useEffect, useState } from 'react'
import { Search, Leaf, WheatOff, AlertCircle, Flame, Dumbbell } from 'lucide-react'
import { getMenuItems } from '../../services/menuService'

const CATEGORIES = ['All', 'Starters', 'Main Courses', 'Desserts', 'Drinks']

const DIETARY = [
  { key: 'vegan',      label: 'Vegan',       icon: Leaf,        color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { key: 'glutenFree', label: 'Gluten-Free',  icon: WheatOff,   color: 'text-amber-600 bg-amber-50 border-amber-200'    },
  { key: 'nutFree',    label: 'Nut-Free',    icon: AlertCircle, color: 'text-blue-600 bg-blue-50 border-blue-200'       },
]

export default function StaffMenu() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [activeDietary, setActiveDietary] = useState([])

  useEffect(() => {
    getMenuItems()
      .then(setItems)
      .finally(() => setLoading(false))
  }, [])

  const filtered = items.filter((item) => {
    const matchCat = activeCategory === 'All' || item.category === activeCategory
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchDiet = activeDietary.every((key) => item[key])
    return matchCat && matchSearch && matchDiet
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Filters */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 mb-6 space-y-3">
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes…"
            className="w-full pl-8 pr-3 py-2 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition
                ${activeCategory === cat ? 'bg-brand-500 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
            >
              {cat}
            </button>
          ))}
          <div className="w-px h-4 bg-neutral-200 self-center mx-1" />
          {DIETARY.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setActiveDietary((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key])}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition
                ${activeDietary.includes(key) ? color + ' border-current' : 'bg-white border-neutral-200 text-neutral-500 hover:border-neutral-300'}`}
            >
              <Icon size={10} />{label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-400 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center py-20 text-neutral-400 text-sm">No dishes found.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">Dish</th>
                <th className="px-5 py-3 text-left">Category</th>
                <th className="px-5 py-3 text-left">Price</th>
                <th className="px-5 py-3 text-left">Dietary</th>
                <th className="px-5 py-3 text-left">Nutrition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-neutral-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-neutral-900">{item.name}</p>
                    {item.description && <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">{item.description}</p>}
                  </td>
                  <td className="px-5 py-3 text-neutral-500">{item.category}</td>
                  <td className="px-5 py-3 font-medium text-neutral-800">${Number(item.price).toFixed(2)}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {item.vegan      && <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs border border-emerald-200">Vegan</span>}
                      {item.glutenFree && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs border border-amber-200">GF</span>}
                      {item.nutFree    && <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs border border-blue-200">NF</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2 text-xs text-neutral-400">
                      {item.calories && <span className="flex items-center gap-1"><Flame size={10} className="text-orange-400" />{item.calories}</span>}
                      {item.protein > 0 && <span className="flex items-center gap-1"><Dumbbell size={10} className="text-blue-400" />{item.protein}g</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
