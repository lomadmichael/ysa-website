'use client';

import { useMemo, useState } from 'react';
import type { LineupDivision } from '@/lib/lineup-api';

/**
 * 비기너 대회 히트별 경기 시간표 + 경기 장소 안내.
 *
 * 데이터는 BeginnerPanel 이 이미 받아온 라인업 divisions 를 그대로 쓴다
 * (추가 API 호출 없음). 시각·뱅크는 운영 DB 가 진실 원본이라, 현장에서
 * 스케줄을 조정하면 최대 1분 뒤 이 화면에도 반영된다.
 *
 * ⚠️ 용어: 운영 콘솔은 「뱅크 A/B」로 부르지만 참가자 안내 문자는
 * 「메인타워 / 서브타워」로 나갔다. 참가자가 보는 화면은 문자와 같은 말을
 * 써야 혼동이 없다 — 여기서 매핑한다.
 */

type BankKey = 'main' | 'secondary';

const BANK_INFO: Record<BankKey, { label: string; venue: string; chip: string; bar: string }> = {
  main: {
    label: '메인타워',
    venue: '웨이브웍스 앞 해변',
    chip: 'bg-ocean/10 text-ocean',
    bar: 'bg-ocean',
  },
  secondary: {
    label: '서브타워',
    venue: '죽도캠핑장 앞 해변 (수로 건너편)',
    chip: 'bg-teal/10 text-teal',
    bar: 'bg-teal',
  },
};

function bankOf(bank: string | null | undefined): BankKey {
  return bank === 'secondary' ? 'secondary' : 'main';
}

const DOW = ['일', '월', '화', '수', '목', '금', '토'];

/** UTC ISO → KST 파츠 (서버·클라이언트 렌더가 어긋나지 않게 직접 계산) */
function kst(iso: string) {
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000);
  return {
    dateKey: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
      d.getUTCDate()
    ).padStart(2, '0')}`,
    dateLabel: `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일(${DOW[d.getUTCDay()]})`,
    time: `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`,
  };
}

interface ScheduleHeat {
  key: string;
  divisionName: string;
  roundName: string;
  heatNumber: number;
  bank: BankKey;
  status: string;
  dateKey: string;
  dateLabel: string;
  time: string;
  sortAt: number;
  /** 히트 진행 시간(분) — 라운드 설정값. 없으면 표기하지 않는다 */
  durationMin: number | null;
  athletes: string[];
}

function buildSchedule(divisions: LineupDivision[]): ScheduleHeat[] {
  const out: ScheduleHeat[] = [];
  for (const division of divisions) {
    for (const round of division.rounds ?? []) {
      for (const heat of round.heats ?? []) {
        const at = heat.scheduled_at;
        if (!at) continue;
        const t = new Date(at).getTime();
        if (Number.isNaN(t)) continue;
        const parts = kst(at);
        out.push({
          key: heat.id ?? `${division.name}-${round.name}-${heat.heat_number}`,
          divisionName: division.name,
          roundName: round.name,
          heatNumber: heat.heat_number,
          bank: bankOf(heat.bank),
          status: heat.status ?? 'upcoming',
          dateKey: parts.dateKey,
          dateLabel: parts.dateLabel,
          time: parts.time,
          sortAt: t,
          durationMin:
            typeof round.heat_duration_min === 'number' && round.heat_duration_min > 0
              ? round.heat_duration_min
              : null,
          athletes: (heat.athletes ?? []).map((a) => a.name).filter(Boolean),
        });
      }
    }
  }
  return out.sort(
    (a, b) => a.sortAt - b.sortAt || a.divisionName.localeCompare(b.divisionName, 'ko')
  );
}

/** 같은 시각에 시작하는 히트를 한 블록으로 — 2일차 남녀 동시 진행이 눈에 보이게 */
interface TimeGroup {
  sortAt: number;
  time: string;
  heats: ScheduleHeat[];
}

function groupByTime(heats: ScheduleHeat[]): TimeGroup[] {
  const map = new Map<number, TimeGroup>();
  for (const heat of heats) {
    const hit = map.get(heat.sortAt);
    if (hit) hit.heats.push(heat);
    else map.set(heat.sortAt, { sortAt: heat.sortAt, time: heat.time, heats: [heat] });
  }
  return [...map.values()].sort((a, b) => a.sortAt - b.sortAt);
}

/**
 * 그룹 전체가 같은 진행 시간일 때만 그 값 — 동시 진행 두 히트의 길이가
 * 다르면 시각 옆에 하나만 적는 게 거짓이 되므로 표기하지 않는다.
 */
function groupDuration(group: TimeGroup): number | null {
  const first = group.heats[0]?.durationMin ?? null;
  if (first == null) return null;
  return group.heats.every((heat) => heat.durationMin === first) ? first : null;
}

export default function HeatSchedule({
  divisions,
  liveUrl,
}: {
  divisions: LineupDivision[];
  liveUrl: string;
}) {
  const all = useMemo(() => buildSchedule(divisions), [divisions]);
  const [query, setQuery] = useState('');

  const days = useMemo(() => {
    const seen = new Map<string, string>();
    for (const heat of all) if (!seen.has(heat.dateKey)) seen.set(heat.dateKey, heat.dateLabel);
    return [...seen.entries()].map(([key, label]) => ({ key, label }));
  }, [all]);

  const [activeDay, setActiveDay] = useState(() => days[0]?.key ?? '');

  const keyword = query.trim();
  // 이름을 넣으면 날짜 탭을 무시하고 본인 히트만 — 이틀에 걸쳐 있어도 한눈에 보인다
  const searching = keyword.length > 0;
  const visible = useMemo(() => {
    if (searching)
      return all.filter((heat) => heat.athletes.some((name) => name.includes(keyword)));
    return all.filter((heat) => heat.dateKey === activeDay);
  }, [all, activeDay, keyword, searching]);

  const groups = useMemo(() => groupByTime(visible), [visible]);
  const usesSecondary = all.some((heat) => heat.bank === 'secondary');

  if (all.length === 0) return null;

  return (
    <div className="mt-8 rounded-2xl border border-foam bg-white p-6 md:p-8">
      <div className="mb-6">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-teal">SCHEDULE</p>
        <h3 className="text-lg font-bold text-navy md:text-xl">히트별 경기 시간표</h3>
        <p className="mt-2 text-sm leading-relaxed text-navy/60">
          본인 이름을 검색하면 출전 히트만 모아 볼 수 있습니다. 경기 장소가 두 곳으로 나뉘니 타워를
          꼭 확인해 주세요.
        </p>
      </div>

      {/* 경기 장소 안내 */}
      {usesSecondary && (
        <div className="grid gap-3 sm:grid-cols-2">
          {(['main', 'secondary'] as BankKey[]).map((bank) => {
            const info = BANK_INFO[bank];
            return (
              <div
                key={bank}
                className="flex items-start gap-3 rounded-xl border border-foam bg-sand/60 px-4 py-3.5"
              >
                <span className={`mt-1 h-8 w-1 shrink-0 rounded-full ${info.bar}`} aria-hidden="true" />
                <div className="min-w-0">
                  <p className="font-bold text-navy">{info.label}</p>
                  <p className="mt-0.5 text-sm text-navy/60">{info.venue}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 이름 검색 */}
      <div className="mt-5">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="선수 이름으로 내 경기 찾기"
          className="w-full rounded-xl border border-foam bg-white px-4 py-3 text-navy placeholder:text-navy/35 focus:border-ocean focus:outline-none"
        />
      </div>

      {/* 날짜 탭 — 검색 중에는 이틀 전체를 보여주므로 숨긴다 */}
      {!searching && days.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {days.map((day, index) => {
            const isActive = day.key === activeDay;
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => setActiveDay(day.key)}
                aria-pressed={isActive}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-navy text-white'
                    : 'border border-foam bg-white text-navy/60 hover:border-ocean/30 hover:text-navy'
                }`}
              >
                {index + 1}일차
                <span className={`ml-1.5 text-xs ${isActive ? 'text-white/60' : 'text-navy/40'}`}>
                  {day.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 시간표 */}
      {groups.length === 0 ? (
        <p className="mt-5 rounded-xl bg-sand px-4 py-6 text-center text-sm text-navy/60">
          {searching
            ? `'${keyword}' 선수의 경기를 찾지 못했습니다. 이름을 다시 확인해 주세요.`
            : '표시할 경기가 없습니다.'}
        </p>
      ) : (
        <div className="mt-5 overflow-hidden rounded-xl border border-foam">
          {groups.map((group) => {
            const duration = groupDuration(group);
            return (
            <div key={group.sortAt} className="flex border-b border-foam last:border-b-0">
              {/* 시각은 절대 줄바꿈되면 안 된다 ("11:0 / 0" 으로 쪼개져 보였음) */}
              <div className="w-[72px] shrink-0 border-r border-foam bg-sand/50 px-2.5 py-3.5 md:w-24 md:px-4">
                <span className="block whitespace-nowrap font-mono text-sm font-bold tabular-nums text-navy md:text-base">
                  {group.time}
                </span>
                {duration != null && (
                  <span className="mt-0.5 block whitespace-nowrap text-[11px] text-navy/40 md:text-xs">
                    {duration}분 경기
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                {group.heats.map((heat, index) => {
                  const info = BANK_INFO[heat.bank];
                  const done = heat.status === 'finished' || heat.status === 'published';
                  const live = heat.status === 'live' || heat.status === 'paused';
                  const mine = searching
                    ? heat.athletes.filter((name) => name.includes(keyword))
                    : [];
                  return (
                    <div
                      key={heat.key}
                      className={`flex flex-wrap items-center gap-x-1.5 gap-y-1.5 px-2.5 py-3 md:gap-x-2.5 md:px-4 ${
                        index > 0 ? 'border-t border-foam/70' : ''
                      } ${done ? 'opacity-45' : ''} ${live ? 'bg-ocean/[0.04]' : ''}`}
                    >
                      <span className="text-sm font-bold text-navy md:text-[15px]">
                        {heat.divisionName}
                      </span>
                      <span className="whitespace-nowrap text-[13px] text-navy/70 md:text-[15px]">
                        {heat.roundName} HEAT {heat.heatNumber}
                      </span>
                      {live && (
                        <span className="rounded-full bg-ocean px-2 py-0.5 text-[10px] font-bold text-white">
                          진행 중
                        </span>
                      )}
                      <span
                        className={`ml-auto shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold md:px-2.5 md:py-1 md:text-xs ${info.chip}`}
                      >
                        {info.label}
                      </span>
                      {mine.length > 0 && (
                        <span className="w-full text-xs font-semibold text-ocean">
                          {mine.join(' · ')} 선수 출전
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* 동시 진행 안내 — 2일차에 남녀가 다른 타워에서 같이 돈다 */}
      {usesSecondary && !searching && (
        <p className="mt-4 text-xs leading-relaxed text-navy/50 md:text-sm">
          같은 시각에 두 경기가 표시되면 두 타워에서 동시에 진행됩니다. 본인 히트의 타워를 확인하고
          시작 20분 전까지 해당 선수 대기석으로 이동해 주세요.
        </p>
      )}

      <p className="mt-4 rounded-xl bg-sand px-4 py-3 text-xs leading-relaxed text-navy/60 md:text-sm">
        파도와 기상 상황에 따라 경기 시각은 앞뒤로 조정될 수 있습니다. 당일 진행 상황은{' '}
        <a
          href={liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-ocean underline underline-offset-2"
        >
          실시간 대진표
        </a>
        와 현장 안내방송을 확인해 주세요.
      </p>
    </div>
  );
}
