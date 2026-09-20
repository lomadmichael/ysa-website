import type { Metadata } from 'next';
import LiveEntryForm from '@/components/live/LiveEntryForm';
import { getState } from '@/lib/livedraw-db';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '유튜브 라이브 경품 응모 | 2026 코리아 오픈',
  description:
    '2026 대한서핑협회장배 코리아 오픈 롱보드 유튜브 생중계 경품 응모 페이지입니다.',
  robots: { index: false, follow: false },
};

export default async function LivePage() {
  // is_open 은 마감 시각까지 반영해 서버(DB)에서 판정한 값이다.
  const state = await getState();
  const prizes = state.prizes;
  const open = state.is_open;

  return (
    <main className="min-h-screen bg-sand py-10 md:py-16">
      <div className="mx-auto max-w-[560px] px-4">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal">KOREA OPEN LIVE</p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight text-ocean md:text-4xl">
          유튜브 생중계
          <br />
          경품 응모
        </h1>
        <p className="mt-4 leading-relaxed text-navy/70">
          2026 대한서핑협회장배 코리아 오픈 롱보드 오픈부 생중계를 보시는 분들께 경품을
          드립니다. 아래에 응모하시면 추첨에 참여됩니다.
        </p>

        <div className="mt-8">
          <LiveEntryForm isOpen={open} />
        </div>

        {prizes.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold text-ocean">경품</h2>
            <ul className="mt-4 space-y-3">
              {prizes.map((p) => (
                <li
                  key={p.code}
                  className="flex items-center justify-between gap-4 rounded-xl border border-navy/12 bg-white px-5 py-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-teal">{p.sponsor}</p>
                    <p className="mt-1 font-bold text-navy">{p.title}</p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-foam px-3 py-1 text-sm font-bold text-ocean">
                    {p.qty}명
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-navy/60">
              경품은 생중계 중 추첨해 화면으로 발표하고, 당첨되신 분께는 문자로 안내드립니다.
              협찬사가 추가되면 경품도 늘어납니다.
            </p>
          </section>
        )}

        <section className="mt-8 rounded-xl border border-teal/30 bg-teal/5 p-5">
          <p className="text-sm font-bold text-ocean">커넥트테이블 · 모든 분께 드리는 혜택</p>
          <p className="mt-2 text-sm leading-relaxed text-navy/70">
            대회 참가자와 관계자, 현장을 찾아 주신 분들께 식사 15% 할인을 드립니다. 추첨 없이
            누구나 받으실 수 있습니다. (강원 양양군 현남면 새나루길 43 1층)
          </p>
        </section>
      </div>
    </main>
  );
}
