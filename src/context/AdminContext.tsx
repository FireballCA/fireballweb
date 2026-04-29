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

    async function check() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!mounted || !user) { setLoading(false); return }
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        if (!mounted) return
        setUserId(user.id)
        setIsAdmin(String(data?.role ?? '').trim().toLowerCase() === 'admin')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    check()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      check()
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
