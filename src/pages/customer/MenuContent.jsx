import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Search, ShoppingCart, Star, Flame, Dumbbell,
  Leaf, WheatOff, AlertCircle, X, Plus, Minus, MessageSquare,
  Milk, PlayCircle,
} from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { getMenuItems } from '../../services/menuService'
import { getAllReviewStats } from '../../services/reviewService'
import useOrderStore from '../../store/useOrderStore'
import useAuthStore from '../../store/useAuthStore'
import MockPaymentModal from '../../components/customer/MockPaymentModal'
import ReviewModal from '../../components/customer/ReviewModal'
import ItemCustomizationModal from '../../components/customer/ItemCustomizationModal'
import VideoModal from '../../components/customer/VideoModal'
import { notifyOrderPlaced } from '../../services/notificationService'

const CATEGORIES = ['All', 'Starters', 'Main Courses', 'Desserts', 'Drinks']

const DIETARY_FILTERS = [
  { key: 'vegan',      label: 'Vegan',        icon: Leaf,          color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { key: 'glutenFree', label: 'Gluten-Free',   icon: WheatOff,     color: 'text-amber-600 bg-amber-50 border-amber-200'      },
  { key: 'nutFree',    label: 'Nut-Free',      icon: AlertCircle,  color: 'text-blue-600 bg-blue-50 border-blue-200'         },
  { key: 'dairyFree',  label: 'Dairy-Free',    icon: Milk,         color: 'text-purple-600 bg-purple-50 border-purple-200'   },
  { key: 'spicy',      label: 'Spicy',         icon: Flame,        color: 'text-red-600 bg-red-50 border-red-200'            },
]

// Allergen info for display
const ALLERGEN_LABELS = {
  containsGluten:  { label: 'Contains Gluten',  style: 'bg-amber-50 text-amber-700  border-amber-200'   },
  containsNuts:    { label: 'Contains Nuts',    style: 'bg-blue-50  text-blue-700   border-blue-200'    },
  containsDairy:   { label: 'Contains Dairy',   style: 'bg-purple-50 text-purple-700 border-purple-200' },
  containsEggs:    { label: 'Contains Eggs',    style: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  containsShellfish:{ label: 'Contains Shellfish', style: 'bg-orange-50 text-orange-700 border-orange-200' },
}

const MOCK_ITEMS = [
  {
    id: '1', name: 'Bruschetta', category: 'Starters', price: 8.5,
    description: 'Toasted sourdough with crushed tomatoes, roasted garlic and fresh basil.',
    rating: 4.7, reviews: 128, calories: 210, protein: 5,
    vegan: true, glutenFree: false, nutFree: true, dairyFree: true, spicy: false,
    containsGluten: true,
    allergens: 'Gluten (sourdough bread)',
    gradient: 'from-red-100 to-orange-50', emoji: '🍅',
    imageUrl: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=480&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/embed/FLEAMBa_H2s?autoplay=1&rel=0',
  },
  {
    id: '2', name: 'Tagliatelle Ragù', category: 'Main Courses', price: 16.0,
    description: 'Hand-rolled egg pasta with slow-braised beef ragù and aged Parmigiano.',
    rating: 4.9, reviews: 256, calories: 680, protein: 34,
    vegan: false, glutenFree: false, nutFree: true, dairyFree: false, spicy: false,
    containsGluten: true, containsDairy: true, containsEggs: true,
    allergens: 'Gluten (pasta), Dairy (Parmigiano), Eggs (fresh pasta)',
    gradient: 'from-amber-100 to-yellow-50', emoji: '🍝',
    imageUrl: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=480&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/embed/KMSHbMhGTCk?autoplay=1&rel=0',
  },
  {
    id: '3', name: 'Mushroom Risotto', category: 'Main Courses', price: 14.5,
    description: 'Creamy Carnaroli rice with wild porcini mushrooms and truffle oil.',
    rating: 4.6, reviews: 94, calories: 540, protein: 14,
    vegan: false, glutenFree: true, nutFree: true, dairyFree: false, spicy: false,
    containsDairy: true,
    allergens: 'Dairy (Parmesan, butter)',
    gradient: 'from-stone-100 to-amber-50', emoji: '🍄',
    imageUrl: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=480&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/embed/b8E4tFJV7Y8?autoplay=1&rel=0',
  },
  {
    id: '4', name: 'Tiramisù', category: 'Desserts', price: 7.0,
    description: 'Classic mascarpone cream with espresso-soaked ladyfingers and dark cocoa.',
    rating: 4.8, reviews: 312, calories: 390, protein: 7,
    vegan: false, glutenFree: false, nutFree: true, dairyFree: false, spicy: false,
    containsGluten: true, containsDairy: true, containsEggs: true,
    allergens: 'Gluten (ladyfingers), Dairy (mascarpone), Eggs',
    gradient: 'from-amber-100 to-stone-50', emoji: '☕',
    imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=480&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/embed/EFHj7gCpvGc?autoplay=1&rel=0',
  },
  {
    id: '5', name: 'Fresh Lemonade', category: 'Drinks', price: 4.5,
    description: 'Fresh-squeezed lemon juice with sparkling water and mint.',
    rating: 4.5, reviews: 67, calories: 65, protein: 0,
    vegan: true, glutenFree: true, nutFree: true, dairyFree: true, spicy: false,
    allergens: 'None',
    gradient: 'from-yellow-100 to-lime-50', emoji: '🍋',
    imageUrl: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=480&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/embed/kJbOEcjohyg?autoplay=1&rel=0',
  },
  {
    id: '6', name: 'Caprese Salad', category: 'Starters', price: 9.0,
    description: 'Buffalo mozzarella, heirloom tomatoes and fresh basil with extra-virgin olive oil.',
    rating: 4.7, reviews: 183, calories: 280, protein: 12,
    vegan: false, glutenFree: true, nutFree: true, dairyFree: false, spicy: false,
    containsDairy: true,
    allergens: 'Dairy (buffalo mozzarella)',
    gradient: 'from-green-100 to-emerald-50', emoji: '🥗',
    imageUrl: 'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=480&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/embed/8GrdNMdRPZs?autoplay=1&rel=0',
  },
  {
    id: '7', name: 'Spicy Arrabbiata', category: 'Main Courses', price: 13.5,
    description: 'Penne pasta with fiery San Marzano tomatoes, garlic, chili flakes and fresh parsley.',
    rating: 4.4, reviews: 78, calories: 520, protein: 16,
    vegan: true, glutenFree: false, nutFree: true, dairyFree: true, spicy: true,
    containsGluten: true,
    allergens: 'Gluten (pasta)',
    gradient: 'from-red-100 to-rose-50', emoji: '🌶️',
    imageUrl: 'https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?w=480&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/embed/7jkF_b0MDdg?autoplay=1&rel=0',
  },
  {
    id: '8', name: 'Panna Cotta', category: 'Desserts', price: 6.5,
    description: 'Silky vanilla panna cotta with mixed berry coulis and fresh mint.',
    rating: 4.6, reviews: 112, calories: 310, protein: 4,
    vegan: false, glutenFree: true, nutFree: true, dairyFree: false, spicy: false,
    containsDairy: true,
    allergens: 'Dairy (heavy cream)',
    gradient: 'from-pink-100 to-rose-50', emoji: '🍮',
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=480&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/embed/i-mH80VGAnk?autoplay=1&rel=0',
  },
  {
    id: '9', name: 'Bistecca Fiorentina', category: 'Main Courses', price: 28.0,
    description: '600g T-bone from Chianina cattle, charcoal grilled with rosemary and Tuscan EVOO.',
    rating: 5.0, reviews: 204, calories: 920, protein: 82,
    vegan: false, glutenFree: true, nutFree: true, dairyFree: true, spicy: false,
    allergens: 'None',
    gradient: 'from-red-100 to-orange-50', emoji: '🥩',
    imageUrl: 'https://images.unsplash.com/photo-1558030006-450675393462?w=480&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/embed/wJ9-vSEBfmQ?autoplay=1&rel=0',
  },
  {
    id: '10', name: 'Coconut Mint Agua', category: 'Drinks', price: 5.0,
    description: 'Chilled coconut water with fresh mint, lime zest and a pinch of sea salt.',
    rating: 4.3, reviews: 45, calories: 45, protein: 0,
    vegan: true, glutenFree: true, nutFree: true, dairyFree: true, spicy: false,
    allergens: 'None',
    gradient: 'from-teal-100 to-cyan-50', emoji: '🥥',
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=480&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/embed/rIxbkF7GAl4?autoplay=1&rel=0',
  },
]

const DIETARY_TAG_STYLE = {
  vegan:      { icon: Leaf,        label: 'Vegan', style: 'bg-emerald-50 text-emerald-600' },
  glutenFree: { icon: WheatOff,    label: 'GF',    style: 'bg-amber-50 text-amber-600'    },
  nutFree:    { icon: AlertCircle, label: 'NF',    style: 'bg-blue-50 text-blue-600'      },
  dairyFree:  { icon: Milk,        label: 'DF',    style: 'bg-purple-50 text-purple-600'  },
  spicy:      { icon: Flame,        label: 'Spicy', style: 'bg-red-50 text-red-600'        },
}

function DietaryTag({ type }) {
  const { icon: Icon, label, style } = DIETARY_TAG_STYLE[type]
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${style}`}>
      <Icon size={9} />{label}
    </span>
  )
}

// ── Menu card ─────────────────────────────────────────────────────────────────

function MenuCard({ item, cartQty, onAdd, onRemove, hideCart, onReview, reviewStats, onVideo }) {
  const [showAllergens, setShowAllergens] = useState(false)

  // Use live review stats if available, fall back to mock data
  const liveStats = reviewStats?.[item.id]
  const displayRating  = liveStats ? liveStats.avgRating  : item.rating
  const displayReviews = liveStats ? liveStats.count       : item.reviews

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group">
      {/* Thumbnail */}
      <div className={`relative h-44 bg-gradient-to-br ${item.gradient} flex items-center justify-center overflow-hidden`}>
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <span className="text-5xl select-none group-hover:scale-110 transition-transform duration-300">{item.emoji}</span>
        )}
        {/* Dark overlay for text contrast */}
        {item.imageUrl && <div className="absolute inset-0 bg-black/10" />}

        {/* Video play button — bottom right of thumbnail */}
        {item.videoUrl && (
          <button
            onClick={() => onVideo(item)}
            className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-full transition"
          >
            <PlayCircle size={12} />
            Watch
          </button>
        )}

        {/* Dietary tags — top left */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {item.vegan      && <DietaryTag type="vegan" />}
          {item.glutenFree && <DietaryTag type="glutenFree" />}
          {item.nutFree    && <DietaryTag type="nutFree" />}
          {item.dairyFree  && <DietaryTag type="dairyFree" />}
          {item.spicy      && <DietaryTag type="spicy" />}
        </div>

        {/* Rating + reviews — top right (clickable) */}
        <button
          onClick={() => onReview(item)}
          className="absolute top-2 right-2 flex items-center gap-1 bg-white/85 backdrop-blur-sm px-2 py-0.5 rounded-full hover:bg-white transition"
        >
          <Star size={10} fill="#f59e0b" className="text-amber-400" />
          <span className="text-[11px] font-semibold text-neutral-700">{displayRating}</span>
          {displayReviews != null && (
            <span className="text-[10px] text-neutral-400">({displayReviews})</span>
          )}
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-neutral-900 text-sm leading-snug">{item.name}</h3>
          <span className="text-brand-600 font-bold text-sm whitespace-nowrap">${Number(item.price).toFixed(2)}</span>
        </div>

        <p className="text-xs text-neutral-500 mt-1 line-clamp-2 flex-1">{item.description}</p>

        {/* Nutritional info */}
        {(item.calories || item.protein > 0) && (
          <div className="flex items-center gap-3 mt-2">
            {item.calories > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-neutral-400">
                <Flame size={10} className="text-orange-400" />{item.calories} kcal
              </span>
            )}
            {item.protein > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-neutral-400">
                <Dumbbell size={10} className="text-blue-400" />{item.protein}g protein
              </span>
            )}
          </div>
        )}

        {/* Allergen toggle */}
        {item.allergens && (
          <div className="mt-2">
            <button
              onClick={() => setShowAllergens((v) => !v)}
              className="text-[11px] text-neutral-400 hover:text-amber-600 underline underline-offset-2 transition flex items-center gap-1"
            >
              <AlertCircle size={10} />
              {showAllergens ? 'Hide allergens' : 'View allergens'}
            </button>
            {showAllergens && (
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5 mt-1">
                ⚠️ {item.allergens}
              </p>
            )}
          </div>
        )}

        {/* Review button */}
        <button
          onClick={() => onReview(item)}
          className="mt-2 text-[11px] text-brand-500 hover:text-brand-700 flex items-center gap-1 transition"
        >
          <MessageSquare size={11} />
          {displayReviews > 0 ? `${displayReviews} reviews` : 'Write a review'}
        </button>

        {/* Add to cart / qty control */}
        {!hideCart && (
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
        )}
      </div>
    </div>
  )
}

// ── Cart drawer ──────────────────────────────────────────────────────────────

function CartDrawer({ cart, onClose, onAdd, onRemove, onPlaceOrder }) {
  const [tableId, setTableId]       = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [placing, setPlacing]       = useState(false)

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)

  const handleCheckout = () => {
    if (cart.length === 0) { toast.error('Your cart is empty.'); return }
    if (!tableId.trim())   { toast.error('Please enter your table number.'); return }
    setPaymentOpen(true)
  }

  const handlePaymentSuccess = async () => {
    setPaymentOpen(false)
    setPlacing(true)
    await onPlaceOrder(tableId.trim(), cart, total, orderNotes.trim())
    setPlacing(false)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
            <h2 className="font-bold text-neutral-900">Your Order</h2>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600"><X size={20} /></button>
          </div>

          {/* Item list */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {cart.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-12">Your order is empty.</p>
            ) : cart.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <span className="text-2xl shrink-0">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">{item.name}</p>
                  <p className="text-xs text-neutral-400">${Number(item.price).toFixed(2)} each</p>
                  {item.customization && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 rounded-md px-1.5 py-0.5 mt-0.5 leading-snug">
                      {item.customization}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => onRemove(item.id)} className="text-neutral-400 hover:text-red-500"><Minus size={13} /></button>
                  <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                  <button onClick={() => onAdd(item)} className="text-neutral-400 hover:text-brand-500"><Plus size={13} /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-neutral-100 space-y-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 mb-1.5">
                <MessageSquare size={12} className="text-neutral-400" />
                Table number *
              </label>
              <input
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
                placeholder="e.g. T3"
                className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 mb-1.5">
                <MessageSquare size={12} className="text-neutral-400" />
                Order notes (optional)
              </label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Any general requests for the whole order…"
                rows={2}
                className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-600">Total</span>
              <span className="text-lg font-bold text-neutral-900">${total.toFixed(2)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={placing || cart.length === 0}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
            >
              {placing ? 'Placing order…' : 'Pay & Place Order'}
            </button>
          </div>
        </div>
      </div>

      {paymentOpen && (
        <MockPaymentModal
          total={total}
          onSuccess={handlePaymentSuccess}
          onClose={() => setPaymentOpen(false)}
        />
      )}
    </>
  )
}

// ── Main export ──────────────────────────────────────────────────────────────

export default function MenuContent({ hideCart = false }) {
  const { user } = useAuthStore()
  const { placeOrder } = useOrderStore()

  const [items, setItems]                   = useState([])
  const [loading, setLoading]               = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch]                 = useState('')
  const [activeDietary, setActiveDietary]   = useState([])
  const [cart, setCart]                     = useState([])
  const [cartOpen, setCartOpen]             = useState(false)
  const [reviewItem, setReviewItem]         = useState(null)
  const [customizeItem, setCustomizeItem]   = useState(null)
  const [videoItem, setVideoItem]           = useState(null)
  const [reviewStats, setReviewStats]       = useState({})
  const [profileLoaded, setProfileLoaded]   = useState(false)

  // Load user dietary preferences and auto-apply as filters
  useEffect(() => {
    if (!user?.uid || profileLoaded) return
    const loadProfile = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (snap.exists()) {
          const prefs = snap.data().dietaryPrefs ?? {}
          const activeKeys = Object.entries(prefs)
            .filter(([key, val]) => val === true && ['vegan','glutenFree','nutFree','dairyFree','spicy'].includes(key))
            .map(([key]) => key)
          if (activeKeys.length > 0) {
            setActiveDietary(activeKeys)
            toast(`Your dietary filters have been applied automatically.`, {
              icon: '🥗',
              duration: 3000,
              style: { fontSize: '13px' },
            })
          }
        }
      } catch { /* ignore */ }
      setProfileLoaded(true)
    }
    loadProfile()
  }, [user?.uid, profileLoaded])

  useEffect(() => {
    const load = async () => {
      try {
        const [data, stats] = await Promise.all([
          getMenuItems(),
          getAllReviewStats().catch(() => ({})),
        ])
        setItems(data.length ? data : MOCK_ITEMS)
        setReviewStats(stats)
      } catch {
        setItems(MOCK_ITEMS)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const toggleDietary = (key) =>
    setActiveDietary((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )

  const filtered = items.filter((item) => {
    const matchCat    = activeCategory === 'All' || item.category === activeCategory
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchDiet   = activeDietary.every((key) => {
      // 'spicy' is inclusive (show only spicy), others are exclusive (show items that ARE that type)
      return item[key]
    })
    return matchCat && matchSearch && matchDiet
  })

  // Open customization modal instead of adding directly
  const handleAddToCart = (item) => {
    if (hideCart) return
    setCustomizeItem(item)
  }

  const handleCustomizationConfirm = (itemWithCustomization) => {
    setCart((c) => {
      const existing = c.find((i) => i.id === itemWithCustomization.id)
      if (existing) {
        // If same item, merge qty and keep latest customization
        return c.map((i) =>
          i.id === itemWithCustomization.id
            ? { ...i, qty: i.qty + itemWithCustomization.qty, customization: itemWithCustomization.customization || i.customization }
            : i
        )
      }
      return [...c, itemWithCustomization]
    })
    toast.success(`${itemWithCustomization.name} added to order!`)
  }

  const removeFromCart = (id) =>
    setCart((c) => {
      const existing = c.find((i) => i.id === id)
      if (!existing) return c
      return existing.qty === 1
        ? c.filter((i) => i.id !== id)
        : c.map((i) => i.id === id ? { ...i, qty: i.qty - 1 } : i)
    })

  const handlePlaceOrder = async (tableId, cartItems, total, notes) => {
    try {
      await placeOrder({
        tableId,
        uid:           user?.uid ?? '',
        customerName:  user?.email?.split('@')[0] ?? 'Guest',
        customerEmail: user?.email ?? '',
        items: cartItems.map((i) => ({
          id:            i.id,
          name:          i.name,
          price:         i.price,
          qty:           i.qty,
          customization: i.customization || '',
        })),
        total,
        notes: notes || '',
      })
      // Send in-app notification + email
      if (user?.uid) {
        await notifyOrderPlaced(user.uid, user?.email ?? null, tableId, total)
      }
      toast.success('Order placed! The kitchen is on it.')
      setCart([])
      setCartOpen(false)
    } catch {
      toast.error('Failed to place order. Please try again.')
    }
  }

  const totalItems = cart.reduce((sum, i) => sum + i.qty, 0)

  return (
    <div>
      {/* Filter bar */}
      <div className="bg-white border-b border-neutral-200 px-4 py-3 sticky top-[105px] z-30">
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
            {!hideCart && (
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
            )}
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
            {activeDietary.length > 0 && (
              <button
                onClick={() => setActiveDietary([])}
                className="text-xs text-neutral-400 hover:text-neutral-600 flex items-center gap-0.5"
              >
                <X size={10} /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Menu grid */}
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
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                cartQty={hideCart ? 0 : (cart.find((i) => i.id === item.id)?.qty ?? 0)}
                onAdd={hideCart ? () => {} : handleAddToCart}
                onRemove={hideCart ? () => {} : removeFromCart}
                hideCart={hideCart}
                onReview={setReviewItem}
                onVideo={setVideoItem}
                reviewStats={reviewStats}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cart drawer */}
      {cartOpen && (
        <CartDrawer
          cart={cart}
          onClose={() => setCartOpen(false)}
          onAdd={handleAddToCart}
          onRemove={removeFromCart}
          onPlaceOrder={handlePlaceOrder}
        />
      )}

      {/* Review modal */}
      {reviewItem && (
        <ReviewModal
          item={reviewItem}
          onClose={() => {
            setReviewItem(null)
            // Refresh review stats
            getAllReviewStats().then(setReviewStats).catch(() => {})
          }}
        />
      )}

      {/* Item customization modal */}
      {customizeItem && (
        <ItemCustomizationModal
          item={customizeItem}
          onConfirm={handleCustomizationConfirm}
          onClose={() => setCustomizeItem(null)}
        />
      )}

      {/* Video modal */}
      {videoItem && (
        <VideoModal
          item={videoItem}
          onClose={() => setVideoItem(null)}
        />
      )}
    </div>
  )
}
