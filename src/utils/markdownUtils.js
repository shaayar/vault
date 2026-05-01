import yaml from 'js-yaml'

/**
 * Parse note content into frontmatter and markdown body.
 * Supports both --- and *** as delimiters.
 */

/**
 * Extract tags from under the first heading in markdown content.
 * Tags are identified as #tag patterns in the content immediately following the first H1 heading.
 * @param {string} content - The markdown content
 * @returns {Object} { tags: string[], cleanContent: string } - Extracted tags and content without tags
 */
export function extractTagsFromFirstHeading(content) {
  const lines = content.split('\n')
  let firstHeadingIndex = -1
  let tags = []
  let tagLinesStart = -1
  let tagLinesEnd = -1

  // Find the first H1 heading
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('# ')) {
      firstHeadingIndex = i
      break
    }
  }

  if (firstHeadingIndex === -1) {
    return { tags: [], cleanContent: content }
  }

  // Look for tags in the lines immediately following the first heading
  // Stop when we hit non-tag content (another heading, non-tag text, or empty line followed by non-tag)
  let foundNonTagContent = false
  for (let i = firstHeadingIndex + 1; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()

    // Stop if we hit another heading
    if (trimmedLine.startsWith('#')) {
      break
    }

    // Check if this line contains only tags (words starting with #)
    const tagMatches = trimmedLine.match(/#\w+/g)

    if (tagMatches && trimmedLine === tagMatches.join(' ')) {
      // This line contains only tags
      if (tagLinesStart === -1) {
        tagLinesStart = i
      }
      tagLinesEnd = i
      tags.push(...tagMatches.map(tag => tag.substring(1))) // Remove # prefix
    } else if (trimmedLine === '') {
      // Empty line - continue looking for tags
      continue
    } else {
      // Non-empty, non-tag line - stop looking for tags
      break
    }
  }

  // Remove duplicate tags and filter out empty strings
  tags = [...new Set(tags)].filter(tag => tag.length > 0)

  // If we found tag lines, remove them from the content
  let cleanContent = content
  if (tagLinesStart !== -1 && tagLinesEnd !== -1) {
    const beforeTags = lines.slice(0, tagLinesStart).join('\n')
    const afterTags = lines.slice(tagLinesEnd + 1).join('\n')

    // Preserve the heading and add appropriate spacing
    cleanContent = beforeTags + (afterTags ? '\n\n' + afterTags : '')
  }

  return { tags, cleanContent }
}

/**
 * Reconstruct content with tags added under the first heading.
 * @param {string} cleanContent - Content without tags
 * @param {string[]} tags - Tags to add back
 * @returns {string} - Content with tags under first heading
 */
export function reconstructContentWithTags(cleanContent, tags) {
  if (!tags || tags.length === 0) {
    return cleanContent
  }

  const lines = cleanContent.split('\n')
  let firstHeadingIndex = -1

  // Find the first H1 heading
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('# ')) {
      firstHeadingIndex = i
      break
    }
  }

  if (firstHeadingIndex === -1) {
    // No heading found, add one at the top with tags
    const tagLine = tags.map(tag => `#${tag}`).join(' ')
    return `# Untitled\n\n${tagLine}\n\n${cleanContent}`
  }

  // Insert tags after the first heading
  const tagLine = tags.map(tag => `#${tag}`).join(' ')
  lines.splice(firstHeadingIndex + 1, 0, '', tagLine)

  return lines.join('\n')
}
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
