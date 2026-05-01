export function Footer() {
  return (
    <footer className="bg-primary-600 text-neutral-50 pt-32 pb-12 px-8 md:px-16 overflow-hidden relative">
      <div className="max-w-[1200px] mx-auto">
        {/* Top Section: Contact */}
        <div className="flex flex-col md:flex-row justify-end mb-12">
          <div className="text-right md:w-1/3">
            <p className="font-mono text-[11px] uppercase tracking-widest mb-4 opacity-80">Say Hello</p>
            <div className="flex items-center justify-end gap-4">
              <span className="h-px w-8 bg-neutral-50 opacity-50"></span>
              <a className="text-2xl md:text-3xl font-normal hover:opacity-70 transition-opacity" href="mailto:support@vaultnote.com">support@vaultnote.com</a>
            </div>
          </div>
        </div>
        {/* Middle Section: Massive Brand Name */}
        <div className="mb-16 md:mb-24">
          <h2 className="text-[15vw] leading-[0.8] font-bold tracking-tighter uppercase select-none opacity-90">
            VaultNote
          </h2>
        </div>
        {/* Bottom Section: Copyright & Links */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-t border-neutral-50/20 pt-8">
          <div className="font-mono text-[13px] opacity-80">
            © 2024 VaultNote Distribution.
          </div>
          <div className="flex flex-wrap justify-end gap-x-4 gap-y-2 font-mono text-[13px]">
            <a className="underline underline-offset-4 hover:opacity-70 cursor-pointer">Privacy</a>
            <span className="opacity-30">|</span>
            <a className="underline underline-offset-4 hover:opacity-70 cursor-pointer">Security</a>
            <span className="opacity-30">|</span>
            <a className="underline underline-offset-4 hover:opacity-70 cursor-pointer">Github</a>
            <span className="opacity-30">|</span>
            <a className="underline underline-offset-4 hover:opacity-70 cursor-pointer">Changelog</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
