import { useEffect, useMemo } from 'react'
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation } from 'd3-force'
import { buildWikiLinkGraph } from '../../utils/wikiLinks'

const WIDTH = 880
const HEIGHT = 520

/**
 * Modal with a simple force-directed graph of wiki links between notes.
 * @param {{ isOpen: boolean, onClose: () => void, noteIndex: Array<{ path: string, title: string, content?: string }>, openNote: (vault: string, path: string) => void, activeVault: string, isLight: boolean }} props
 */
export function GraphViewModal({ isOpen, onClose, noteIndex, openNote, activeVault, isLight }) {
  const { nodes: graphNodes, links: graphLinks } = useMemo(() => buildWikiLinkGraph(noteIndex), [noteIndex])

  const layout = useMemo(() => {
    if (!isOpen || graphNodes.length === 0) {
      return { nodes: [], links: [] }
    }

    const n = graphNodes.length
    const nodes = graphNodes.map((node, i) => {
      const angle = n > 0 ? (i / n) * 2 * Math.PI : 0
      return {
        ...node,
        x: WIDTH / 2 + Math.cos(angle) * 140,
        y: HEIGHT / 2 + Math.sin(angle) * 140,
      }
    })
    const idToNode = new Map(nodes.map((d) => [d.id, d]))
    const links = graphLinks
      .map((l) => {
        const s = idToNode.get(l.source)
        const t = idToNode.get(l.target)
        if (!s || !t) return null
        return { source: s, target: t }
      })
      .filter(Boolean)

    const sim = forceSimulation(nodes)
      .force('link', forceLink(links).distance(80).strength(0.35))
      .force('charge', forceManyBody().strength(-180))
      .force('center', forceCenter(WIDTH / 2, HEIGHT / 2))
      .force('collide', forceCollide().radius(28))

    for (let i = 0; i < 320; i += 1) sim.tick()
    sim.stop()

    return {
      nodes: nodes.map((d) => ({ id: d.id, label: d.label, x: d.x, y: d.y })),
      links: links.map((l) => ({
        x1: l.source.x,
        y1: l.source.y,
        x2: l.target.x,
        y2: l.target.y,
      })),
    }
  }, [isOpen, graphNodes, graphLinks])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const panel = isLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-slate-900 text-slate-100 border-slate-600'
  const dim = isLight ? 'bg-slate-900/40' : 'bg-black/60'

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${dim}`} role="dialog" aria-modal="true" aria-label="Note link graph">
      <div className={`max-h-[90vh] w-full max-w-[920px] overflow-hidden rounded-lg border shadow-xl ${panel}`}>
        <div className={`flex items-center border-b px-3 py-2 ${isLight ? 'border-slate-300' : 'border-slate-600'}`}>
          <h2 className="text-sm font-semibold">Graph</h2>
          <span className="ml-2 text-xs opacity-70">{graphNodes.length} notes · {graphLinks.length} links</span>
          <button
            type="button"
            className={`ml-auto rounded border px-2 py-1 text-xs ${isLight ? 'border-slate-300 hover:bg-slate-100' : 'border-slate-500 hover:bg-slate-800'}`}
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="overflow-auto p-2">
          {layout.nodes.length === 0 ? (
            <p className="p-4 text-sm opacity-70">No notes to graph. Open a vault with notes first.</p>
          ) : (
            <svg width={WIDTH} height={HEIGHT} className={isLight ? 'bg-slate-50' : 'bg-slate-950'}>
              {layout.links.map((l, i) => (
                <line
                  key={`e-${i}`}
                  x1={l.x1}
                  y1={l.y1}
                  x2={l.x2}
                  y2={l.y2}
                  stroke={isLight ? '#94a3b8' : '#475569'}
                  strokeWidth={1}
                />
              ))}
              {layout.nodes.map((n) => (
                <g key={n.id} transform={`translate(${n.x},${n.y})`}>
                  <circle
                    r={22}
                    fill={isLight ? '#e2e8f0' : '#334155'}
                    stroke={isLight ? '#64748b' : '#64748b'}
                    className="cursor-pointer hover:opacity-90"
                    onClick={() => {
                      openNote(activeVault, n.id)
                      onClose()
                    }}
                  />
                  <text
                    textAnchor="middle"
                    dy={4}
                    fontSize={10}
                    fill={isLight ? '#0f172a' : '#e2e8f0'}
                    className="pointer-events-none select-none"
                  >
                    {n.label.length > 14 ? `${n.label.slice(0, 12)}…` : n.label}
                  </text>
                </g>
              ))}
            </svg>
          )}
        </div>
      </div>
    </div>
  )
}
