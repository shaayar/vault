import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function transformWikiLinks(markdown) {
  return markdown.replace(/\[\[([^\]]+)\]\]/g, (_match, noteName) => {
    const label = String(noteName).trim()
    return `[${label}](vaultnote://${encodeURIComponent(label)})`
  })
}

/**
 * Editor preview pane with markdown rendering and backlinks
 */
export function EditorPreview({ bodyContent, noteIndex, activeVault, openNote, isLight }) {
  const markdownWithInternalLinks = transformWikiLinks(bodyContent || '')

  return (
    <div className={`overflow-auto p-3 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
      <article
        className={`max-w-none prose ${isLight
          ? 'prose-slate'
          : 'prose-invert prose-headings:text-slate-100 prose-p:text-slate-200'
          }`}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => {
              if (!href?.startsWith('vaultnote://')) {
                return (
                  <a href={href} target="_blank" rel="noreferrer">
                    {children}
                  </a>
                )
              }

              const requested = decodeURIComponent(href.replace('vaultnote://', '')).toLowerCase()
              const match = noteIndex.find((note) => {
                const title = String(note.title ?? '').toLowerCase()
                const base = String(note.path ?? '')
                  .split('/')
                  .pop()
                  ?.replace(/\.md$/i, '')
                  .toLowerCase()
                return title === requested || base === requested
              })

              if (!match) {
                return <span className="text-rose-400">{children}</span>
              }

              return (
                <button
                  type="button"
                  className="cursor-pointer text-indigo-400 underline"
                  onClick={() => openNote(activeVault, match.path)}
                >
                  {children}
                </button>
              )
            },
            img: ({ src, alt }) => (
              <img
                src={src}
                alt={alt ?? ''}
                loading="lazy"
                className="max-w-full rounded-lg border border-slate-700/60 shadow-sm"
              />
            ),
          }}
        >
          {markdownWithInternalLinks || '*No content yet.*'}
        </ReactMarkdown>
      </article>
    </div>
  )
}
