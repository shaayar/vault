import yaml from 'js-yaml'

/**
 * Parse note content into frontmatter and markdown body.
 */
export function parseFrontmatter(content) {
  const pattern = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/
  const match = content.match(pattern)

  if (!match) {
    return {
      frontmatter: {},
      body: content,
    }
  }

  try {
    return {
      frontmatter: yaml.load(match[1]) ?? {},
      body: match[2] ?? '',
    }
  } catch {
    return {
      frontmatter: {},
      body: content,
    }
  }
}
