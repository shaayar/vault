import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Testimonials() {
  return (
    <section className="py-24 px-6 max-w-[1200px] mx-auto overflow-hidden">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-4xl font-semibold text-neutral-50 mb-2">Used by builders</h2>
          <p className="text-neutral-400">Engineers, architects, and detail-oriented thinkers.</p>
        </div>
        <div className="flex gap-2">
          <button className="w-10 h-10 border border-neutral-800 flex items-center justify-center text-neutral-50 hover:bg-neutral-900 transition-colors">
            <ChevronLeft />
          </button>
          <button className="w-10 h-10 border border-neutral-800 flex items-center justify-center text-neutral-50 hover:bg-neutral-900 transition-colors">
            <ChevronRight />
          </button>
        </div>
      </div>
      <div className="flex gap-6 pb-8 overflow-x-auto no-scrollbar">
        {/* Card 1 */}
        <div className="min-w-[350px] bg-neutral-900 border border-neutral-800 p-8 flex flex-col justify-between">
          <p className="text-neutral-50 mb-8 italic">"The local-first approach is a game changer. I no longer worry about server outages or privacy leaks. It's the Obsidian successor I've been waiting for."</p>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center font-bold text-neutral-50">JD</div>
            <div>
              <p className="text-neutral-50 font-mono">@jdev_99</p>
              <p className="text-neutral-500 text-xs">Senior Systems Engineer</p>
            </div>
          </div>
        </div>
        {/* Card 2 */}
        <div className="min-w-[350px] bg-neutral-900 border border-neutral-800 p-8 flex flex-col justify-between">
          <p className="text-neutral-50 mb-8 italic">"Terminal-grade encryption. Period. If you care about your intellectual property, there is no other choice."</p>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary-800 rounded-lg flex items-center justify-center font-bold text-neutral-50">SK</div>
            <div>
              <p className="text-neutral-50 font-mono">@sarah_codes</p>
              <p className="text-neutral-500 text-xs">CTO at Stealth AI</p>
            </div>
          </div>
        </div>
        {/* Card 3 */}
        <div className="min-w-[350px] bg-neutral-900 border border-neutral-800 p-8 flex flex-col justify-between">
          <p className="text-neutral-50 mb-8 italic">"The graph visualization actually helps me find connections between my research papers that I otherwise missed. Pure utility."</p>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-neutral-700 rounded-lg flex items-center justify-center font-bold text-neutral-50">MR</div>
            <div>
              <p className="text-neutral-50 font-mono">@m_rossi</p>
              <p className="text-neutral-500 text-xs">PhD Researcher</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
