import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { db } from '../firebase/config'

const COL = 'menuItems'

export const getMenuItems = async (category = null) => {
  const col = collection(db, COL)
  const constraints = category ? [where('category', '==', category)] : []
  const snap = await getDocs(query(col, ...constraints))
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return items.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
}

export const addMenuItem = async (item) => {
  const docRef = await addDoc(collection(db, COL), item)
  return docRef.id
}

export const updateMenuItem = async (id, updates) => {
  await updateDoc(doc(db, COL, id), updates)
}

export const deleteMenuItem = async (id) => {
  await deleteDoc(doc(db, COL, id))
}
