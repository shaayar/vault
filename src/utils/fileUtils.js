/**
 * Sanitize user-provided vault, folder, and note names.
 */
export function sanitizeName(value) {
  return value
    .replace(/[^\p{L}0-9_.\-\s()]/gu, '') // allow unicode letters
    .replace(/\s+/g, ' ')                // normalize spaces
    .replace(/\.+/g, '.')               // collapse dots
    .replace(/^\.+/, '')                // no leading dots
    .trim() || 'untitled'
}

/**
 * Produce a filesystem-safe note/folder segment from user input.
 */
export function toSafePathSegment(value) {
  return sanitizeName(String(value ?? ''))
}

/**
 * Normalize path separators for note paths.
 */
export function normalizePath(pathValue) {
  return pathValue.replace(/\\/g, '/').replace(/\/+/g, '/').trim()
}
