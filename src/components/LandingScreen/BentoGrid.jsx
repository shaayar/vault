import { Folder, Link2, Save, Search, Route, RouteIcon } from 'lucide-react'

export function BentoGrid() {
  return (
    <section className="py-24 px-6 max-w-[1200px] mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-semibold text-neutral-50 mb-4 uppercase tracking-tighter">Engineered for utility</h2>
        <p className="font-mono text-primary-500 uppercase tracking-[0.2em]">High information density by design</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 h-auto md:h-[600px]">
        {/* Vault-based organization */}
        <div className="md:col-span-2 md:row-span-1 bg-neutral-900 border border-neutral-800 p-8 flex flex-col justify-between group">
          <div>
            <Folder className="text-primary-500 mb-4" />
            <h3 className="text-2xl font-medium text-neutral-50 mb-2">Vault-based organization</h3>
            <p className="text-neutral-400">Independent silos for every project, encrypted with unique master keys.</p>
          </div>
          <div className="mt-8 flex gap-2 overflow-hidden">
            <div className="px-2 py-1 bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-500 uppercase">Work.vault</div>
            <div className="px-2 py-1 bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-500 uppercase">Personal.vault</div>
          </div>
        </div>
        {/* Wiki links */}
        <div className="md:col-span-1 md:row-span-1 bg-neutral-900 border border-neutral-800 p-6 flex flex-col justify-center text-center">
          <Link2 className="text-primary-500 mb-2" />
          <h3 className="font-mono text-neutral-50 mb-2">Wiki links</h3>
          <p className="text-neutral-400 text-sm">[[Note Connections]]</p>
        </div>
        {/* Graph visualization */}
        <div className="md:col-span-1 md:row-span-2 bg-neutral-900 border border-neutral-800 relative overflow-hidden group">
          <div className="p-6 relative z-10">
            <Route className="text-primary-500 mb-2" />
            <h3 className="text-2xl font-medium text-neutral-50 mb-2">Graph View</h3>
            <p className="text-neutral-400 text-sm">Real-time connection mapping.</p>
          </div>
          {/* Image background */}
          <div className="absolute inset-0 top-24 opacity-30 group-hover:opacity-60 transition-opacity">
            <div className="w-full h-full bg-linear-to-br from-primary-900/20 to-secondary-900/20 flex items-center justify-center">
              <RouteIcon className="w-32 h-32 text-primary-500/30" />
            </div>
          </div>
        </div>
        {/* Auto-save */}
        <div className="md:col-span-1 md:row-span-1 bg-neutral-900 border border-neutral-800 p-6 flex flex-col items-center justify-center text-center">
          <Save className="text-green-500 mb-2" />
          <span className="font-mono text-neutral-50">Auto-save</span>
          <span className="text-[10px] text-green-500 font-mono mt-1 uppercase">Ready: v1.0.4</span>
        </div>
        {/* Full-text search */}
        <div className="md:col-span-2 md:row-span-1 bg-neutral-900 border border-neutral-800 p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-medium text-neutral-50 mb-2">Full-text search</h3>
            <p className="text-neutral-400">Blazing fast indexing of 100k+ notes. Search titles, tags, and content instantly.</p>
          </div>
          <div className="bg-neutral-950 border border-neutral-800 p-3 flex items-center gap-2">
            <Search className="text-neutral-500 text-sm" />
            <span className="text-neutral-500 font-mono text-sm">grep -r "encryption" ./vault</span>
          </div>
        </div>
      </div>
    </section>
  )
}
