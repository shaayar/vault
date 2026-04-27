/**
 * Image upload API functions
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

/**
 * Upload image to server with compression
 * @param {File} file - Image file to upload
 * @param {string} vaultName - Target vault
 * @returns {Promise<string>} - URL of uploaded image
 */
export async function uploadImage(file, vaultName) {
  const formData = new FormData()
  formData.append('image', file)
  formData.append('vault', vaultName)

  try {
    const response = await fetch(`${API_BASE}/vaults/${vaultName}/images/upload`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data.url
  } catch (error) {
    console.error('Image upload error:', error)
    throw error
  }
}

/**
 * Delete image from server
 * @param {string} imageUrl - URL of image to delete
 * @param {string} vaultName - Target vault
 * @returns {Promise<boolean>} - Success status
 */
export async function deleteImage(imageUrl, vaultName) {
  try {
    const filename = imageUrl.split('/').pop()
    const response = await fetch(`${API_BASE}/vaults/${vaultName}/images/${filename}`, {
      method: 'DELETE'
    })

    return response.ok
  } catch (error) {
    console.error('Image deletion error:', error)
    return false
  }
}
