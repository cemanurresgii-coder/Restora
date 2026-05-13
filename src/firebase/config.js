import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAHhFN_yOfcnmkb-W6Q75PnO3JpFn6FC1E",
  authDomain: "restora-app-dea0a.firebaseapp.com",
  projectId: "restora-app-dea0a",
  storageBucket: "restora-app-dea0a.firebasestorage.app",
  messagingSenderId: "1036469788129",
  appId: "1:1036469788129:web:f849232e7825920e6786a0",
  measurementId: "G-CR2VPVXXBL"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
