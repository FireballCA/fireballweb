import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { isAuthenticated } from '@/utils/supabaseAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const auth = await isAuthenticated()
      setAuthenticated(auth)
      setLoading(false)
    }
    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    )
  }

  if (!authenticated) {
    return <Navigate to="/account" replace />
  }

  return <>{children}</>
}
