export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#080808] overflow-hidden">

      {/* Ambient glow layers */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#0054F9]/10 blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[#00D9FF]/8 blur-[80px] animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,84,249,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(0,84,249,0.8) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Content */}
      <div className="relative flex flex-col items-center gap-8">

        {/* Logo mark with rings */}
        <div className="relative flex items-center justify-center">
          {/* Outer pulse ring */}
          <div className="absolute w-28 h-28 rounded-full border border-[#0054F9]/20 animate-ping" style={{ animationDuration: '2s' }} />
          {/* Middle ring */}
          <div className="absolute w-20 h-20 rounded-full border border-[#0054F9]/30" />
          {/* Logo container */}
          <div className="relative w-14 h-14 rounded-2xl bg-[#0054F9]/10 border border-[#0054F9]/30 flex items-center justify-center backdrop-blur-sm shadow-[0_0_40px_rgba(0,84,249,0.3)]">
            {/* Ape silhouette / icon */}
            <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="20" r="11" stroke="#0054F9" strokeWidth="2" />
              <circle cx="13" cy="18" r="4" stroke="#0054F9" strokeWidth="1.5" />
              <circle cx="35" cy="18" r="4" stroke="#0054F9" strokeWidth="1.5" />
              <path d="M14 32c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="#00D9FF" strokeWidth="2" strokeLinecap="round" />
              <circle cx="20" cy="20" r="1.5" fill="#0054F9" />
              <circle cx="28" cy="20" r="1.5" fill="#0054F9" />
              <path d="M21 24c.8.7 2 1.1 3 1.1s2.2-.4 3-1.1" stroke="#0054F9" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Brand name */}
        <div className="flex flex-col items-center gap-1.5">
          <span
            className="text-2xl font-black tracking-tight bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg, #0054F9, #00D9FF)' }}
          >
            Apes On Ape
          </span>
          <span className="text-xs tracking-[0.3em] uppercase text-white/25 font-medium">
            ApeChain&apos;s OG Collection
          </span>
        </div>

        {/* Segmented progress bar */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full bg-[#0054F9]"
              style={{
                width: i === 2 ? '2rem' : '0.75rem',
                opacity: 0.9,
                animation: `loadPulse 1.2s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>

      </div>

      {/* Bottom watermark */}
      <div className="absolute bottom-8 text-[10px] tracking-[0.2em] uppercase text-white/15 font-medium">
        Built on ApeChain
      </div>

      <style>{`
        @keyframes loadPulse {
          0%, 100% { opacity: 0.2; transform: scaleY(1); }
          50%       { opacity: 1;   transform: scaleY(1.6); }
        }
      `}</style>
    </div>
  );
}
