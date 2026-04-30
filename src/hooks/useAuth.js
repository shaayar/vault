import { useState, useEffect, useCallback } from 'react'

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const user = localStorage.getItem('vaultnote:user')
    setCurrentUser(user)
    setIsLoading(false)
  }, [])

  const login = useCallback((username) => {
    localStorage.setItem('vaultnote:user', username)
    setCurrentUser(username)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('vaultnote:user')
    setCurrentUser(null)
  }, [])

  return {
    currentUser,
    isLoading,
    isAuthenticated: !!currentUser,
    login,
    logout
  }
}
