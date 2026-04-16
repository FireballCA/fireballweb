import { useEffect } from 'react'

export function usePageTitle(title: string) {
  useEffect(() => {
    if (typeof document === 'undefined') return
    const previous = document.title
    document.title = title
    return () => {
      document.title = previous
    }
  }, [title])
}

