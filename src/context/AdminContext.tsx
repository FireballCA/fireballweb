import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

interface AdminContextValue {
  isAdmin: boolean
  userId: string | null
  loading: boolean
}

const AdminContext = createContext<AdminContextValue>({ isAdmin: false, userId: null, loading: true })

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function checkRole(uid: string) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', uid)
          .maybeSingle()
        if (!mounted) return
        setUserId(uid)
        setIsAdmin(String(data?.role ?? '').trim().toLowerCase() === 'admin')
      } catch {
        if (mounted) setIsAdmin(false)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    // onAuthStateChange fires INITIAL_SESSION immediately — no need for a separate check() call.
    // This avoids the double DB query that happened on every page load when logged in.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      if (session?.user) {
        void checkRole(session.user.id)
      } else {
        setIsAdmin(false)
        setUserId(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AdminContext.Provider value={{ isAdmin, userId, loading }}>
      {children}
    </AdminContext.Provider>
  )
}

export const useAdmin = () => useContext(AdminContext)
