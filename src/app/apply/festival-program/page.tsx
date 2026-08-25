import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import FestivalProgramForm from '@/components/apply/festival-program/FestivalProgramForm';
import { EVENT, INQUIRY_TEL, PROGRAMS, onsiteSeats } from '@/lib/festprog-config';
import { getAvailability, type FestprogAvailability } from '@/lib/festprog-db';

/**
 * 2026 양양서핑페스티벌 현장 프로그램(해변 바레 · 해변 하이록스) 온라인 사전신청.
 *
 * 잔여현황은 매 요청마다 최신이어야 하므로 캐시하지 않는다.
 * 홍보용으로 검색 노출되어야 하는 페이지이므로 noindex 하지 않는다.
 */
export const dynamic = 'force-dynamic';

const DESCRIPTION = `${EVENT.dateLabel} ${EVENT.place} · 해변 바레(오후 1시) · 해변 하이록스(오후 3시) 온라인 사전신청. 참가비 무료, 회원가입 없이 신청할 수 있습니다.`;

export const metadata: Metadata = {
  title: '페스티벌 현장 프로그램 신청 (해변 바레 · 하이록스)',
  description: DESCRIPTION,
  alternates: { canonical: 'https://ysakorea.com/apply/festival-program' },
  openGraph: {
    title: '2026 양양서핑페스티벌 현장 프로그램 신청',
    description: DESCRIPTION,
    url: 'https://ysakorea.com/apply/festival-program',
    type: 'website',
  },
};

/**
 * getAvailability 실패 시 안전 폴백 — open:false 로 두어 접수를 열지 않는다.
 * DB 를 못 읽는 상황에서 "신청 가능"이라고 약속하면 안 된다.
 */
const FALLBACK: FestprogAvailability = {
  open: false,
  barre: { capacity: PROGRAMS[0].onlineSeats, confirmed: 0, waitlist: 0 },
  hyrox: { capacity: PROGRAMS[1].onlineSeats, confirmed: 0, waitlist: 0 },
};

export default async function FestivalProgramApplyPage() {
  let availability = FALLBACK;
  try {
    availability = await getAvailability();
  } catch (e) {
    console.error('[festprog] availability fetch failed:', e);
  }

  return (
    <>
      <PageHeader
        title="페스티벌 현장 프로그램 신청"
        description={`${EVENT.dateLabel} ${EVENT.place} — 해변 바레 · 해변 하이록스 온라인 사전신청. 참가비 무료.`}
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '온라인 접수', href: '/apply' },
          { label: '페스티벌 현장 프로그램' },
        ]}
      />

      {/* 프로그램 안내 */}
      <section className="border-b border-foam bg-white py-12 md:py-16">
        <div className="mx-auto max-w-3xl px-4">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-teal">
            FESTIVAL · 8/29 SAT
          </p>
          <h2 className="mb-4 text-2xl font-bold text-navy">
            죽도해변에서 즐기는 두 가지 무료 프로그램
          </h2>
          <p className="leading-relaxed text-navy/70">
            2026 양양서핑페스티벌 현장에서 진행하는 참여 프로그램입니다. 서핑을 하지 않아도 누구나
            참여할 수 있으며 참가비는 무료입니다. 각 프로그램 정원의 일부는 당일 현장 접수를 위해
            남겨 두므로, 사전신청이 마감되어도 현장에서 참여하실 수 있습니다.
          </p>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            {PROGRAMS.map((p) => (
              <div key={p.key} className="rounded-2xl border border-foam bg-foam/20 p-5">
                <dt className="flex items-center gap-2 text-[15px] font-bold text-navy">
                  <span aria-hidden="true">{p.emoji}</span>
                  {p.label}
                </dt>
                <dd className="mt-2 space-y-1 text-sm text-navy/65">
                  <p className="font-semibold text-ocean">
                    {EVENT.dateLabel} {p.time} · {EVENT.place}
                  </p>
                  <p className="leading-relaxed">{p.desc}</p>
                  <p className="pt-1 text-xs leading-relaxed text-navy/50">
                    정원 {p.totalSeats}명 = 온라인 {p.onlineSeats}명 + 현장 {onsiteSeats(p.key)}
                    명(당일 선착순)
                  </p>
                </dd>
              </div>
            ))}
          </dl>

          <ul className="mt-8 space-y-2 border-t border-foam pt-6 text-sm leading-relaxed text-navy/65">
            <li>· 한 분당 한 종목만 신청할 수 있습니다. (두 프로그램 중복 신청 불가)</li>
            <li>· 정원 초과 시 대기자로 등록되며, 취소 발생 시 접수 순서대로 자동 확정됩니다.</li>
            <li>· 편한 운동복과 물·수건을 준비해 주세요. 우천·기상 악화 시 취소될 수 있습니다.</li>
            <li>
              · 신청 내용 변경은 지원하지 않습니다.{' '}
              <Link
                href="/apply/festival-program/my"
                className="font-semibold text-navy underline underline-offset-2"
              >
                신청 조회
              </Link>
              에서 취소 후 다시 신청해 주세요.
            </li>
            <li>· 문의 {INQUIRY_TEL}</li>
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <FestivalProgramForm availability={availability} />
      </section>
    </>
  );
}
