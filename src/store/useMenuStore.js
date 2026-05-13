import { create } from 'zustand'
import { getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem } from '../services/menuService'

const useMenuStore = create((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchItems: async (category = null) => {
    set({ loading: true, error: null })
    try {
      const items = await getMenuItems(category)
      set({ items, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  addItem: async (item) => {
    const id = await addMenuItem(item)
    set((s) => ({ items: [...s.items, { id, ...item }] }))
    return id
  },

  updateItem: async (id, updates) => {
    await updateMenuItem(id, updates)
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    }))
  },

  deleteItem: async (id) => {
    await deleteMenuItem(id)
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }))
  },

  // Optimistic local update (no Firebase round-trip)
  setItems: (items) => set({ items }),
}))

export default useMenuStore
