import { Terminal, Waypoints, CctvOff, Combine, Computer } from 'lucide-react'

export function Marquee() {
  return (
    <div className="py-12 border-y border-neutral-800 bg-neutral-950 overflow-hidden">
      <div className="flex gap-12 items-center animate-marquee">
        <span className="font-mono text-neutral-500 uppercase flex items-center gap-2 whitespace-nowrap">
          <CctvOff className="text-primary-500 w-4 h-4" /> E2E Encrypted
        </span>
        <span className="font-mono text-neutral-500 uppercase flex items-center gap-2 whitespace-nowrap">
          <Terminal className="text-primary-500 w-4 h-4" /> Markdown-Native
        </span>
        <span className="font-mono text-neutral-500 uppercase flex items-center gap-2 whitespace-nowrap">
          <Computer className="text-primary-500 w-4 h-4" /> Local-First
        </span>
        <span className="font-mono text-neutral-500 uppercase flex items-center gap-2 whitespace-nowrap">
          <Waypoints className="text-primary-500 w-4 h-4" /> Graph-Visualizer
        </span>
        <span className="font-mono text-neutral-500 uppercase flex items-center gap-2 whitespace-nowrap">
          <Combine className="text-primary-500 w-4 h-4" /> Offline-Sync
        </span>
        <span className="font-mono text-neutral-500 uppercase flex items-center gap-2 whitespace-nowrap">
          <CctvOff className="text-primary-500 w-4 h-4" /> E2E Encrypted
        </span>
        <span className="font-mono text-neutral-500 uppercase flex items-center gap-2 whitespace-nowrap">
          <Terminal className="text-primary-500 w-4 h-4" /> Markdown-Native
        </span>
        <span className="font-mono text-neutral-500 uppercase flex items-center gap-2 whitespace-nowrap">
          <Computer className="text-primary-500 w-4 h-4" /> Local-First
        </span>
      </div>
    </div>
  )
}
