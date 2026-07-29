import type { Metadata } from 'next';
import Link from 'next/link';
import EntryCta from '@/components/festival/EntryCta';
import type { EntryWindowKey } from '@/lib/festival-2026';

export const metadata: Metadata = {
  title: '서핑페스티벌·대회',
  description:
    '2026 양양 서핑페스티벌·대회 안내. 8월 죽도해변에서 열리는 비기너 대회, SUP 레이스, 오픈부(롱보드·숏보드·SUP서핑) 일정과 접수 정보를 안내합니다.',
  alternates: { canonical: 'https://ysakorea.com/festival' },
};

interface InfoRow {
  label: string;
  value: string;
  note?: string;
}

interface Competition {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeClass: string;
  accentClass: string;
  /** 접수창 키 — 비기너·SUP 레이스는 beach, 오픈부는 open */
  windowKey: EntryWindowKey;
  rows: InfoRow[];
}

const COMPETITIONS: Competition[] = [
  {
    id: 'beginner',
    icon: '🌊',
    title: '비기너 대회',
    subtitle: '서핑에 막 입문한 서퍼들을 위한 무대',
    badge: '8/4 접수 시작',
    badgeClass: 'text-ocean bg-ocean/10',
    accentClass: 'bg-ocean/10 text-ocean',
    windowKey: 'beach',
    rows: [
      { label: '장소', value: '죽도해변' },
      {
        label: '대회일',
        value: '8월 29일(토) ~ 30일(일)',
        note: '※ 기상상황에 따라 변경 가능',
      },
      { label: '종목', value: '비기너 남자부 · 여자부 (인원 제한 없음)' },
      {
        label: '참가대상',
        value: '2023년 이후 입문자 (국내외 대회 입상자 제외)',
      },
      {
        label: '심사',
        value: '롱라이딩 초 재기 — 매뉴버 제한 없이 라이딩 초 수로 채점합니다.',
        note: '전원 동일 스펀지보드 사용 예정',
      },
      { label: '접수', value: '8월 4일(화) ~ 8월 9일(일)' },
      { label: '참가비', value: '5만원' },
      { label: '참가 굿즈', value: '모자 · 티셔츠 등' },
    ],
  },
  {
    id: 'sup-race',
    icon: '🚣',
    title: 'SUP 레이스 (오픈)',
    subtitle: '누구나 참가할 수 있는 기록 경기',
    badge: '8/4 접수 시작',
    badgeClass: 'text-teal bg-teal/10',
    accentClass: 'bg-teal/10 text-teal',
    windowKey: 'beach',
    rows: [
      { label: '장소', value: '죽도해변' },
      {
        label: '대회일',
        value: '8월 29일(토) ~ 30일(일)',
        note: '※ 기상상황에 따라 변경 가능',
      },
      {
        label: '종목',
        value: '스프린터 남 · 녀, 테크니컬 남 · 녀, 롱 디스턴스 남 · 녀 (인원 제한 없음)',
      },
      { label: '참가대상', value: '제한 없음' },
      { label: '심사', value: '기록경기 (피니시라인 초 재기)' },
      { label: '접수', value: '8월 4일(화) ~ 8월 9일(일)' },
      { label: '참가비', value: '종목당 5만원' },
      { label: '참가 굿즈', value: '모자 · 티셔츠' },
    ],
  },
  {
    id: 'open',
    icon: '🏄',
    title: '오픈부 — 롱보드 · 숏보드 · SUP서핑',
    subtitle: '파도가 좋은 날 진행하는 웨이브 대회',
    badge: '8/13 접수 시작',
    badgeClass: 'text-sunset bg-sunset/10',
    accentClass: 'bg-sunset/10 text-sunset',
    windowKey: 'open',
    rows: [
      {
        label: '운영 방식',
        value: '파도가 좋은 날 진행하는 웨이브 대회입니다.',
        note: '※ 기상 상황에 따라 일정을 유동적으로 조정합니다',
      },
      { label: '종목', value: '롱보드 · 숏보드 · SUP서핑 (세부 종목 추후 공지)' },
      { label: '장소', value: '추후 공지' },
      { label: '모집요강', value: '세부 모집요강 8월 5일 공지 예정' },
      { label: '접수', value: '8월 13일(목) ~ 8월 22일(토)' },
    ],
  },
];

export default function FestivalPage() {
  return (
    <div className="-mt-16">
      {/* Hero */}
      <section className="relative flex min-h-[72vh] items-center overflow-hidden bg-navy pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-ocean via-navy to-navy" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(27,154,170,0.38),transparent_58%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-navy to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-[1200px] px-4 py-20 text-center text-white md:py-24">
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.4em] text-sunset md:text-sm">
            2026 · JUKDO BEACH, YANGYANG
          </p>
          <h1 className="mb-6 text-4xl font-extrabold leading-[1.15] tracking-tight md:text-6xl lg:text-7xl">
            2026 양양
            <br />
            <span className="text-sunset">서핑페스티벌·대회</span>
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
            8월 죽도해변에서 펼쳐지는 서핑 축제와 대회
          </p>
        </div>
      </section>

      {/* 갈림길 카드 */}
      <section className="relative z-20 -mt-12 px-4 md:-mt-16">
        <div className="mx-auto grid max-w-[1000px] gap-4 sm:grid-cols-2">
          <a
            href="#competition"
            className="group rounded-2xl border border-foam bg-white p-6 shadow-lg shadow-navy/5 transition-all hover:-translate-y-1 hover:border-ocean/30 hover:shadow-xl md:p-8"
          >
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-ocean/10 text-2xl">
              🏄
            </span>
            <h2 className="mb-2 text-lg font-bold text-navy md:text-xl">대회 참가하기</h2>
            <p className="mb-4 text-sm leading-relaxed text-navy/60">
              비기너 대회, SUP 레이스, 오픈부 — 종목별 참가 자격과 접수 일정을 확인하세요.
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-ocean">
              대회 정보 보기
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-y-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </span>
          </a>

          <a
            href="#festival"
            className="group rounded-2xl border border-foam bg-white p-6 shadow-lg shadow-navy/5 transition-all hover:-translate-y-1 hover:border-teal/30 hover:shadow-xl md:p-8"
          >
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal/10 text-2xl">
              🎪
            </span>
            <h2 className="mb-2 text-lg font-bold text-navy md:text-xl">페스티벌 즐기기</h2>
            <p className="mb-4 text-sm leading-relaxed text-navy/60">
              대회와 함께 죽도해변에서 열리는 현장 프로그램을 준비하고 있습니다.
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-teal">
              페스티벌 소식 보기
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-y-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </span>
          </a>
        </div>
      </section>

      {/* 대회 */}
      <section id="competition" className="scroll-mt-20 py-20 md:py-28">
        <div className="mx-auto max-w-[1200px] px-4">
          <div className="mb-12 max-w-3xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-teal">
              COMPETITION
            </p>
            <h2 className="mb-4 text-2xl font-bold text-navy md:text-3xl">2026 대회 안내</h2>
            <p className="leading-relaxed text-navy/70">
              8월 죽도해변에서 비기너 대회와 SUP 레이스를 진행하며, 파도 상황에 맞춰 오픈부 웨이브
              대회를 함께 운영합니다. 종목별 참가 자격과 접수 기간이 다르니 아래 내용을 확인해 주세요.
            </p>
          </div>

          <div className="space-y-6">
            {COMPETITIONS.map((comp) => (
              <article
                key={comp.id}
                className="rounded-2xl border border-foam bg-white p-6 md:p-8"
              >
                <div className="mb-6 flex flex-col gap-4 border-b border-foam pb-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${comp.accentClass}`}
                    >
                      {comp.icon}
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-navy md:text-xl">{comp.title}</h3>
                      <p className="mt-1 text-sm text-navy/60">{comp.subtitle}</p>
                    </div>
                  </div>
                  <span
                    className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${comp.badgeClass}`}
                  >
                    {comp.badge}
                  </span>
                </div>

                <dl className="divide-y divide-foam">
                  {comp.rows.map((row) => (
                    <div
                      key={row.label}
                      className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6"
                    >
                      <dt className="shrink-0 text-sm font-semibold text-navy sm:w-24">
                        {row.label}
                      </dt>
                      <dd className="text-sm leading-relaxed text-navy/70">
                        {row.value}
                        {row.note && (
                          <span className="mt-1 block text-xs text-navy/45">{row.note}</span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>

                <EntryCta
                  windowKey={comp.windowKey}
                  badgeLabel={comp.badge}
                  badgeClass={comp.badgeClass}
                />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 주요 일정 */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-[1200px] px-4">
          <div className="max-w-3xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-teal">SCHEDULE</p>
            <h2 className="mb-4 text-2xl font-bold text-navy md:text-3xl">주요 일정</h2>
            <p className="leading-relaxed text-navy/70">
              공지와 접수, 대회까지 8월 한 달간의 일정입니다. 기상 상황에 따라 변경될 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* 페스티벌 */}
      <section id="festival" className="scroll-mt-20 py-20 md:py-28">
        <div className="mx-auto max-w-[1200px] px-4">
          <div className="mb-10 max-w-3xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-teal">FESTIVAL</p>
            <h2 className="mb-4 text-2xl font-bold text-navy md:text-3xl">페스티벌 현장</h2>
          </div>

          <div className="rounded-2xl border border-foam bg-white p-8 md:p-10">
            <p className="leading-relaxed text-navy/70">
              대회와 함께 죽도해변에서 즐기는 현장 프로그램을 준비하고 있습니다.
              <br className="hidden md:block" />
              세부 프로그램은 확정되는 대로 이 페이지와 공지사항을 통해 안내드립니다.
            </p>
            <Link
              href="/notice"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ocean px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-ocean/90"
            >
              공지사항 보기
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* 10년의 기록 배너 */}
      <section className="bg-ocean py-16 text-white md:py-20">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-6 px-4 md:flex-row md:items-center">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-sunset">
              SINCE 2014
            </p>
            <h2 className="mb-2 text-xl font-bold md:text-2xl">양양 서핑페스티벌 10년의 기록</h2>
            <p className="text-sm leading-relaxed text-white/70">
              2014년 첫 파도부터 지금까지, 페스티벌이 지나온 시간을 아카이브로 만나보세요.
            </p>
          </div>
          <Link
            href="/festival/history"
            className="inline-flex shrink-0 items-center gap-2 bg-sunset px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-sunset/90"
          >
            10년의 기록 보기
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
