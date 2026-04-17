/**
 * Sanitize user-provided vault, folder, and note names.
 */
export function sanitizeName(value) {
  return value.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim()
}

/**
 * Normalize path separators for note paths.
 */
export function normalizePath(pathValue) {
  return pathValue.replace(/\\/g, '/').replace(/\/+/g, '/').trim()
}
