import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth, db } from '../services/firebase'
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null) // firebase user
  const [profile, setProfile] = useState(null) // /users doc
  const [community, setCommunity] = useState(null) // community doc
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setLoading(true)
      if (u) {
        setUser(u)
        // load /users/{uid}
        const userRef = doc(db, 'users', u.uid)
        const userSnap = await getDoc(userRef)
        if (userSnap.exists()) {
          setProfile(userSnap.data())
        } else {
          setProfile(null)
        }

        // find community where members contains uid
        const q = query(collection(db, 'communities'), where('members', 'array-contains', u.uid))
        const qSnap = await getDocs(q)
        if (!qSnap.empty) {
          const c = qSnap.docs[0]
          setCommunity({ id: c.id, ...c.data() })
        } else {
          setCommunity(null)
        }
      } else {
        setUser(null)
        setProfile(null)
        setCommunity(null)
      }
      setLoading(false)
    })

    return () => unsub()
  }, [])

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred
  }

  async function logout() {
    await signOut(auth)
    setUser(null)
    setProfile(null)
    setCommunity(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, community, loading, login, logout, setProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
