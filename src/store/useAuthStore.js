import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

export const ROLES = {
  CUSTOMER: 'customer',
  STAFF: 'staff',
  MANAGER: 'manager',
}

const friendlyError = (code) => {
  const map = {
    'auth/invalid-credential':     'E-posta veya şifre hatalı.',
    'auth/user-not-found':         'Bu e-posta ile kayıtlı kullanıcı bulunamadı.',
    'auth/wrong-password':         'Şifre hatalı. Lütfen tekrar deneyin.',
    'auth/email-already-in-use':   'Bu e-posta zaten kayıtlı.',
    'auth/weak-password':          'Şifre en az 6 karakter olmalıdır.',
    'auth/invalid-email':          'Geçersiz e-posta adresi.',
    'auth/too-many-requests':      'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.',
    'auth/network-request-failed': 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.',
  }
  return map[code] ?? 'Bir hata oluştu. Lütfen tekrar deneyin.'
}

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      role: null,
      loading: false,
      error: null,

      login: async (email, password) => {
        set({ loading: true, error: null })
        try {
          const { user } = await signInWithEmailAndPassword(auth, email, password)
          const snap = await getDoc(doc(db, 'users', user.uid))
          const role = snap.exists() ? snap.data().role : ROLES.CUSTOMER
          set({ user: { uid: user.uid, email: user.email }, role, loading: false })
        } catch (err) {
          set({ error: friendlyError(err.code), loading: false })
        }
      },

      register: async (email, password) => {
        set({ loading: true, error: null })
        try {
          const { user } = await createUserWithEmailAndPassword(auth, email, password)
          await setDoc(doc(db, 'users', user.uid), { email: user.email, role: ROLES.CUSTOMER })
          set({ user: { uid: user.uid, email: user.email }, role: ROLES.CUSTOMER, loading: false })
        } catch (err) {
          set({ error: friendlyError(err.code), loading: false })
        }
      },

      logout: async () => {
        await signOut(auth)
        set({ user: null, role: null, error: null })
      },

      resetPassword: async (email) => {
        set({ loading: true, error: null })
        try {
          await sendPasswordResetEmail(auth, email)
          set({ loading: false })
          return true
        } catch (err) {
          set({ error: friendlyError(err.code), loading: false })
          return false
        }
      },

      setUserFromAuth: (user, role) => set({ user, role }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, role: state.role }),
    }
  )
)

export const initAuthListener = () => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
      const role = snap.exists() ? snap.data().role : ROLES.CUSTOMER
      useAuthStore.getState().setUserFromAuth(
        { uid: firebaseUser.uid, email: firebaseUser.email },
        role
      )
    } else {
      useAuthStore.getState().setUserFromAuth(null, null)
    }
  })
}

export default useAuthStore
