import {
  collection,
  getDocs,
  setDoc,
  updateDoc,
  doc,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '../firebase/config'

const COL = 'tables'

export const TABLE_STATUS = {
  AVAILABLE: 'available',
  RESERVED:  'reserved',
  OCCUPIED:  'occupied',
}

// Canonical restaurant layout — mirrors the TABLES constant in useReservationStore.
// tableNumber is stored in Firestore so docs can be sorted without a composite index.
const TABLES_SEED = [
  { id: 'T1', tableNumber: 1, capacity: 2,  zone: 'Indoor'  },
  { id: 'T2', tableNumber: 2, capacity: 4,  zone: 'Indoor'  },
  { id: 'T3', tableNumber: 3, capacity: 6,  zone: 'Indoor'  },
  { id: 'T4', tableNumber: 4, capacity: 2,  zone: 'Window'  },
  { id: 'T5', tableNumber: 5, capacity: 4,  zone: 'Window'  },
  { id: 'T6', tableNumber: 6, capacity: 4,  zone: 'Outdoor' },
  { id: 'T7', tableNumber: 7, capacity: 8,  zone: 'Outdoor' },
  { id: 'T8', tableNumber: 8, capacity: 10, zone: 'Outdoor' },
]

/**
 * Seeds the `tables` Firestore collection with the canonical layout.
 *
 * Uses setDoc with { merge: true } so that existing `status` values are
 * preserved on subsequent calls — safe to invoke every time the staff
 * dashboard mounts without resetting live table states.
 */
export const initializeTables = async () => {
  const writes = TABLES_SEED.map(({ id, ...fields }) =>
    setDoc(doc(db, COL, id), fields, { merge: true })
  )
  await Promise.all(writes)
}

/** One-time fetch of all table documents, sorted by tableNumber. */
export const getTables = async () => {
  const snap = await getDocs(collection(db, COL))
  return snap.docs
    .map((d) => ({
      id: d.id,
      status: TABLE_STATUS.AVAILABLE,
      ...d.data(),
    }))
    .sort((a, b) => (a.tableNumber ?? 0) - (b.tableNumber ?? 0))
}

/** Writes a new status value for a single table document. */
export const updateTableStatus = async (tableId, status) => {
  await updateDoc(doc(db, COL, tableId), { status })
}

/**
 * Opens a real-time Firestore subscription on the tables collection.
 *
 * Fires `callback` immediately with the current snapshot, then again on
 * every subsequent write. Tables are sorted by tableNumber client-side to
 * avoid needing a Firestore composite index.
 *
 * @param {(tables: Array) => void} callback
 * @returns {() => void} unsubscribe — call inside useEffect cleanup
 */
export const subscribeTableUpdates = (callback) => {
  return onSnapshot(collection(db, COL), (snap) => {
    const tables = snap.docs
      .map((d) => ({
        id: d.id,
        status: TABLE_STATUS.AVAILABLE, // safe default for docs missing the field
        ...d.data(),
      }))
      .sort((a, b) => (a.tableNumber ?? 0) - (b.tableNumber ?? 0))
    callback(tables)
  })
}
