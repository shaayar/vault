import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  signUp as apiSignUp, 
  signIn as apiSignIn, 
  signOut as apiSignOut, 
  getCurrentUser,
  getUserProfile,
  updateUserProfile
} from '../api/supabase/authApi'

export function useSupabaseAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const session = await getCurrentUser()
        setUser(session?.user ?? null)
        
        if (session?.user) {
          const userProfile = await getUserProfile(session.user.id)
          setProfile(userProfile)
        }
      } catch (err) {
        console.error('Auth initialization error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          try {
            const userProfile = await getUserProfile(session.user.id)
            setProfile(userProfile)
          } catch (err) {
            console.error('Profile fetch error:', err)
            setProfile(null)
          }
        } else {
          setProfile(null)
        }
        
        setError('')
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password, username) => {
    setError('')
    try {
      const data = await apiSignUp(email, password, username)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const signIn = async (email, password) => {
    setError('')
    try {
      const data = await apiSignIn(email, password)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const signOut = async () => {
    setError('')
    try {
      await apiSignOut()
      setUser(null)
      setProfile(null)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const updateProfile = async (updates) => {
    if (!user) throw new Error('No user logged in')
    
    setError('')
    try {
      const updatedProfile = await updateUserProfile(user.id, updates)
      setProfile(updatedProfile)
      return updatedProfile
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const resetPassword = async (email) => {
    setError('')
    try {
      await supabase.auth.resetPasswordForEmail(email)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const updatePassword = async (newPassword) => {
    setError('')
    try {
      await supabase.auth.updateUser({
        password: newPassword
      })
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  // Check if user is authenticated
  const isAuthenticated = !!user

  // Get display name (username or email fallback)
  const displayName = profile?.username || user?.email || 'User'

  return {
    // State
    user,
    profile,
    loading,
    error,
    isAuthenticated,
    displayName,
    
    // Actions
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    updatePassword,
    
    // Utility
    clearError: () => setError('')
  }
}
