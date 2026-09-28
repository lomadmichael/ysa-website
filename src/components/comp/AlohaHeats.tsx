import type { LineupDivision, LineupHeat } from '@/lib/lineup-api';

/**
 * 알로하 팀 챌린지 히트 편성 — lineup `comp-live/{slug}/divisions` 응답을 그대로 그린다.
 *
 * 팀 릴레이(team_relay) 모드는 한 히트에 4팀이 들어가고 팀원 4명이 같은 조끼 색을 입는다.
 * 그래서 선수를 **조끼 색으로 묶으면 곧 팀**이 된다 (팀 전용 필드가 API 에 생기기 전까지의 표시 방식).
 * 대진이 아직 없으면(rounds 비어 있음) 이 컴포넌트는 렌더되지 않는다 — 호출부에서 폴백을 그린다.
 */

const JERSEY: Record<string, { label: string; chip: string }> = {
  red: { label: 'RED', chip: 'bg-[#E63B2E] text-white' },
  blue: { label: 'BLUE', chip: 'bg-[#2F6FE0] text-white' },
  yellow: { label: 'YELLOW', chip: 'bg-[#FFD23F] text-black' },
  white: { label: 'WHITE', chip: 'bg-white text-black ring-1 ring-black/20' },
  green: { label: 'GREEN', chip: 'bg-[#2E9E5B] text-white' },
  black: { label: 'BLACK', chip: 'bg-black text-white' },
};

/** UTC ISO → KST "HH:MM" */
function kstTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000);
  if (Number.isNaN(d.getTime())) return null;
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

function groupByJersey(heat: LineupHeat) {
  const groups = new Map<string, string[]>();
  for (const a of heat.athletes ?? []) {
    if (a.athlete_status === 'withdrawn') continue;
    const key = a.jersey ?? 'etc';
    groups.set(key, [...(groups.get(key) ?? []), a.name]);
  }
  return [...groups.entries()];
}

export function hasHeats(divisions: LineupDivision[]): boolean {
  return divisions.some((d) => d.rounds?.some((r) => r.heats?.length));
}

export default function AlohaHeats({ divisions }: { divisions: LineupDivision[] }) {
  const rounds = divisions
    .flatMap((d) => d.rounds ?? [])
    .filter((r) => r.heats?.length)
    .sort((a, b) => a.round_order - b.round_order);

  return (
    <div className="space-y-8">
      {rounds.map((round) => (
        <div key={round.id ?? round.name}>
          <h4 className="mb-3 text-base font-extrabold text-black">{round.name}</h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...round.heats]
              .sort((a, b) => a.heat_number - b.heat_number)
              .map((heat) => {
                const time = kstTime(heat.scheduled_at);
                return (
                  <article
                    key={heat.id ?? heat.heat_number}
                    className="rounded-2xl border-2 border-black bg-white p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-black">HEAT {heat.heat_number}</span>
                      <span className="flex items-center gap-2 text-xs font-bold text-black/60">
                        {heat.status === 'live' && (
                          <span className="rounded-full bg-[#EC6C01] px-2 py-0.5 text-white">LIVE</span>
                        )}
                        {time && <span>{time}</span>}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {groupByJersey(heat).map(([jersey, names]) => {
                        const j = JERSEY[jersey];
                        return (
                          <li key={jersey} className="flex items-start gap-2 text-sm">
                            <span
                              className={`mt-0.5 w-16 shrink-0 rounded-md py-0.5 text-center text-[11px] font-black ${j?.chip ?? 'bg-black/10'}`}
                            >
                              {j?.label ?? '—'}
                            </span>
                            <span className="leading-snug text-black/80">{names.join(' · ')}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </article>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
