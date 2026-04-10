import { FESTIVAL_STATS } from '@/lib/festival-data';

export default function FestivalStats() {
  return (
    <section className="py-20 md:py-28" style={{ backgroundColor: '#393d7d' }}>
      <div className="max-w-[1200px] mx-auto px-4">
        <p className="text-center text-xs font-mono tracking-[0.4em] uppercase text-white/50 mb-12">
          BY THE NUMBERS
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-6">
          {FESTIVAL_STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-5xl md:text-6xl font-extrabold text-sunset mb-2 font-mono">
                {stat.value}
              </p>
              <p className="text-[11px] md:text-xs font-bold tracking-[0.25em] uppercase text-white/80 mb-1">
                {stat.label}
              </p>
              <p className="text-xs md:text-sm text-white/40">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
