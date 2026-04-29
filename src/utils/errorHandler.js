/**
 * Simplified error handling utilities for API failures
 */

/**
 * Simple fetch with error handling
 */
export async function safeFetch(url, options = {}) {
  try {
    const response = await fetch(url, options)

    let payload
    try {
      payload = await response.json()
    } catch {
      throw new Error('Invalid JSON response from server')
    }

    if (!response.ok || !payload.success) {
      throw new Error(payload.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return payload
  } catch (error) {
    if (error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection.')
    }
    throw error
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
      if (error.message.includes('HTTP 4')) {
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
  console.error('API Error:', {
    message: error.message || 'Unknown error',
    context,
    timestamp: new Date().toISOString()
  })
}

/**
 * Toast notification helper for user feedback
 */
export function showErrorToast(message, duration = 5000) {
  const toast = document.createElement('div')
  toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 max-w-sm'
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
