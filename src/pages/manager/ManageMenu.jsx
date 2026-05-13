import { useEffect, useState } from 'react'
import { Pencil, Trash2, Plus, X, Check } from 'lucide-react'
import useMenuStore from '../../store/useMenuStore'

const CATEGORIES = ['Starters', 'Main Courses', 'Desserts', 'Drinks']

const EMPTY_FORM = {
  name: '',
  price: '',
  category: CATEGORIES[0],
  imageUrl: '',
  description: '',
  calories: '',
  protein: '',
  vegan: false,
  glutenFree: false,
  nutFree: false,
}

export default function ManageMenu() {
  const { items, loading, fetchItems, addItem, updateItem, deleteItem } = useMenuStore()
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    fetchItems()
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleEdit = (item) => {
    setEditingId(item.id)
    setForm({
      name: item.name ?? '',
      price: item.price ?? '',
      category: item.category ?? CATEGORIES[0],
      imageUrl: item.imageUrl ?? '',
      description: item.description ?? '',
      calories: item.calories ?? '',
      protein: item.protein ?? '',
      vegan: item.vegan ?? false,
      glutenFree: item.glutenFree ?? false,
      nutFree: item.nutFree ?? false,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancel = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.price) return
    setSaving(true)
    const payload = {
      ...form,
      price: parseFloat(form.price),
      calories: form.calories ? parseInt(form.calories) : null,
      protein: form.protein ? parseInt(form.protein) : null,
    }
    if (editingId) {
      await updateItem(editingId, payload)
      setEditingId(null)
    } else {
      await addItem(payload)
    }
    setForm(EMPTY_FORM)
    setSaving(false)
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    await deleteItem(id)
    setDeletingId(null)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-neutral-900">Manage Menu</h1>

      {/* ── Form ── */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <h2 className="text-base font-semibold text-neutral-800 mb-4">
          {editingId ? 'Edit Item' : 'Add New Item'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="e.g. Margherita Pizza"
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Price ($) *</label>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                required
                placeholder="0.00"
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Image URL</label>
              <input
                name="imageUrl"
                value={form.imageUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Calories</label>
              <input
                name="calories"
                type="number"
                min="0"
                value={form.calories}
                onChange={handleChange}
                placeholder="kcal"
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Protein (g)</label>
              <input
                name="protein"
                type="number"
                min="0"
                value={form.protein}
                onChange={handleChange}
                placeholder="grams"
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              placeholder="Short description..."
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* Dietary flags */}
          <div className="flex flex-wrap gap-4">
            {[
              { name: 'vegan', label: 'Vegan' },
              { name: 'glutenFree', label: 'Gluten-Free' },
              { name: 'nutFree', label: 'Nut-Free' },
            ].map(({ name, label }) => (
              <label key={name} className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name={name}
                  checked={form[name]}
                  onChange={handleChange}
                  className="w-4 h-4 accent-brand-600"
                />
                {label}
              </label>
            ))}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {editingId ? <Check size={15} /> : <Plus size={15} />}
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Item'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-2 border border-neutral-300 text-neutral-600 hover:bg-neutral-100 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <X size={15} />
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="text-base font-semibold text-neutral-800">
            All Items
            <span className="ml-2 text-sm font-normal text-neutral-400">({items.length})</span>
          </h2>
        </div>

        {loading ? (
          <p className="text-center py-12 text-neutral-400 text-sm">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-center py-12 text-neutral-400 text-sm">No items yet. Add one above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Category</th>
                  <th className="px-6 py-3 text-left">Price</th>
                  <th className="px-6 py-3 text-left">Dietary</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${editingId === item.id ? 'bg-brand-50' : 'hover:bg-neutral-50'}`}
                  >
                    <td className="px-6 py-3 font-medium text-neutral-900">{item.name}</td>
                    <td className="px-6 py-3 text-neutral-500">{item.category}</td>
                    <td className="px-6 py-3 text-neutral-700">${Number(item.price).toFixed(2)}</td>
                    <td className="px-6 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {item.vegan && <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">Vegan</span>}
                        {item.glutenFree && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">GF</span>}
                        {item.nutFree && <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">Nut-Free</span>}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 rounded-lg text-neutral-500 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="p-1.5 rounded-lg text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
