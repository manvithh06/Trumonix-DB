export default function Loader() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-brand-500/20"></div>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-500 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-brand-400/50 animate-spin" style={{animationDuration:'1.5s',animationDirection:'reverse'}}></div>
        </div>
        <p className="text-slate-500 font-mono text-sm tracking-widest">TRUMONIX</p>
      </div>
    </div>
  )
}
