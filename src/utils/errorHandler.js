/**
 * Centralized error handling utilities for API failures
 */

/**
 * Enhanced error class for API failures
 */
export class ApiError extends Error {
  constructor(message, statusCode = null, endpoint = null, originalError = null) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.endpoint = endpoint
    this.originalError = originalError
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage() {
    if (this.statusCode === 404) {
      return 'Resource not found. Please check if the vault or file exists.'
    }
    if (this.statusCode === 401) {
      return 'Authentication failed. Please check your permissions.'
    }
    if (this.statusCode === 403) {
      return 'Access denied. You don\'t have permission to perform this action.'
    }
    if (this.statusCode === 500) {
      return 'Server error. Please try again later.'
    }
    if (this.statusCode === 0) {
      return 'Network error. Please check your connection and try again.'
    }
    return this.message || 'An unexpected error occurred.'
  }

  /**
   * Get technical error details for debugging
   */
  getDetails() {
    return {
      message: this.message,
      statusCode: this.statusCode,
      endpoint: this.endpoint,
      originalError: this.originalError?.message,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Enhanced fetch with better error handling
 */
export async function safeFetch(url, options = {}) {
  try {
    const response = await fetch(url, {
      timeout: 10000, // 10 second timeout
      ...options
    })

    let payload
    try {
      payload = await response.json()
    } catch (jsonError) {
      throw new ApiError(
        'Invalid JSON response from server',
        response.status,
        url,
        jsonError
      )
    }

    if (!response.ok || !payload.success) {
      throw new ApiError(
        payload.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        url
      )
    }

    return payload
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    // Handle network errors, timeouts, etc.
    if (error.name === 'AbortError') {
      throw new ApiError('Request timeout. Please try again.', 0, url, error)
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new ApiError('Network error. Please check your connection.', 0, url, error)
    }

    throw new ApiError(
      error.message || 'Unexpected error occurred',
      null,
      url,
      error
    )
  }
}

/**
 * Retry mechanism for failed API calls
 */
export async function retryFetch(url, options = {}, maxRetries = 3, delay = 1000) {
  let lastError

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await safeFetch(url, options)
    } catch (error) {
      lastError = error

      // Don't retry on client errors (4xx)
      if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
        throw error
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        throw error
      }

      // Wait before retrying with exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  throw lastError
}

/**
 * Error logging utility
 */
export function logApiError(error, context = {}) {
  // Handle null or undefined errors
  if (!error) {
    const errorDetails = {
      message: 'Error object is null or undefined',
      statusCode: null,
      endpoint: null,
      originalError: 'No error details available',
      timestamp: new Date().toISOString(),
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    console.error('API Error - Null Error:', errorDetails)
    return
  }

  const errorDetails = {
    message: error.message || 'Unknown error',
    statusCode: error.statusCode || null,
    endpoint: error.endpoint || null,
    originalError: error.originalError?.message || error.message,
    timestamp: new Date().toISOString(),
    context,
    userAgent: navigator.userAgent,
    url: window.location.href
  }

  // If it's an ApiError instance, merge its details
  if (error.getDetails && typeof error.getDetails === 'function') {
    Object.assign(errorDetails, error.getDetails())
  }

  console.error('API Error:', errorDetails)

  // In production, you might want to send this to a logging service
  if (import.meta.env.PROD) {
    // Example: sendToErrorService(errorDetails)
  }
}

/**
 * Toast notification helper for user feedback
 */
export function showErrorToast(message, duration = 5000) {
  // Create a simple toast notification
  const toast = document.createElement('div')
  toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 max-w-sm'
  toast.textContent = message
  document.body.appendChild(toast)

  // Auto-remove after duration
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast)
    }
  }, duration)

  // Click to dismiss
  toast.addEventListener('click', () => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast)
    }
  })
}

/**
 * Show success toast
 */
export function showSuccessToast(message, duration = 3000) {
  const toast = document.createElement('div')
  toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 max-w-sm'
  toast.textContent = message
  document.body.appendChild(toast)

  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast)
    }
  }, duration)

  toast.addEventListener('click', () => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast)
    }
  })
}
