/**
 * Image compression and optimization utilities
 */

/**
 * Compress image file using canvas API
 * @param {File} file - Image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<File>} - Compressed file
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'image/jpeg'
  } = options

  // Skip compression for small files
  if (file.size < 100 * 1024) { // 100KB
    return file
  }

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob((blob) => {
        const compressedFile = new File([blob], file.name, {
          type: format,
          lastModified: Date.now()
        })
        resolve(compressedFile)
      }, format, quality)
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * Generate unique filename for uploaded images
 * @param {File} file - Original file
 * @returns {string} - Unique filename
 */
export function generateImageFilename(file) {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = file.name.split('.').pop().toLowerCase()
  return `img_${timestamp}_${random}.${extension}`
}

/**
 * Get image dimensions from file
 * @param {File} file - Image file
 * @returns {Promise<{width: number, height: number}>} - Image dimensions
 */
export function getImageDimensions(file) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Determine if file needs compression based on size and type
 * @param {File} file - Image file
 * @returns {boolean} - Whether compression is recommended
 */
export function shouldCompress(file) {
  // Only compress images larger than 100KB
  if (file.size < 100 * 1024) return false
  
  // Only compress common image formats
  const compressibleTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  return compressibleTypes.includes(file.type)
}
