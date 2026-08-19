import EntryCta from './EntryCta';
import CompetitionInfoCard, { type InfoRow } from './CompetitionInfoCard';
import type { FestivalTabId } from './tabs';

/**
 * 코리아 오픈 3종(숏보드 · 롱보드 · SUP 서핑) 공용 탭 패널.
 *
 * 운영 방식 · 접수 기간 · 참가비는 세 종목이 같고 장소와 시상만 다르다.
 * 접수 CTA 는 기존 `EntryCta`(windowKey "open") 를 그대로 재사용한다 —
 * 8/22 23:59 이 지나면 별도 수정 없이 "접수 마감" 으로 바뀐다.
 */

export interface OpenCompetition {
  id: Extract<FestivalTabId, 'shortboard' | 'longboard' | 'supsurfing'>;
  icon: string;
  /** 탭·카드 제목 */
  title: string;
  subtitle: string;
  /** 종목명만 (요약 카드용) */
  shortLabel: string;
  venue: string;
  prizes: string;
  intro: string;
}

/** 접수 기간 문구 — ENTRY_WINDOWS.open 과 같은 일정 */
export const OPEN_ENTRY_PERIOD = '8월 13일(목) 09:00 ~ 8월 22일(토) 23:59';

/** 코리아 오픈 접수 폼 (type 파라미터로 비기너와 분리) */
export const OPEN_ENTRY_HREF = '/apply/competition?type=open';

export const OPEN_COMPETITIONS: OpenCompetition[] = [
  {
    id: 'shortboard',
    icon: '🏄',
    title: '코리아 오픈 — 숏보드',
    subtitle: '파도 상황에 맞춰 진행하는 대회',
    shortLabel: '숏보드',
    venue: '기사문해변',
    prizes: '1위 100만원 · 2위 50만원 · 3위 30만원',
    intro:
      '좋은 파도를 기다려 진행하는 코리아 오픈 숏보드 부문입니다. 기사문해변에서 남자부 · 여자부로 나뉘어 열립니다.',
  },
  {
    id: 'longboard',
    icon: '🏄‍♀️',
    title: '코리아 오픈 — 롱보드',
    subtitle: '파도 상황에 맞춰 진행하는 대회',
    shortLabel: '롱보드',
    venue: '설악해변',
    prizes: '1위 100만원 · 2위 50만원 · 3위 30만원',
    intro:
      '좋은 파도를 기다려 진행하는 코리아 오픈 롱보드 부문입니다. 설악해변에서 남자부 · 여자부로 나뉘어 열립니다.',
  },
  {
    id: 'supsurfing',
    icon: '🛶',
    title: '코리아 오픈 — SUP 서핑',
    subtitle: '파도 상황에 맞춰 진행하는 대회',
    shortLabel: 'SUP 서핑',
    venue: '물치해변',
    prizes: '1위 50만원 · 2위 30만원 · 3위 20만원',
    intro:
      '좋은 파도를 기다려 진행하는 코리아 오픈 SUP 서핑 부문입니다. 물치해변에서 남자부 · 여자부로 나뉘어 열립니다.',
  },
];

function buildRows(comp: OpenCompetition): InfoRow[] {
  return [
    {
      label: '운영 방식',
      value:
        '좋은 파도를 기다려 진행합니다. 9월부터 11월까지 파도가 좋은 평일에 순차 진행합니다.',
      note: '※ 파도 상황에 따라 장소 및 일정이 유동적으로 조정될 수 있습니다',
    },
    { label: '장소', value: comp.venue },
    { label: '종목', value: '남자부 · 여자부' },
    { label: '접수', value: OPEN_ENTRY_PERIOD },
    { label: '참가비', value: '종목당 5만원' },
    {
      label: '시상',
      value: comp.prizes,
      note: '남자부 · 여자부 각각 시상',
    },
  ];
}

export default function OpenCompetitionPanel({ comp }: { comp: OpenCompetition }) {
  return (
    <section className="py-14 md:py-20">
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-teal">KOREA OPEN</p>
          <h2 className="mb-4 text-2xl font-bold text-navy md:text-3xl">{comp.title}</h2>
          <p className="leading-relaxed text-navy/70">{comp.intro}</p>
        </div>

        <CompetitionInfoCard
          icon={comp.icon}
          title={comp.title}
          subtitle={comp.subtitle}
          badge="접수 ~ 8/22"
          badgeClass="text-sunset bg-sunset/10"
          accentClass="bg-sunset/10 text-sunset"
          rows={buildRows(comp)}
        >
          <EntryCta
            windowKey="open"
            badgeLabel="8/13 09시 접수 시작"
            badgeClass="text-sunset bg-sunset/10"
            href={OPEN_ENTRY_HREF}
          />
        </CompetitionInfoCard>
      </div>
    </section>
  );
}
