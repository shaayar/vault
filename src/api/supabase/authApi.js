import { supabase } from '../../lib/supabase'
import { showSuccessToast } from '../../utils/errorHandler'

/**
 * Sign up a new user.
 */
export async function signUp(email, password, username) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    })

    if (error) throw error

    showSuccessToast('Account created successfully! Please check your email to verify.')
    return data
  } catch (error) {
    console.error('Failed to create account:', error)
    throw error
  }
}

/**
 * Sign in user.
 */
export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    showSuccessToast('Welcome back!')
    return data
  } catch (error) {
    console.error('Failed to sign in:', error)
    throw error
  }
}

/**
 * Sign out user.
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Failed to sign out:', error)
    throw error
  }
}

/**
 * Get current user session.
 */
export async function getCurrentUser() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error

    return session
  } catch (error) {
    console.error('Failed to get current user:', error)
    return null
  }
}

/**
 * Get user profile.
 */
export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Failed to get user profile:', error)
    throw error
  }
}

/**
 * Update user profile.
 */
export async function updateUserProfile(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Failed to update profile:', error)
    throw error
  }
}

/**
 * Reset password.
 */
export async function resetPassword(email) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error

    showSuccessToast('Password reset email sent!')
    return { success: true }
  } catch (error) {
    console.error('Failed to send reset email:', error)
    throw error
  }
}

/**
 * Update password.
 */
export async function updatePassword(newPassword) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error

    showSuccessToast('Password updated successfully')
    return { success: true }
  } catch (error) {
    console.error('Failed to update password:', error)
    throw error
  }
}

/**
 * Listen to auth state changes.
 */
export function onAuthStateChange(callback) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback)

  return subscription
}
