import { useState, useEffect, useCallback } from 'react'

// Simple hash function for demo purposes (use bcrypt in production)
async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem('vaultnote:user') || null
  })
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

  const handleLogin = useCallback(async (username, password) => {
    const users = JSON.parse(localStorage.getItem('vaultnote:users') || '{}')
    const hashedPassword = await hashPassword(password)

    if (!users[username] || users[username].password !== hashedPassword) {
      throw new Error('Invalid username or password')
    }

    login(username)
  }, [login])

  const handleSignup = useCallback(async (username, email, password) => {
    const users = JSON.parse(localStorage.getItem('vaultnote:users') || '{}')

    if (users[username]) {
      throw new Error('Username already exists')
    }

    const hashedPassword = await hashPassword(password)
    users[username] = { email, password: hashedPassword }
    localStorage.setItem('vaultnote:users', JSON.stringify(users))

    login(username)
  }, [login])

  return {
    currentUser,
    isLoading,
    isAuthenticated: !!currentUser,
    login,
    logout,
    handleLogin,
    handleSignup
  }
}
