import type { Metadata } from 'next';
import Link from 'next/link';
import { getImageProps } from 'next/image';
import { BreadcrumbJsonLd } from '@/components/shared/JsonLd';
import AlohaHeats, { hasHeats } from '@/components/comp/AlohaHeats';
import {
  ALOHA_TEAM,
  ALOHA_TEAM_ENTRY_WINDOW,
  ALOHA_TEAM_SLUG,
} from '@/components/apply/aloha-team';
import { LINEUP_BASE_URL, fetchLineupDivisions } from '@/lib/lineup-api';
import heroPc from '../../../../public/images/aloha/aloha-hero-pc.jpg';
import heroMobile from '../../../../public/images/aloha/aloha-hero-mobile.jpg';

/**
 * 알로하 팀 챌린지 대회 안내 페이지 — `/comp/aloha-team`.
 *
 * 현수막·포스터 QR 이 이 주소로 연결된다(인쇄 후 바꿀 수 없으니 주소를 옮기지 말 것).
 * 접수(/apply/aloha-team)와 달리 대회 전 과정의 "안내 허브"다:
 * 대회 안내 → 경기 방식 → 스케줄 → 대진표 → 실시간 결과.
 *
 * 대진표·히트 시각은 lineup 공개 API 에서 60초 캐시로 가져온다.
 * lineup 이 죽어도 페이지는 떠야 하므로 대진이 없으면 안내 문구로 대체한다.
 */

const LIVE_URL = `${LINEUP_BASE_URL}/live/${ALOHA_TEAM_SLUG}`;
const PAGE_TITLE = '2026 양양군의장배 알로하 팀 챌린지 전국서핑대회';
const PAGE_DESCRIPTION =
  '10월 9일(금) 양양 죽도해변. 남2·여2 혼성 4인 팀이 릴레이로 8번 파도를 타고, 라이딩 시간을 모두 더해 겨루는 팀 서핑대회. 경기 방식·스케줄·대진표·실시간 결과를 확인하세요.';
const OG_IMAGE = {
  url: '/images/aloha/aloha-og.jpg',
  width: 1200,
  height: 630,
  alt: '2026 양양군의장배 전국서핑대회 · ALOHA TEAM CHALLENGE',
};

export const metadata: Metadata = {
  title: '알로하 팀 챌린지',
  description: PAGE_DESCRIPTION,
  alternates: { canonical: 'https://ysakorea.com/comp/aloha-team' },
  openGraph: {
    type: 'website',
    url: '/comp/aloha-team',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

// 대진·히트 상태가 대회 당일 바뀌므로 짧게
export const revalidate = 60;

const SECTIONS = [
  { id: 'info', label: '대회 안내' },
  { id: 'format', label: '경기 방식' },
  { id: 'schedule', label: '스케줄' },
  { id: 'draw', label: '대진표' },
  { id: 'live', label: '실시간 결과' },
] as const;

const INFO_ROWS: { label: string; value: string; note?: string }[] = [
  { label: '일시', value: '2026년 10월 9일(금 · 한글날)' },
  { label: '장소', value: '양양 죽도해변', note: '해양종합레포츠센터 앞' },
  { label: '모집', value: '32팀 128명', note: '혼성 4인 1팀 (남 2 · 여 2) · 선착순' },
  { label: '참가 대상', value: '제한 없음', note: '동호회 · 서핑샵 · 친구 · 가족 누구나' },
  { label: '참가비', value: '팀당 100,000원', note: '참가 굿즈 제공' },
  { label: '접수', value: ALOHA_TEAM.entryPeriodLabel },
  { label: '시상', value: '1위 100만원 · 2위 50만원 · 3위 30만원', note: '트로피 수여' },
  { label: '보드', value: '9피트 스펀지 롱보드 대회 측 제공', note: '개인 보드 사용 불가' },
];

const RELAY_STEPS = [
  { t: '시작 사이렌! 1번 선수 출발', s: '사이렌 1회 · 녹색 깃발' },
  { t: '파도 2번 라이딩', s: '한 번 탈 때마다 시간이 기록됩니다' },
  { t: '해변으로 달려서 복귀', s: '보드는 물가를 지나서 내려놓기' },
  { t: '다음 선수와 손 터치!', s: '터치해야 다음 선수가 출발할 수 있습니다' },
];

const SAMPLE = [
  { who: '1번 선수', a: '12.40', b: '8.15', sum: '20.55' },
  { who: '2번 선수', a: '9.80', b: '15.20', sum: '25.00' },
  { who: '3번 선수', a: '6.35', b: '11.05', sum: '17.40' },
  { who: '4번 선수', a: '14.10', b: '0.00', sum: '14.10' },
];

const RULES: { rule: string; result: string; dq?: boolean }[] = [
  { rule: '손 터치 전에 출발', result: '해당 선수 기록 무효' },
  { rule: '제출한 출전 순서와 다르게 출전', result: '해당 선수 기록 무효' },
  { rule: '한 명이 3번 이상 라이딩', result: '초과분 무효' },
  { rule: '다른 선수 라이딩 방해', result: '해당 라이딩 0초' },
  { rule: '시작 신호 전 라이딩', result: '실격', dq: true },
  { rule: '본인 히트 불참', result: '실격', dq: true },
];

// 2026-10-08 팀 패들링 전환 타임테이블(최종 xls) 기준 — 히트 10분 · 히트 사이 5분.
// 히트별 시각은 라인업 API(heats.scheduled_at)가 대진표 섹션에 따로 뿌린다.
const DAY_PROGRAM = [
  { what: '팀 등록 08:00 ~ 09:00 · 출전 순서 1~4번 확정·제출', where: '죽도해변 웨이브웍스' },
  { what: '개회식 09:00 · 모든 팀 필수 참석', where: '웨이브웍스' },
  { what: 'ROUND 1 10:30 ~ 12:25 · HEAT 1~8', where: '죽도해변' },
  { what: '점심 12:30 ~ 13:10', where: '' },
  { what: 'QUARTER FINAL 13:15 ~ 14:10 · HEAT 1~4', where: '죽도해변' },
  { what: 'SEMI FINAL 14:45 ~ 15:10 · HEAT 1~2', where: '죽도해변' },
  { what: 'FINAL 15:40 ~ 15:50', where: '죽도해변' },
  { what: '시상식 (폐막식 겸)', where: '해양종합레포츠센터 앞' },
];

const card = 'rounded-3xl border-[3px] border-black bg-white shadow-[6px_6px_0_#000]';

function SectionHead({ en, ko, desc }: { en: string; ko: string; desc?: string }) {
  return (
    <div className="mb-7">
      <p className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-[#EC6C01]">{en}</p>
      <h2 className="text-2xl font-black tracking-tight text-black md:text-3xl">{ko}</h2>
      {desc && <p className="mt-2 max-w-2xl leading-relaxed text-black/65">{desc}</p>}
    </div>
  );
}

/** 접수창 안인지 — 서버 렌더 시각 기준 (revalidate 60초라 마감 직후 최대 1분 지연) */
function isEntryOpen(now: number = Date.now()): boolean {
  return now >= ALOHA_TEAM_ENTRY_WINDOW.opensAt && now <= ALOHA_TEAM_ENTRY_WINDOW.closesAt;
}

export default async function AlohaTeamPage() {
  const lineup = await fetchLineupDivisions(ALOHA_TEAM_SLUG);
  const divisions = lineup?.divisions ?? [];
  const drawReady = hasHeats(divisions);
  const entryOpen = isEntryOpen();

  const heroAlt =
    '2026 양양군의장배 전국서핑대회 ALOHA TEAM CHALLENGE — 10월 9일(금) 양양 죽도해변, 상금 1위 100만원 · 2위 50만원 · 3위 30만원';
  const {
    props: { srcSet: heroDesktopSrcSet },
  } = getImageProps({ alt: heroAlt, sizes: '100vw', src: heroPc });
  const {
    props: { srcSet: heroMobileSrcSet, ...heroImgProps },
  } = getImageProps({ alt: heroAlt, sizes: '100vw', src: heroMobile });

  return (
    <div className="-mt-16 bg-[#F6F1E7] text-black">
      <BreadcrumbJsonLd
        items={[
          { name: '홈', url: '/' },
          { name: '서핑페스티벌·대회', url: '/festival' },
          { name: '알로하 팀 챌린지' },
        ]}
      />

      {/* Hero — 포스터 톤 메인 배너 (타이틀이 이미지에 포함) */}
      <section className="relative overflow-hidden bg-[#EF7414] pt-16">
        <picture>
          <source media="(min-width: 768px)" srcSet={heroDesktopSrcSet} />
          <img
            {...heroImgProps}
            srcSet={heroMobileSrcSet}
            alt={heroAlt}
            fetchPriority="high"
            loading="eager"
            className="block h-auto w-full"
          />
        </picture>
        <div className="sr-only">
          <h1>{PAGE_TITLE}</h1>
          <p>2026년 10월 9일(금) 양양 죽도해변 — 혼성 4인 팀 릴레이 서핑대회</p>
        </div>
      </section>

      {/* 섹션 바로가기 */}
      <nav
        aria-label="페이지 목차"
        className="sticky top-16 z-20 border-b-[3px] border-black bg-[#F6F1E7]/95 backdrop-blur"
      >
        <div className="mx-auto flex max-w-[1200px] gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none]">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="shrink-0 rounded-full border-2 border-black bg-white px-4 py-1.5 text-sm font-bold transition hover:bg-[#EC6C01] hover:text-white"
            >
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-[1200px] px-4">
        {/* 대회 안내 */}
        <section id="info" className="scroll-mt-32 py-14 md:py-20">
          <SectionHead
            en="About"
            ko="처음 보는 팀 서핑대회"
            desc="남자 2명 + 여자 2명, 넷이 한 팀! 릴레이로 한 명씩 바다에 나가 8번의 라이딩 시간을 모두 더해, 가장 오래 탄 팀이 우승합니다. 점수 심사가 아닌 '시간 재기'라 처음 대회에 나가는 분들도 도전할 수 있어요."
          />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <dl className={`${card} divide-y-2 divide-dashed divide-black/15 px-6 py-2 md:px-8`}>
              {INFO_ROWS.map((row) => (
                <div key={row.label} className="flex flex-col gap-1 py-3.5 sm:flex-row sm:gap-6">
                  <dt className="shrink-0 font-black sm:w-24">{row.label}</dt>
                  <dd className="font-semibold leading-relaxed text-black/80">
                    {row.value}
                    {row.note && <span className="mt-0.5 block text-sm font-medium text-black/50">{row.note}</span>}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="flex flex-col gap-4">
              <div className={`${card} bg-[#EC6C01] p-6`}>
                {entryOpen ? (
                  <>
                    <p className="text-sm font-black">참가 접수 중</p>
                    <p className="mt-1 text-lg font-black leading-snug">~ 9월 30일(수) 23:59 · 선착순 32팀</p>
                    <Link
                      href="/apply/aloha-team"
                      className="mt-4 flex items-center justify-center gap-2 rounded-full bg-black px-6 py-3.5 font-bold text-white transition hover:bg-black/85"
                    >
                      참가 신청하기 <span aria-hidden="true">→</span>
                    </Link>
                    <Link
                      href="/apply/aloha-team/edit"
                      className="mt-2.5 flex items-center justify-center rounded-full border-2 border-black bg-white px-6 py-3 text-sm font-bold transition hover:bg-[#FFF4E8]"
                    >
                      이미 신청했어요 · 팀 정보 수정
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-black">참가 접수 마감</p>
                    <p className="mt-1 text-lg font-black leading-snug">
                      참가 안내는 팀 대표자 연락처로 개별 발송됩니다.
                    </p>
                  </>
                )}
              </div>
              <div className={`${card} p-6 text-sm leading-relaxed`}>
                <p className="font-black">주최 · 주관 · 후원</p>
                <p className="mt-2 text-black/70">
                  주최 양양군체육회
                  <br />
                  주관 양양군서핑협회
                  <br />
                  후원 양양군의회 · 양양군
                </p>
                <p className="mt-4 font-black">문의</p>
                <p className="mt-2 text-black/70">
                  인스타그램 DM{' '}
                  <a href="https://www.instagram.com/ysa_korea/" target="_blank" rel="noopener noreferrer" className="font-bold underline">
                    @ysa_korea
                  </a>
                  <br />
                  <a href="mailto:ysa_korea@naver.com" className="font-bold underline">
                    ysa_korea@naver.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 경기 방식 */}
        <section id="format" className="scroll-mt-32 border-t-[3px] border-black py-14 md:py-20">
          <SectionHead
            en="How to play"
            ko="경기 방식 — 팀 롱라이딩 초재기"
            desc="4명 × 2라이딩 = 8개 라이딩 시간(초)을 모두 더한 팀 기록으로 순위를 가립니다. 한 히트에 여러 팀이 같은 바다에서 동시에 경기해요."
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-lg font-black">릴레이는 이렇게</h3>
              <ol className="space-y-3">
                {RELAY_STEPS.map((step, i) => (
                  <li
                    key={step.t}
                    className={`${card} flex items-center gap-4 px-5 py-4 ${i === 3 ? 'bg-[#FFD23F]' : ''}`}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-lg font-black text-white">
                      {i + 1}
                    </span>
                    <span>
                      <span className="block font-black">{step.t}</span>
                      <span className="text-sm font-semibold text-black/60">{step.s}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-center font-black">2번 → 3번 → 4번 선수까지 반복 🔁</p>
              <ul className="mt-5 space-y-1.5 text-sm font-semibold text-black/70">
                <li>· 출전 순서(1~4번, 남녀 순서 자유)는 선수등록 때 확정해 제출합니다. 라운드가 바뀔 때 조정할 수 있습니다</li>
                <li>· 경기 때는 팀별 색상 조끼(RED · BLUE · YELLOW · WHITE)를 입습니다</li>
              </ul>
            </div>

            <div>
              <h3 className="mb-3 text-lg font-black">점수 말고, 시간!</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className={`${card} p-4`}>
                  <p className="font-black">⏱ 시작</p>
                  <p className="mt-1 text-sm font-semibold text-black/70">보드 위에 두 발로 완전히 일어선 순간</p>
                </div>
                <div className={`${card} p-4`}>
                  <p className="font-black">■ 끝</p>
                  <p className="mt-1 text-sm font-semibold text-black/70">라이딩이 끝난 순간 (심판이 판정)</p>
                </div>
              </div>
              <div className={`${card} mt-4 overflow-x-auto px-5 py-4`}>
                <table className="w-full min-w-[320px] text-sm tabular-nums">
                  <thead>
                    <tr className="border-b-[3px] border-black text-right">
                      <th className="pb-2 text-left font-black">예시</th>
                      <th className="pb-2 font-black">1번째</th>
                      <th className="pb-2 font-black">2번째</th>
                      <th className="pb-2 font-black">합계</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE.map((r) => (
                      <tr key={r.who} className="border-b-2 border-dashed border-black/15 text-right font-bold">
                        <td className="py-2 text-left">{r.who}</td>
                        <td>{r.a}</td>
                        <td className={r.b === '0.00' ? 'text-[#D23B00]' : ''}>{r.b}</td>
                        <td>{r.sum}</td>
                      </tr>
                    ))}
                    <tr className="text-right">
                      <td className="pt-3 text-left text-base font-black">팀 기록</td>
                      <td />
                      <td />
                      <td className="pt-3 text-lg font-black">77.05초</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <ul className="mt-4 space-y-1.5 text-sm font-semibold text-black/70">
                <li>· 제한 시간 안에 못 탄 라이딩은 0초</li>
                <li>· 동점이면 가장 길게 탄 한 번의 기록부터 차례로 비교</li>
              </ul>
            </div>
          </div>

          <h3 className="mb-3 mt-10 text-lg font-black">이것만은 꼭!</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {RULES.map((r) => (
              <div key={r.rule} className={`${card} flex items-center justify-between gap-3 px-5 py-3.5`}>
                <span className="font-bold">{r.rule}</span>
                <span
                  className={`shrink-0 rounded-lg border-2 border-black px-2.5 py-0.5 text-sm font-black ${
                    r.dq ? 'bg-black text-white' : 'bg-[#FFD23F]'
                  }`}
                >
                  {r.result}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm font-semibold text-black/60">
            ※ 히트 구성 · 히트 시간 · 진출 방식은 접수 마감 후 참가 팀 수에 맞춰 확정해 이 페이지와 대표자 연락처로 안내합니다.
          </p>
        </section>

        {/* 스케줄 */}
        <section id="schedule" className="scroll-mt-32 border-t-[3px] border-black py-14 md:py-20">
          <SectionHead en="Schedule" ko="대회 당일 스케줄" desc="10월 9일(금) 하루에 ROUND 1부터 FINAL까지 진행합니다. 히트당 10분, 4팀 동시 경기, 히트 사이 5분입니다. 모든 팀은 개회식 전까지 팀 등록을 마쳐야 합니다." />
          <ol className={`${card} divide-y-2 divide-dashed divide-black/15 px-6 py-2 md:px-8`}>
            {DAY_PROGRAM.map((p, i) => (
              <li key={p.what} className="flex items-center gap-4 py-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EC6C01] font-black text-white">
                  {i + 1}
                </span>
                <span className="flex-1 font-black">{p.what}</span>
                <span className="shrink-0 text-sm font-bold text-black/55">{p.where}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm font-semibold text-black/60">
            ※ 히트별 경기 시각은 아래 대진표에 표시됩니다. 경기 순서와 시간은 파도 · 기상 상황에 따라 바뀔 수 있으며, 파도 상황이 좋아지면 서핑 경기로 다시 변경될 수 있습니다.
          </p>
        </section>

        {/* 대진표 */}
        <section id="draw" className="scroll-mt-32 border-t-[3px] border-black py-14 md:py-20">
          <SectionHead en="Draw" ko="대진표" desc="우리 팀이 몇 번째 히트에서, 어떤 팀과 함께 뛰는지 확인하세요." />
          {drawReady ? (
            <AlohaHeats divisions={divisions} />
          ) : (
            <div className={`${card} px-6 py-8 text-center`}>
              <p className="text-lg font-black">대진표는 접수 마감 후 공개됩니다</p>
              <p className="mt-2 text-sm font-semibold text-black/60">
                9월 30일(수) 접수 마감 → 참가 팀 확정 → 대진 추첨 후 이곳에 바로 반영됩니다.
              </p>
            </div>
          )}
        </section>

        {/* 실시간 결과 */}
        <section id="live" className="scroll-mt-32 border-t-[3px] border-black py-14 md:py-20">
          <div className="rounded-3xl border-[3px] border-black bg-black px-6 py-10 text-center text-white shadow-[6px_6px_0_#EC6C01] md:px-12">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#EF7414]">Live</p>
            <h2 className="mt-2 text-2xl font-black md:text-3xl">실시간 경기 결과</h2>
            <p className="mx-auto mt-3 max-w-xl leading-relaxed text-white/70">
              대회 당일 히트별 라이딩 기록과 팀 순위가 실시간으로 올라갑니다. 해변에 오지 못한 팀원 · 가족도 함께 응원하세요.
            </p>
            <a
              href={LIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#EF7414] px-7 py-3.5 font-black text-black transition hover:bg-[#FF8A2A]"
            >
              실시간 대진표 · 경기 결과 보기
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
