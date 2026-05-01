import { supabase } from '../../lib/supabase'
import { compressImage, shouldCompress } from '../../utils/imageUtils'

/**
 * Upload image to Supabase Storage.
 */
export async function uploadImage(file, vaultId) {
  try {
    if (!file) {
      throw new Error('No file provided')
    }

    // Compress image if needed
    let processedFile = file
    if (shouldCompress(file)) {
      processedFile = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8,
        format: file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split('.').pop().toLowerCase()
    const filename = `img_${timestamp}_${random}.${extension}`
    const filePath = `${vaultId}/${filename}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('vault-images')
      .upload(filePath, processedFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('vault-images')
      .getPublicUrl(filePath)

    // Store metadata in database
    const { data: imageRecord, error: dbError } = await supabase
      .from('images')
      .insert({
        vault_id: vaultId,
        filename,
        storage_path: filePath,
        size: processedFile.size,
        mime_type: processedFile.type
      })
      .select()
      .single()

    if (dbError) throw dbError

    return { url: publicUrl, record: imageRecord }
  } catch (error) {
    console.error('Failed to upload image:', error)
    throw error
  }
}

/**
 * Delete image from Supabase Storage and database.
 */
export async function deleteImage(imageUrl, vaultId) {
  try {
    // Extract filename from URL or storage path
    let filename
    if (imageUrl.includes('/')) {
      filename = imageUrl.split('/').pop()
    } else {
      filename = imageUrl
    }

    // Get image record to find storage path
    const { data: imageRecord, error: fetchError } = await supabase
      .from('images')
      .select('storage_path')
      .eq('vault_id', vaultId)
      .eq('filename', filename)
      .single()

    if (fetchError) throw fetchError

    // Delete from Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('vault-images')
      .remove([imageRecord.storage_path])

    if (storageError) throw storageError

    // Delete from database
    const { error: dbError } = await supabase
      .from('images')
      .delete()
      .eq('vault_id', vaultId)
      .eq('filename', filename)

    if (dbError) throw dbError

    return true
  } catch (error) {
    console.error('Failed to delete image:', error)
    return false
  }
}

/**
 * Get all images for a vault.
 */
export async function getVaultImages(vaultId) {
  try {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('vault_id', vaultId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Add public URLs to each image
    const imagesWithUrls = data.map(image => {
      const { data: { publicUrl } } = supabase.storage
        .from('vault-images')
        .getPublicUrl(image.storage_path)

      return {
        ...image,
        url: publicUrl
      }
    })

    return imagesWithUrls
  } catch (error) {
    console.error('Failed to load images:', error)
    throw error
  }
}

/**
 * Get image by filename.
 */
export async function getImage(vaultId, filename) {
  try {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('vault_id', vaultId)
      .eq('filename', filename)
      .single()

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('vault-images')
      .getPublicUrl(data.storage_path)

    return {
      ...data,
      url: publicUrl
    }
  } catch (error) {
    console.error('Failed to load image:', error)
    throw error
  }
}
