/**
 * cert-manager(라인업 / golineup.kr) 공개 대진표 API 클라이언트.
 *
 * `/festival` 비기너 대회 탭에서 1라운드 히트 편성을 그대로 보여주기 위한 읽기 전용 연동이다.
 * 계약(응답 스키마)은 `cert-manager/docs/2026-entry-api-brief.md` 기준.
 *
 * ⚠️ 방어 원칙: 라인업 API 가 죽거나 스키마가 바뀌어도 페스티벌 페이지 전체가 죽으면 안 된다.
 * (lomad-homepage 가 Notion 조회 401 하나로 배포 전체가 브릭된 사고와 같은 패턴)
 * 그래서 이 모듈은 절대 throw 하지 않고 실패 시 `null` 을 돌려준다 — 화면 쪽에서 폴백을 그린다.
 */

/** 라인업 서비스 오리진 */
export const LINEUP_BASE_URL = 'https://golineup.kr';

/** 2026 대한서핑협회장배 비기너 서핑대회 슬러그 */
export const BEGINNER_COMP_SLUG = 'ksa-cup-2026-beginner';

/** 실시간 대진표·결과 공개 페이지 (새 창으로 연결) */
export const BEGINNER_LIVE_URL = `${LINEUP_BASE_URL}/live/${BEGINNER_COMP_SLUG}`;

export interface LineupAthlete {
  id?: string;
  /** 접수(entries) id — 사진 프록시(/api/athlete-photo/[entryId])의 키 */
  entry_id?: string | null;
  /** 빕(래시가드) 색 — red / yellow / white / blue / green / black */
  jersey: string | null;
  name: string;
  /** 소속 (미기재면 null) */
  affiliation: string | null;
  /** 서명 URL(단기 만료) — next/image 최적화 대상이 아니다 */
  photo_url: string | null;
  /** active / withdrawn 등 */
  athlete_status?: string | null;
}

export interface LineupHeat {
  id?: string;
  heat_number: number;
  /** upcoming / live / done */
  status?: string | null;
  athletes: LineupAthlete[];
}

export interface LineupRound {
  id?: string;
  name: string;
  round_order: number;
  /** 상위 라운드 진출 인원 */
  advance_count?: number | null;
  heat_size?: number | null;
  heat_duration_min?: number | null;
  heats: LineupHeat[];
}

export interface LineupDivision {
  id?: string;
  /** 남자부 / 여자부 */
  name: string;
  rounds: LineupRound[];
}

export interface LineupCompetition {
  name?: string;
  venue?: string | null;
  status?: string | null;
  starts_on?: string | null;
  ends_on?: string | null;
}

export interface LineupDivisionsResponse {
  competition?: LineupCompetition;
  divisions: LineupDivision[];
}

/** 응답이 우리가 기대하는 모양인지 최소한만 확인 (스키마가 바뀌어도 폴백으로 흐르게) */
function isDivisionsResponse(value: unknown): value is LineupDivisionsResponse {
  if (typeof value !== 'object' || value === null) return false;
  const divisions = (value as { divisions?: unknown }).divisions;
  if (!Array.isArray(divisions)) return false;
  return divisions.every(
    (division) =>
      typeof division === 'object' &&
      division !== null &&
      typeof (division as { name?: unknown }).name === 'string' &&
      Array.isArray((division as { rounds?: unknown }).rounds)
  );
}

/**
 * 대회 슬러그로 부문·라운드·히트 편성을 가져온다.
 *
 * - 서버 컴포넌트 전용 (SSR 첫 페인트에 대진표가 보여야 한다)
 * - 60초 캐시 — 히트 편성이 바뀌면 최대 1분 안에 반영된다
 * - 실패(네트워크/타임아웃/4xx/5xx/스키마 불일치)하면 `null`
 */
export async function fetchLineupDivisions(
  slug: string = BEGINNER_COMP_SLUG,
  opts?: {
    /** true = 데이터 캐시 우회 — 사진 서명 URL 이 만료됐을 때 신선한 URL 재획득용 */
    fresh?: boolean;
  }
): Promise<LineupDivisionsResponse | null> {
  try {
    const res = await fetch(
      `${LINEUP_BASE_URL}/api/public/comp-live/${slug}/divisions`,
      {
        ...(opts?.fresh ? { cache: 'no-store' as const } : { next: { revalidate: 60 } }),
        // 라인업이 응답하지 않을 때 페이지 렌더가 통째로 매달리지 않게 한다
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return null;

    const json: unknown = await res.json();
    return isDivisionsResponse(json) ? json : null;
  } catch {
    // 대진표를 못 불러와도 페스티벌 페이지는 계속 떠야 한다
    return null;
  }
}

/** 라운드 배열에서 1라운드를 고른다 (round_order 우선, 없으면 첫 라운드) */
export function firstRound(division: LineupDivision): LineupRound | null {
  if (!division.rounds?.length) return null;
  return (
    division.rounds.find((round) => round.round_order === 1) ??
    division.rounds[0]
  );
}
