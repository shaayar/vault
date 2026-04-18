/**
 * Extract all [[wiki link]] labels from markdown text.
 * @param {string} markdown
 * @returns {string[]}
 */
export function extractWikiLinkLabels(markdown) {
  if (!markdown || typeof markdown !== 'string') return []
  const labels = []
  const re = /\[\[([^\]]+)\]\]/g
  let m
  while ((m = re.exec(markdown)) !== null) {
    labels.push(String(m[1]).trim())
  }
  return labels
}

/**
 * Resolve a wiki link label to a note entry in the index (by title or file stem).
 * @param {{ path: string, title: string }[]} noteIndex
 * @param {string} label
 * @returns {{ path: string, title: string } | undefined}
 */
export function resolveWikiLinkToNote(noteIndex, label) {
  const requested = String(label).trim().toLowerCase()
  if (!requested) return undefined
  return noteIndex.find((note) => {
    const title = String(note.title ?? '').toLowerCase()
    const base = String(note.path ?? '')
      .split('/')
      .pop()
      ?.replace(/\.md$/i, '')
      .toLowerCase()
    return title === requested || base === requested
  })
}

/**
 * Notes that link to the active note (via [[title]] or [[stem]]).
 * @param {Array<{ path: string, title: string, content?: string }>} noteIndex
 * @param {string} activeNotePath
 * @returns {Array<{ path: string, title: string }>}
 */
export function findBacklinks(noteIndex, activeNotePath) {
  if (!activeNotePath || !Array.isArray(noteIndex)) return []
  const current = noteIndex.find((n) => n.path === activeNotePath)
  if (!current) return []

  const stem =
    activeNotePath
      .split('/')
      .pop()
      ?.replace(/\.md$/i, '')
      .trim()
      .toLowerCase() ?? ''
  const titleKey = String(current.title ?? '').trim().toLowerCase()
  const identifiers = new Set([titleKey, stem].filter(Boolean))

  const seen = new Set()
  /** @type {Array<{ path: string, title: string }>} */
  const out = []
  for (const n of noteIndex) {
    if (n.path === activeNotePath) continue
    const text = n.content ?? ''
    for (const label of extractWikiLinkLabels(text)) {
      const key = label.trim().toLowerCase()
      if (identifiers.has(key)) {
        if (!seen.has(n.path)) {
          seen.add(n.path)
          out.push({ path: n.path, title: n.title })
        }
        break
      }
    }
  }
  return out
}

/**
 * Build nodes and directed edges for a link graph from wiki links in note bodies.
 * @param {Array<{ path: string, title: string, content?: string }>} noteIndex
 * @returns {{ nodes: Array<{ id: string, label: string }>, links: Array<{ source: string, target: string }> }}
 */
export function buildWikiLinkGraph(noteIndex) {
  if (!Array.isArray(noteIndex)) return { nodes: [], links: [] }
  const nodes = noteIndex.map((n) => ({
    id: n.path,
    label: String(n.title ?? n.path.split('/').pop() ?? n.path),
  }))
  const linkSet = new Set()
  const links = []
  for (const n of noteIndex) {
    for (const label of extractWikiLinkLabels(n.content ?? '')) {
      const target = resolveWikiLinkToNote(noteIndex, label)
      if (!target || target.path === n.path) continue
      const key = `${n.path}->${target.path}`
      if (linkSet.has(key)) continue
      linkSet.add(key)
      links.push({ source: n.path, target: target.path })
    }
  }
  return { nodes, links }
}
