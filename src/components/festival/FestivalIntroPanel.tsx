import Image from 'next/image';
import Link from 'next/link';
import { festivalTabHref, type FestivalTabId } from './tabs';
import { OPEN_COMPETITIONS } from './OpenCompetitionPanel';

/**
 * 기본 탭(페스티벌) — 축제 전체 소개와 대회 갈림길.
 * 탭 개편 전 페이지의 페스티벌 · 주요 일정 · 주최/주관/후원 · 10년의 기록 블록을 그대로 옮겨 왔다.
 */

const ORGANIZERS = [
  { label: '주최', value: '양양군' },
  { label: '주관', value: '양양군서핑협회(YSA) · 대한서핑협회(KSA)' },
  {
    label: '후원',
    value: '문화체육관광부 · 강원특별자치도 · 양양군체육회 · 강원특별자치도서핑협회',
  },
];

interface CompetitionLink {
  id: FestivalTabId;
  icon: string;
  title: string;
  caption: string;
  badge: string;
  badgeClass: string;
  accentClass: string;
}

const COMPETITION_LINKS: CompetitionLink[] = [
  {
    id: 'beginner',
    icon: '🌊',
    title: '비기너 서핑대회',
    caption: '8월 29일(토)~30일(일) · 죽도해변',
    badge: '대진표 발표',
    badgeClass: 'text-ocean bg-ocean/10',
    accentClass: 'bg-ocean/10',
  },
  ...OPEN_COMPETITIONS.map((comp) => ({
    id: comp.id as FestivalTabId,
    icon: comp.icon,
    title: `코리아 오픈 ${comp.shortLabel}`,
    caption: `9~11월 파도 좋은 평일 · ${comp.venue}`,
    badge: '접수 마감',
    badgeClass: 'text-sunset bg-sunset/10',
    accentClass: 'bg-sunset/10',
  })),
];

const STAGE_LINEUP = [
  {
    time: '18:00 – 18:45',
    name: '보허미안',
    desc: '조선 서프뮤직의 선구자 — 오프닝 무대',
    headliner: false,
  },
  {
    time: '18:50 – 19:30',
    name: '큐티즈 × 양고밴드',
    desc: '양양 동네밴드와 양양고 밴드부의 세대 콜라보',
    headliner: false,
  },
  {
    time: '19:35 – 20:15',
    name: '스트링노스누들',
    desc: '하조대를 중심으로 활동하는 양양 대표 락밴드',
    headliner: false,
  },
  {
    time: '20:20 – 21:00',
    name: '서도밴드',
    desc: '조선팝 창시자 · JTBC 「풍류대장」 초대 우승',
    headliner: true,
  },
];

/**
 * 공연 팀 소개 카드.
 * `imagePosition` 은 세로 사진을 16:10 으로 잘라낼 때 얼굴이 잘리지 않도록
 * 사진마다 맞춘 object-position 값이다 (숫자가 작을수록 위쪽을 살린다).
 */
const STAGE_BANDS = [
  {
    time: '18:00 – 18:45',
    name: '보허미안',
    role: '오프닝',
    headliner: false,
    image: '/festival/bands/boheomian.jpg',
    imagePosition: 'object-[50%_25%]',
    desc: '파도처럼 흘러가는 감정을 음악으로 기록하는 조선 서프뮤직의 선구자.',
    tags: ['서프뮤직', '양양', '오프닝 무대'],
  },
  {
    time: '18:50 – 19:30',
    name: '큐티즈 × 양고밴드',
    role: null,
    headliner: false,
    image: '/festival/bands/cuties.jpg',
    imagePosition: 'object-[50%_45%]',
    desc: '양양읍을 중심으로 서핑하는 자영업자들의 동네밴드 큐티즈. 양고 밴드부 출신 멤버와 현 양양고 재학생 밴드부원이 함께 서는 세대 콜라보 무대.',
    tags: ['동네밴드', '세대 콜라보', '양양고 밴드부'],
  },
  {
    time: '19:35 – 20:15',
    name: '스트링노스누들',
    role: null,
    headliner: false,
    image: '/festival/bands/stringnorthnoodle.jpg',
    imagePosition: 'object-[50%_30%]',
    desc: '현북면 하조대를 중심으로 지지고 볶으며 락스타를 꿈꾸는 양양 대표 락밴드.',
    tags: ['하조대', '락밴드', '현북면'],
  },
  {
    time: '20:20 – 21:00',
    name: '서도밴드',
    role: null,
    headliner: true,
    image: '/festival/bands/seodo.jpg',
    imagePosition: 'object-[50%_22%]',
    desc: '판소리와 팝이 만나 조선팝이라는 새로운 물결을 연 밴드. 보컬 서도는 양양 서퍼들과 함께 파도를 타는 서퍼이기도 합니다. JTBC 「풍류대장」 초대 우승팀이 죽도해변의 마지막 무대를 장식합니다.',
    tags: ['조선팝 창시자', '풍류대장 초대 우승', '양양 서퍼'],
  },
];

/**
 * 하루의 흐름.
 * `apply` 가 있는 항목은 온라인 사전신청을 받는 프로그램이다
 * (해변 바레 12명 / 하이록스 24명 + 각각 현장 접수분 별도).
 */
const DAY_PROGRAMS = [
  {
    time: '오후 1시',
    name: '해변 바레',
    desc: '파도 소리와 함께하는 바레 클래스',
    apply: true,
  },
  {
    time: '오후 3시',
    name: '해변 하이록스',
    desc: '모래 위에서 겨루는 피트니스 레이스',
    apply: true,
  },
  {
    time: '오후 6–9시',
    name: '라이브 공연',
    desc: '보허미안 · 큐티즈×양고밴드 · 스트링노스누들 · 서도밴드',
  },
  { time: '오후 9시', name: '불꽃놀이', desc: '죽도 밤하늘을 수놓는 페스티벌 피날레' },
];

const ALL_DAY_PROGRAMS = [
  '브랜드존 부스',
  '보드스왑',
  '라로제 선스틱 이벤트',
  '디지털관광주민증',
  '경품추첨',
];

export default function FestivalIntroPanel() {
  return (
    <>
      {/* 대회 갈림길 */}
      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-[1200px] px-4">
          <div className="mb-10 max-w-3xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-teal">
              COMPETITION
            </p>
            <h2 className="mb-4 text-2xl font-bold text-navy md:text-3xl">
              대한서핑협회장배 서핑대회
            </h2>
            <p className="leading-relaxed text-navy/70">
              2026 양양서핑페스티벌과 함께 열리는 대한서핑협회장배 서핑대회입니다. 비기너
              서핑대회는 8월 말 죽도해변에서, 코리아 오픈 숏보드 · 롱보드 · SUP 서핑 종목은 파도
              상황에 맞춰 9~11월에 진행합니다. 종목별 일정과 진행 방식이 다르니 아래에서 해당
              대회를 확인해 주세요.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COMPETITION_LINKS.map((comp) => (
              <Link
                key={comp.id}
                href={festivalTabHref(comp.id)}
                scroll={false}
                className="group rounded-2xl border border-foam bg-white p-6 transition-all hover:-translate-y-1 hover:border-ocean/30 hover:shadow-lg hover:shadow-navy/5"
              >
                <span
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-xl ${comp.accentClass}`}
                >
                  {comp.icon}
                </span>
                <span
                  className={`mb-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${comp.badgeClass}`}
                >
                  {comp.badge}
                </span>
                <h3 className="text-base font-bold text-navy">{comp.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-navy/55">{comp.caption}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ocean">
                  자세히 보기
                  <svg
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                    />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 주요 일정 */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-[1200px] px-4">
          <div className="max-w-3xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-teal">SCHEDULE</p>
            <h2 className="mb-4 text-2xl font-bold text-navy md:text-3xl">주요 일정</h2>
            <p className="leading-relaxed text-navy/70">
              비기너 서핑대회는 8월 29일(토)~30일(일) 죽도해변에서, 코리아 오픈 세 종목은 9월부터
              11월까지 파도가 좋은 평일에 순차 진행합니다. 기상 상황에 따라 변경될 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* 페스티벌 현장 — 하루 프로그램 & 라이브 스테이지 */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-[1200px] px-4">
          <div className="mb-10 max-w-3xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-teal">
              FESTIVAL · 8/29 SAT
            </p>
            <h2 className="mb-4 text-2xl font-bold text-navy md:text-3xl">페스티벌 현장</h2>
            <p className="leading-relaxed text-navy/70">
              8월 29일(토) 죽도해변, 대회와 함께 하루 종일 즐기는 현장 프로그램입니다. 해질녘엔
              라이브 공연이, 밤에는 불꽃놀이가 페스티벌의 피날레를 장식합니다.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* 하루의 흐름 */}
            <div className="rounded-2xl border border-foam bg-white p-7 md:p-8">
              <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.3em] text-teal">
                Timeline
              </p>
              <h3 className="mb-6 text-lg font-bold text-navy">하루의 흐름</h3>
              <ul className="space-y-5">
                {DAY_PROGRAMS.map((prog) => (
                  <li key={prog.name} className="flex gap-4">
                    <span className="w-20 shrink-0 pt-0.5 text-sm font-bold text-ocean">
                      {prog.time}
                    </span>
                    <span>
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[15px] font-bold text-navy">{prog.name}</span>
                        {prog.apply && (
                          <Link
                            href="/apply/festival-program"
                            className="rounded-full bg-ocean px-2.5 py-0.5 text-[11px] font-bold text-white transition-colors hover:bg-ocean/90"
                          >
                            사전신청
                          </Link>
                        )}
                      </span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-navy/55">
                        {prog.desc}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-7 border-t border-foam pt-5">
                <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.3em] text-teal">
                  All Day
                </p>
                <div className="flex flex-wrap gap-2">
                  {ALL_DAY_PROGRAMS.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-foam bg-foam/40 px-3.5 py-1.5 text-[13px] font-semibold text-navy/75"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-5 rounded-xl border border-ocean/20 bg-ocean/5 p-4">
                  <p className="text-[13px] font-bold text-navy">
                    해변 바레 · 하이록스는 온라인 사전 신청 + 당일 현장 접수로 운영됩니다
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-navy/55">
                    참가비 무료 · 한 분당 한 종목 · 바레 15명(온라인 12 + 현장 3) · 하이록스
                    30명(온라인 24 + 현장 6). 사전신청이 마감되어도 당일 현장에서 선착순으로
                    참여하실 수 있습니다.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href="/apply/festival-program"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-ocean px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-ocean/90"
                    >
                      온라인 사전신청
                    </Link>
                    <Link
                      href="/apply/festival-program/my"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-foam bg-white px-4 py-2 text-[13px] font-semibold text-navy transition-colors hover:bg-foam/40"
                    >
                      신청 조회 · 취소
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* 라이브 스테이지 */}
            <div className="relative overflow-hidden rounded-2xl bg-navy p-7 text-white md:p-8">
              {/* 불꽃놀이 배경 — 네이비 오버레이로 눌러 본문 가독성을 유지한다 */}
              <Image
                src="/festival/fireworks-bg.jpg"
                alt=""
                aria-hidden="true"
                fill
                sizes="(max-width: 1024px) 100vw, 600px"
                className="pointer-events-none object-cover object-center"
              />
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-navy/85" />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-navy/30 via-navy/25 to-navy/75"
              />

              <div className="relative">
                <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.3em] text-sunset">
                  Live Stage
                </p>
                <h3 className="text-lg font-bold">공연 &amp; 불꽃놀이</h3>
                <p className="mt-1.5 text-sm text-white/60">
                  18:00 – 21:00 · 죽도해변 메인 스테이지 · 관람 무료
                </p>
                <ul className="mt-6 divide-y divide-white/10 border-y border-white/15">
                  {STAGE_LINEUP.map((band) => (
                    <li key={band.name} className="flex items-start gap-4 py-4">
                      <span className="w-24 shrink-0 pt-0.5 font-mono text-[13px] font-semibold text-sunset">
                        {band.time}
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-[15px] font-bold">{band.name}</span>
                          {band.headliner && (
                            <span className="rounded-full bg-sunset px-2 py-0.5 text-[10px] font-bold tracking-[0.12em] text-white">
                              HEADLINER
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-[13px] leading-relaxed text-white/55">
                          {band.desc}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 flex items-center gap-2.5 text-sm font-semibold text-white/85">
                  <span aria-hidden="true" className="text-lg">
                    🎆
                  </span>
                  공연이 끝나면 죽도 밤하늘에서 불꽃놀이 피날레가 이어집니다
                </p>
              </div>
            </div>
          </div>

          {/* 공연 팀 소개 */}
          <div className="mt-14">
            <div className="mb-8 max-w-3xl">
              <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-teal">LINE UP</p>
              <h3 className="mb-3 text-xl font-bold text-navy md:text-2xl">공연 팀 소개</h3>
              <p className="text-sm leading-relaxed text-navy/70">
                8월 29일(토) 해질녘, 죽도해변 메인 스테이지에 오르는 네 팀입니다. 양양에서 파도를
                타고 음악을 하는 팀들로 채웠고, 관람은 무료입니다.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {STAGE_BANDS.map((band) => (
                <article
                  key={band.name}
                  className="overflow-hidden rounded-2xl border border-foam bg-white transition-shadow hover:shadow-lg hover:shadow-navy/5"
                >
                  <div className="relative aspect-[16/10] bg-foam">
                    <Image
                      src={band.image}
                      alt={`${band.name} 공연 팀`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 560px"
                      className={`object-cover ${band.imagePosition}`}
                    />
                  </div>
                  <div className="p-6 md:p-7">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-ocean/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-ocean">
                        {band.time}
                      </span>
                      {band.role && (
                        <span className="rounded-full border border-foam bg-foam/50 px-2.5 py-0.5 text-[11px] font-semibold text-navy/65">
                          {band.role}
                        </span>
                      )}
                      {band.headliner && (
                        <span className="rounded-full bg-sunset px-2.5 py-0.5 text-[10px] font-bold tracking-[0.12em] text-white">
                          HEADLINER
                        </span>
                      )}
                    </div>
                    <h4 className="mt-3 text-lg font-bold text-navy">{band.name}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-navy/65">{band.desc}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {band.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-foam bg-foam/40 px-3 py-1 text-xs font-semibold text-navy/70"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <Link
            href="/notice"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-ocean px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-ocean/90"
          >
            공지사항 보기
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        </div>
      </section>

      {/* 주최·주관·후원 */}
      <section className="border-t border-foam py-12 md:py-16">
        <div className="mx-auto max-w-[1200px] px-4">
          <dl className="max-w-3xl divide-y divide-foam">
            {ORGANIZERS.map((org) => (
              <div key={org.label} className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6">
                <dt className="shrink-0 text-sm font-semibold text-navy sm:w-16">{org.label}</dt>
                <dd className="text-sm leading-relaxed text-navy/70">{org.value}</dd>
              </div>
            ))}
          </dl>
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        </div>
      </section>
    </>
  );
}
