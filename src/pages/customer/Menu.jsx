import { useEffect, useState } from 'react'
import { Search, ShoppingCart, Star, Flame, Dumbbell, Leaf, WheatOff, AlertCircle, X, Plus, Minus } from 'lucide-react'
import { getMenuItems } from '../../services/menuService'

const CATEGORIES = ['All', 'Starters', 'Main Courses', 'Desserts', 'Drinks']

const DIETARY_FILTERS = [
  { key: 'vegan',      label: 'Vegan',      icon: Leaf,        color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { key: 'glutenFree', label: 'Gluten-Free', icon: WheatOff,   color: 'text-amber-600 bg-amber-50 border-amber-200'    },
  { key: 'nutFree',    label: 'Nut-Free',   icon: AlertCircle, color: 'text-blue-600 bg-blue-50 border-blue-200'       },
]

const MOCK_ITEMS = [
  { id: '1', name: 'Bruschetta', category: 'Starters', price: 8.5, description: 'Toasted sourdough with crushed tomatoes, roasted garlic and fresh basil.', rating: 4.7, calories: 210, protein: 5, vegan: true, glutenFree: false, nutFree: true, gradient: 'from-red-100 to-orange-50', emoji: '🍅' },
  { id: '2', name: 'Tagliatelle Ragù', category: 'Main Courses', price: 16.0, description: 'Hand-rolled egg pasta with slow-braised beef ragù and aged Parmigiano.', rating: 4.9, calories: 680, protein: 34, vegan: false, glutenFree: false, nutFree: true, gradient: 'from-amber-100 to-yellow-50', emoji: '🍝' },
  { id: '3', name: 'Mushroom Risotto', category: 'Main Courses', price: 14.5, description: 'Creamy Carnaroli rice with wild porcini mushrooms and truffle oil.', rating: 4.6, calories: 540, protein: 14, vegan: false, glutenFree: true, nutFree: true, gradient: 'from-stone-100 to-amber-50', emoji: '🍄' },
  { id: '4', name: 'Tiramisù', category: 'Desserts', price: 7.0, description: 'Classic mascarpone cream with espresso-soaked ladyfingers and dark cocoa.', rating: 4.8, calories: 390, protein: 7, vegan: false, glutenFree: false, nutFree: true, gradient: 'from-amber-100 to-stone-50', emoji: '☕' },
  { id: '5', name: 'Fresh Lemonade', category: 'Drinks', price: 4.5, description: 'Fresh-squeezed lemon juice with sparkling water and mint.', rating: 4.5, calories: 65, protein: 0, vegan: true, glutenFree: true, nutFree: true, gradient: 'from-yellow-100 to-lime-50', emoji: '🍋' },
  { id: '6', name: 'Caprese Salad', category: 'Starters', price: 9.0, description: 'Buffalo mozzarella, heirloom tomatoes and fresh basil.', rating: 4.7, calories: 280, protein: 12, vegan: false, glutenFree: true, nutFree: true, gradient: 'from-green-100 to-emerald-50', emoji: '🥗' },
]

const DIETARY_TAG_STYLE = {
  vegan:      { icon: Leaf,        label: 'Vegan', style: 'bg-emerald-50 text-emerald-600' },
  glutenFree: { icon: WheatOff,    label: 'GF',    style: 'bg-amber-50 text-amber-600'    },
  nutFree:    { icon: AlertCircle, label: 'NF',    style: 'bg-blue-50 text-blue-600'      },
}

function DietaryTag({ type }) {
  const { icon: Icon, label, style } = DIETARY_TAG_STYLE[type]
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${style}`}>
      <Icon size={9} />{label}
    </span>
  )
}

function MenuCard({ item, cartQty, onAdd, onRemove }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group">
      <div className={`relative h-40 bg-gradient-to-br ${item.gradient} flex items-center justify-center`}>
        <span className="text-5xl select-none group-hover:scale-110 transition-transform duration-300">{item.emoji}</span>
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {item.vegan && <DietaryTag type="vegan" />}
          {item.glutenFree && <DietaryTag type="glutenFree" />}
          {item.nutFree && <DietaryTag type="nutFree" />}
        </div>
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-full">
          <Star size={10} fill="#f59e0b" className="text-amber-400" />
          <span className="text-[11px] font-semibold text-neutral-700">{item.rating}</span>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-neutral-900 text-sm leading-snug">{item.name}</h3>
          <span className="text-brand-600 font-bold text-sm whitespace-nowrap">${Number(item.price).toFixed(2)}</span>
        </div>
        <p className="text-xs text-neutral-500 mt-1 line-clamp-2 flex-1">{item.description}</p>

        {(item.calories || item.protein) && (
          <div className="flex items-center gap-2 mt-2">
            {item.calories && <span className="flex items-center gap-1 text-[11px] text-neutral-400"><Flame size={10} className="text-orange-400" />{item.calories} kcal</span>}
            {item.protein > 0 && <span className="flex items-center gap-1 text-[11px] text-neutral-400"><Dumbbell size={10} className="text-blue-400" />{item.protein}g</span>}
          </div>
        )}

        <div className="mt-3">
          {cartQty === 0 ? (
            <button
              onClick={() => onAdd(item)}
              className="w-full flex items-center justify-center gap-1.5 text-sm font-medium bg-brand-500 hover:bg-brand-600 text-white py-2 rounded-xl transition"
            >
              <ShoppingCart size={13} /> Add to Order
            </button>
          ) : (
            <div className="flex items-center justify-between bg-brand-50 rounded-xl px-3 py-1.5">
              <button onClick={() => onRemove(item.id)} className="text-brand-600 hover:text-brand-800"><Minus size={14} /></button>
              <span className="text-sm font-bold text-brand-700">{cartQty}</span>
              <button onClick={() => onAdd(item)} className="text-brand-600 hover:text-brand-800"><Plus size={14} /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CartDrawer({ cart, onClose, onAdd, onRemove }) {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <h2 className="font-bold text-neutral-900">Your Order</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {cart.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-12">Your order is empty.</p>
          ) : cart.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <span className="text-2xl">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">{item.name}</p>
                <p className="text-xs text-neutral-400">${Number(item.price).toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onRemove(item.id)} className="text-neutral-400 hover:text-red-500"><Minus size={13} /></button>
                <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                <button onClick={() => onAdd(item)} className="text-neutral-400 hover:text-brand-500"><Plus size={13} /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-neutral-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-neutral-600">Total</span>
            <span className="text-lg font-bold text-neutral-900">${total.toFixed(2)}</span>
          </div>
          <button className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 rounded-xl transition">
            Place Order
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Menu() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [activeDietary, setActiveDietary] = useState([])
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    getMenuItems()
      .then((data) => setItems(data.length ? data : MOCK_ITEMS))
      .catch(() => setItems(MOCK_ITEMS))
      .finally(() => setLoading(false))
  }, [])

  const toggleDietary = (key) =>
    setActiveDietary((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key])

  const filtered = items.filter((item) => {
    const matchCat = activeCategory === 'All' || item.category === activeCategory
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchDiet = activeDietary.every((key) => item[key])
    return matchCat && matchSearch && matchDiet
  })

  const addToCart = (item) =>
    setCart((c) => {
      const existing = c.find((i) => i.id === item.id)
      return existing
        ? c.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
        : [...c, { ...item, qty: 1 }]
    })

  const removeFromCart = (id) =>
    setCart((c) => {
      const existing = c.find((i) => i.id === id)
      if (!existing) return c
      return existing.qty === 1 ? c.filter((i) => i.id !== id) : c.map((i) => i.id === id ? { ...i, qty: i.qty - 1 } : i)
    })

  const totalItems = cart.reduce((sum, i) => sum + i.qty, 0)

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Filter bar */}
      <div className="bg-white border-b border-neutral-200 px-4 py-4 sticky top-16 z-40">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 min-w-0 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dishes…"
                className="w-full pl-8 pr-3 py-2 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition shrink-0"
            >
              <ShoppingCart size={15} />
              Order
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
            <div className="w-px h-4 bg-neutral-200 mx-1" />
            {DIETARY_FILTERS.map(({ key, label, icon: Icon, color }) => (
              <button
                key={key}
                onClick={() => toggleDietary(key)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition
                  ${activeDietary.includes(key) ? color + ' border-current' : 'bg-white border-neutral-200 text-neutral-500 hover:border-neutral-300'}`}
              >
                <Icon size={10} />{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-400 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-neutral-400">
            <p className="font-medium">No dishes match your filters.</p>
            <button
              onClick={() => { setActiveDietary([]); setSearch(''); setActiveCategory('All') }}
              className="mt-2 text-sm text-brand-500 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((item) => (
              <MenuCard key={item.id} item={item} cartQty={cart.find((i) => i.id === item.id)?.qty ?? 0} onAdd={addToCart} onRemove={removeFromCart} />
            ))}
          </div>
        )}
      </div>

      {cartOpen && <CartDrawer cart={cart} onClose={() => setCartOpen(false)} onAdd={addToCart} onRemove={removeFromCart} />}
    </div>
  )
}
