import CompetitionInfoCard, { type InfoRow } from './CompetitionInfoCard';
import CompetitionDocs, { type RuleDoc } from './CompetitionDocs';
import BracketLineup from './BracketLineup';
import HeatSchedule from './HeatSchedule';
import { BEGINNER_LIVE_URL, type LineupDivisionsResponse } from '@/lib/lineup-api';

/**
 * 비기너 대회 탭.
 *
 * 접수는 8/14 로 이미 마감됐다 — 접수 문구·CTA 를 두지 않고
 * 참가자가 지금 필요한 것(본인 히트·이름·운영 방식)만 보여준다.
 */

const BEGINNER_ROWS: InfoRow[] = [
  { label: '장소', value: '죽도해변' },
  {
    label: '대회일',
    value: '8월 29일(토) ~ 30일(일)',
    note: '※ 기상 상황에 따라 9월 첫째주로 변경 가능',
  },
  { label: '종목', value: '남자부 67명 · 여자부 54명 (접수 확정 인원)' },
  {
    label: '참가대상',
    value: '2023년 이후 입문자 (국내외 대회 입상자 제외)',
  },
  {
    label: '진행 방식',
    value: '최대 6인 1조 히트 · 히트별 과반수 상위 라운드 진출 · 히트당 15분',
  },
  {
    label: '심사',
    value:
      '롱 라이딩 초 시간 — 테이크오프부터 라이딩 종료까지 초 수로 채점 (매뉴버 가산점 없음)',
    note: '전원 동일 9.2ft 소프트보드 제공, 왁스 칠 가능',
  },
  { label: '참가비', value: '5만원' },
  {
    label: '시상',
    // 2026-08-14 상금 상향 (형님 확정)
    value: '1위 100만원 · 2위 50만원 · 3위 30만원',
    note: '남자부 · 여자부 각각 시상',
  },
  { label: '참가 굿즈', value: '모자 · 티셔츠 등' },
];

const RULE_GROUPS: { title: string; items: string[] }[] = [
  {
    title: '경기 운영',
    items: [
      '최대 6인 1조 히트 · 히트당 15분',
      '웨이브 카운트 6개',
      '논 프라이어리티 (파도 우선권 없음)',
      '그린웨이브 · 화이트워시 모두 인정',
      '밀어타기 금지',
    ],
  },
  {
    title: '심사',
    items: [
      '롱 라이딩 초 시간 — 테이크오프부터 라이딩 종료까지 초 수로 채점',
      '매뉴버 가산점 없음',
      '반칙 시 두 번째 라이딩 시간 절반 합산',
    ],
  },
  {
    title: '깃발 신호',
    items: ['초록 = 경기 시작', '노랑 = 종료 5분 전', '빨강 = 경기 종료'],
  },
];

export default function BeginnerPanel({
  lineup,
  docs,
}: {
  lineup: LineupDivisionsResponse | null;
  docs: { rulebook: RuleDoc | null; objection: RuleDoc | null };
}) {
  const divisions = lineup?.divisions ?? [];

  return (
    <section className="py-14 md:py-20">
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-teal">BEGINNER</p>
          <h2 className="mb-4 text-2xl font-bold text-navy md:text-3xl">비기너 서핑대회</h2>
          <p className="leading-relaxed text-navy/70">
            서핑에 막 입문한 서퍼들을 위한 무대입니다. 8월 말 죽도해변에서 남자부 · 여자부로 나뉘어
            열립니다. 아래에서 본인이 배정된 히트를 확인해 주세요.
          </p>
        </div>

        <CompetitionInfoCard
          icon="🌊"
          title="비기너 서핑대회"
          subtitle="서핑에 막 입문한 서퍼들을 위한 무대"
          badge="접수 마감 · 대진표 발표"
          badgeClass="text-ocean bg-ocean/10"
          accentClass="bg-ocean/10 text-ocean"
          rows={BEGINNER_ROWS}
        />

        {/* 히트별 시간표·경기 장소 — 대회 직전엔 "언제 어디서"가 가장 급하다 */}
        {divisions.length > 0 && (
          <HeatSchedule divisions={divisions} liveUrl={BEGINNER_LIVE_URL} />
        )}

        {/* 대진표 */}
        <div className="mt-8 rounded-2xl border border-foam bg-white p-6 md:p-8">
          <div className="mb-6">
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-teal">LINEUP</p>
            <h3 className="text-lg font-bold text-navy md:text-xl">1라운드 대진표</h3>
          </div>

          {divisions.length > 0 ? (
            <BracketLineup divisions={divisions} liveUrl={BEGINNER_LIVE_URL} />
          ) : (
            // 라인업 API 가 죽어도 페이지는 살아 있어야 한다 — 라이브 페이지로 안내
            <div className="rounded-xl bg-sand px-5 py-6">
              <p className="text-sm leading-relaxed text-navy/60">
                대진표를 불러오지 못했습니다. 라이브 페이지에서 확인해 주세요.
              </p>
              <a
                href={BEGINNER_LIVE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-ocean px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ocean/90"
              >
                실시간 대진표·경기 결과 보기
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                  />
                </svg>
              </a>
            </div>
          )}
        </div>

        {/* 운영 방식·심사 기준 요약 */}
        <div className="mt-8 rounded-2xl border border-foam bg-white p-6 md:p-8">
          <h3 className="text-lg font-bold text-navy md:text-xl">운영 방식 · 심사 기준</h3>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {RULE_GROUPS.map((group) => (
              <div key={group.title}>
                <h4 className="mb-3 text-sm font-bold text-navy">{group.title}</h4>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-relaxed text-navy/70">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-teal" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <CompetitionDocs rulebook={docs.rulebook} objection={docs.objection} />
        </div>
      </div>
    </section>
  );
}
