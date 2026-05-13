/**
 * Firestore Seed Script
 * ─────────────────────
 * Run ONCE after you connect your real Firebase project.
 * Usage: import and call seedDatabase() from a temporary button/useEffect.
 *
 * Creates:
 *  - /menuItems  (10 items)
 *  - /users      (3 role accounts — must match Firebase Auth UIDs after first login)
 */
import { collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore'
import { db } from './config'

const MENU_ITEMS = [
  { name: 'Bruschetta al Pomodoro', category: 'Starters', price: 8.5,  calories: 210, protein: 5,  vegan: true,  glutenFree: false, nutFree: true,  rating: 4.7, description: 'Toasted sourdough with heirloom tomatoes, garlic and basil.' },
  { name: 'Insalata Caprese',       category: 'Starters', price: 9.0,  calories: 280, protein: 12, vegan: false, glutenFree: true,  nutFree: true,  rating: 4.7, description: 'Buffalo mozzarella, heirloom tomatoes, basil oil.' },
  { name: 'Zuppa di Legumi',        category: 'Starters', price: 7.5,  calories: 240, protein: 13, vegan: true,  glutenFree: true,  nutFree: true,  rating: 4.4, description: 'Hearty mixed legume soup with rosemary and chilli oil.' },
  { name: 'Tagliatelle al Ragù',    category: 'Mains',    price: 16.0, calories: 680, protein: 34, vegan: false, glutenFree: false, nutFree: true,  rating: 4.9, description: 'Hand-rolled pasta with slow-braised beef ragù.' },
  { name: 'Risotto ai Funghi',      category: 'Mains',    price: 14.5, calories: 540, protein: 14, vegan: false, glutenFree: true,  nutFree: true,  rating: 4.6, description: 'Creamy Carnaroli rice with wild porcini and truffle oil.' },
  { name: 'Bistecca Fiorentina',    category: 'Mains',    price: 28.0, calories: 920, protein: 82, vegan: false, glutenFree: true,  nutFree: true,  rating: 5.0, description: '600g T-bone from Chianina cattle, charcoal grilled.' },
  { name: 'Tiramisù',               category: 'Desserts', price: 7.0,  calories: 390, protein: 7,  vegan: false, glutenFree: false, nutFree: true,  rating: 4.8, description: 'Classic mascarpone cream with espresso ladyfingers.' },
  { name: 'Panna Cotta',            category: 'Desserts', price: 6.5,  calories: 310, protein: 4,  vegan: false, glutenFree: true,  nutFree: true,  rating: 4.6, description: 'Vanilla cream with wild berry coulis.' },
  { name: 'Limonata Fresca',        category: 'Drinks',   price: 4.5,  calories: 65,  protein: 0,  vegan: true,  glutenFree: true,  nutFree: true,  rating: 4.5, description: 'Amalfi lemon juice with sparkling water and mint.' },
  { name: 'Acqua di Cocco e Menta', category: 'Drinks',   price: 5.0,  calories: 45,  protein: 0,  vegan: true,  glutenFree: true,  nutFree: true,  rating: 4.3, description: 'Coconut water with fresh mint and lime.' },
]

const TABLES = [
  { id: 'T1', zone: 'Indoor',  capacity: 2  },
  { id: 'T2', zone: 'Indoor',  capacity: 4  },
  { id: 'T3', zone: 'Indoor',  capacity: 6  },
  { id: 'T4', zone: 'Window',  capacity: 2  },
  { id: 'T5', zone: 'Window',  capacity: 4  },
  { id: 'T6', zone: 'Outdoor', capacity: 4  },
  { id: 'T7', zone: 'Outdoor', capacity: 8  },
  { id: 'T8', zone: 'Outdoor', capacity: 10 },
]

export const seedDatabase = async () => {
  const batch = writeBatch(db)

  // Seed menu items
  MENU_ITEMS.forEach((item) => {
    const ref = doc(collection(db, 'menuItems'))
    batch.set(ref, { ...item, createdAt: serverTimestamp() })
  })

  // Seed tables
  TABLES.forEach((table) => {
    const ref = doc(db, 'tables', table.id)
    batch.set(ref, { ...table, isActive: true })
  })

  await batch.commit()
  console.log('✅ Firestore seeded successfully.')
}

/**
 * After your 3 test users sign in for the first time via Firebase Auth,
 * call this to assign their roles in Firestore.
 *
 * Usage: seedUserRoles({ managerUid: '...', staffUid: '...', customerUid: '...' })
 */
export const seedUserRoles = async ({ managerUid, staffUid, customerUid }) => {
  const batch = writeBatch(db)
  batch.set(doc(db, 'users', managerUid),  { role: 'manager'  })
  batch.set(doc(db, 'users', staffUid),    { role: 'staff'    })
  batch.set(doc(db, 'users', customerUid), { role: 'customer' })
  await batch.commit()
  console.log('✅ User roles seeded.')
}
