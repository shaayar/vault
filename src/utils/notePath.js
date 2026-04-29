export function encodeNotePath(notePath) {
  if (!notePath) return ''

  return notePath
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

export function decodeNotePath(encodedPath) {
  if (!encodedPath) return ''

  return encodedPath
    .split('/')
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment))
    .join('/')
}

function normalizeNoteLookupKey(value) {
  return String(value ?? '')
    .replace(/\.md$/i, '')
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
}

export function resolveCanonicalNotePath(noteIndex, requestedPath) {
  if (!requestedPath || !Array.isArray(noteIndex) || noteIndex.length === 0) {
    return requestedPath
  }

  const exactMatch = noteIndex.find((note) => note.path === requestedPath)
  if (exactMatch?.path) {
    return exactMatch.path
  }

  const requestedFolder = requestedPath.split('/').slice(0, -1).join('/')
  const requestedLeaf = requestedPath.split('/').pop() ?? ''
  const requestedKey = normalizeNoteLookupKey(requestedLeaf)

  if (!requestedKey) {
    return requestedPath
  }

  const canonicalMatch = noteIndex.find((note) => {
    if (!note?.path) return false

    const noteFolder = note.path.split('/').slice(0, -1).join('/')
    if (requestedFolder && noteFolder !== requestedFolder) {
      return false
    }

    const noteLeaf = note.path.split('/').pop() ?? ''
    return (
      normalizeNoteLookupKey(noteLeaf) === requestedKey
      || normalizeNoteLookupKey(note.title) === requestedKey
    )
  })

  return canonicalMatch?.path ?? requestedPath
}
