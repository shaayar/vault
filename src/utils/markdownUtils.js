import yaml from 'js-yaml'

/**
 * Parse note content into frontmatter and markdown body.
 * Supports both --- and *** as delimiters.
 */
export function parseFrontmatter(content) {
  // Try --- delimiter first
  let pattern = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/
  let match = content.match(pattern)
  let delimiter = '---'

  // If no match, try *** delimiter
  if (!match) {
    pattern = /^\*\*\*\n([\s\S]*?)\n\*\*\*\n?([\s\S]*)$/
    match = content.match(pattern)
    delimiter = '***'
  }

  if (!match) {
    return {
      frontmatter: {},
      body: content,
      delimiter: '---',
    }
  }

  try {
    return {
      frontmatter: yaml.load(match[1]) ?? {},
      body: match[2] ?? '',
      delimiter,
    }
  } catch {
    return {
      frontmatter: {},
      body: content,
      delimiter: '---',
    }
  }
}
