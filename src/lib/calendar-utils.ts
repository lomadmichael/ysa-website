/**
 * Calendar 관련 순수 유틸 + 타입
 *
 * 이 파일은 서버 전용 의존성 없이 순수 JS/TS만 사용하므로
 * 클라이언트 컴포넌트에서도 안전하게 import할 수 있습니다.
 */

export interface CalendarEvent {
  uid: string;
  title: string;
  description: string;
  location: string;
  start: Date;
  end: Date;
  allDay: boolean;
  url: string | null;
  /** 오늘 기준 상태 */
  status: 'upcoming' | 'ongoing' | 'past';
  /** 다일차 시리즈일 경우 총 일수. 단일 일정은 1 */
  dayCount?: number;
  /** 다일차일 경우 매일 시작 시간 (일관될 때만) */
  dailyStartTime?: string;
  /** 다일차일 경우 매일 종료 시간 (일관될 때만) */
  dailyEndTime?: string;
}

const TZ = 'Asia/Seoul';
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * 오늘(KST) 기준 이벤트까지 남은 일수
 * - 오늘 시작 → 0
 * - 내일 시작 → 1
 * - 어제 종료 → -1
 */
export function getDaysUntil(event: CalendarEvent): number {
  const now = new Date();
  const nowInKst = new Date(now.getTime() + KST_OFFSET_MS);
  const todayMidnightUtc =
    Date.UTC(
      nowInKst.getUTCFullYear(),
      nowInKst.getUTCMonth(),
      nowInKst.getUTCDate(),
    ) - KST_OFFSET_MS;

  const eventStartKst = new Date(event.start.getTime() + KST_OFFSET_MS);
  const eventMidnightUtc =
    Date.UTC(
      eventStartKst.getUTCFullYear(),
      eventStartKst.getUTCMonth(),
      eventStartKst.getUTCDate(),
    ) - KST_OFFSET_MS;

  return Math.round(
    (eventMidnightUtc - todayMidnightUtc) / (24 * 60 * 60 * 1000),
  );
}

/**
 * 일정 상태 판정 (한국 시간 기준)
 */
export function getEventStatus(start: Date, end: Date): CalendarEvent['status'] {
  const now = new Date();
  const nowInKst = new Date(now.getTime() + KST_OFFSET_MS);
  const kstMidnightUtcMs =
    Date.UTC(
      nowInKst.getUTCFullYear(),
      nowInKst.getUTCMonth(),
      nowInKst.getUTCDate(),
    ) - KST_OFFSET_MS;

  const todayStart = new Date(kstMidnightUtcMs);
  const todayEnd = new Date(kstMidnightUtcMs + 24 * 60 * 60 * 1000);

  if (end < todayStart) return 'past';
  if (start >= todayEnd) return 'upcoming';
  return 'ongoing';
}

/** 서버 타임존과 무관하게 한국 시간 기준으로 연/월/일/시/분/요일 추출 */
export function getKstParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const hour = get('hour') === '24' ? '00' : get('hour');
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour,
    minute: get('minute'),
    weekday: get('weekday'), // "Mon", "Tue", ...
  };
}

const WEEKDAY_KO: Record<string, string> = {
  Sun: '일',
  Mon: '월',
  Tue: '화',
  Wed: '수',
  Thu: '목',
  Fri: '금',
  Sat: '토',
};

/**
 * 날짜 범위 포맷 (한국어, 한국 시간대 고정)
 *
 * - 단일 종일 하루: "2026.04.15"
 * - 단일 종일 여러날: "2026.04.15 ~ 04.17"
 * - 단일 시간제 하루: "2026.04.15 (월) 14:00 ~ 17:00"
 * - 단일 시간제 여러날: "2026.04.15 ~ 04.17"
 * - 다일차 시리즈 (시간 일관): "2026.04.20 ~ 04.21 · 09:00~18:00"
 * - 다일차 시리즈 (시간 다름): "2026.04.20 ~ 04.21"
 */
export function formatEventDate(event: CalendarEvent): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const start = event.start;
  const end = event.end;

  const actualEnd = event.allDay
    ? new Date(end.getTime() - 24 * 60 * 60 * 1000)
    : end;

  const s = getKstParts(start);
  const e = getKstParts(actualEnd);

  const sameDay = s.year === e.year && s.month === e.month && s.day === e.day;
  const startStr = `${s.year}.${pad(s.month)}.${pad(s.day)}`;

  // 다일차 시리즈
  if (event.dayCount && event.dayCount > 1) {
    const range = `${startStr} ~ ${pad(e.month)}.${pad(e.day)}`;
    if (event.dailyStartTime && event.dailyEndTime) {
      return `${range} · 매일 ${event.dailyStartTime}~${event.dailyEndTime}`;
    }
    return range;
  }

  if (event.allDay) {
    if (sameDay) return startStr;
    return `${startStr} ~ ${pad(e.month)}.${pad(e.day)}`;
  }

  const weekday = WEEKDAY_KO[s.weekday] ?? s.weekday;
  const endParts = getKstParts(end);
  const startTime = `${s.hour}:${s.minute}`;
  const endTime = `${endParts.hour}:${endParts.minute}`;

  if (sameDay) {
    return `${startStr} (${weekday}) ${startTime} ~ ${endTime}`;
  }
  return `${startStr} ~ ${pad(e.month)}.${pad(e.day)}`;
}

/**
 * 제목에서 "회차N" 형식을 "N회차"로 정규화한다.
 *
 * 예시:
 * - "랜드서핑 교실 상반기 회차1 - 메커니즘" → "랜드서핑 교실 상반기 1회차 - 메커니즘"
 * - "맞춤형 서핑교실 회차7"              → "맞춤형 서핑교실 7회차"
 * - "랜드서핑 교실 상반기 1회차"          → (변화 없음)
 * - "회차별 운영 계획"                   → (변화 없음, 숫자 뒤따르지 않음)
 *
 * 위치 무관하게 문자열 전체에서 "회차<숫자>" 패턴을 모두 교체한다.
 */
export function normalizeRoundText(title: string): string {
  if (!title) return title;
  return title.replace(/회차\s*(\d+)/g, '$1회차');
}

/**
 * 제목에서 차수 정보 추출
 * 지원 패턴:
 * - "(Day N)", "Day N", "(N일차)", "N일차", "(N일)", "(N/M)"
 * - "(회차N)", "(N회차)", "회차N", "N회차"
 * @returns base 제목 + day 번호. 매치 안 되면 null
 */
function extractSeriesInfo(
  title: string,
): { base: string; day: number } | null {
  const patterns: RegExp[] = [
    // 괄호 있는 패턴
    /^(.+?)\s*\(\s*Day\s*(\d+)\s*\)\s*$/i,
    /^(.+?)\s*\(\s*(\d+)\s*일차\s*\)\s*$/,
    /^(.+?)\s*\(\s*(\d+)\s*일\s*\)\s*$/,
    /^(.+?)\s*\(\s*(\d+)\s*\/\s*\d+\s*\)\s*$/,
    /^(.+?)\s*\(\s*회차\s*(\d+)\s*\)\s*$/,
    /^(.+?)\s*\(\s*(\d+)\s*회차\s*\)\s*$/,
    // 괄호 없는 패턴 (공백 구분자 필수)
    /^(.+?)\s+Day\s*(\d+)\s*$/i,
    /^(.+?)\s+(\d+)\s*일차\s*$/,
    /^(.+?)\s+회차\s*(\d+)\s*$/,
    /^(.+?)\s+(\d+)\s*회차\s*$/,
  ];
  for (const p of patterns) {
    const m = title.match(p);
    if (m && m[1] && m[2]) {
      return { base: m[1].trim(), day: Number(m[2]) };
    }
  }
  return null;
}

/**
 * 같은 base 제목을 가진 다일차 일정을 하나로 병합
 *
 * 예시:
 * - "서프레스큐 교실 1기 (Day1)" 4/20
 * - "서프레스큐 교실 1기 (Day2)" 4/21
 * → "서프레스큐 교실 1기" (4/20 ~ 4/21, 2일 과정)
 *
 * 단, 차수 정보가 있어도 단독 일정(시리즈에 1개뿐)은 Day 표기만 제거하고 병합 안 함.
 */
export function mergeEventSeries(events: CalendarEvent[]): CalendarEvent[] {
  const seriesMap = new Map<string, CalendarEvent[]>();
  const standalone: CalendarEvent[] = [];

  for (const event of events) {
    const parsed = extractSeriesInfo(event.title);
    if (parsed) {
      if (!seriesMap.has(parsed.base)) seriesMap.set(parsed.base, []);
      seriesMap.get(parsed.base)!.push(event);
    } else {
      standalone.push(event);
    }
  }

  const merged: CalendarEvent[] = [...standalone];

  for (const [base, series] of seriesMap) {
    if (series.length === 1) {
      // 단독이면 "(DayN)" 접미사만 제거
      merged.push({ ...series[0]!, title: base });
      continue;
    }

    series.sort((a, b) => a.start.getTime() - b.start.getTime());
    const first = series[0]!;
    const last = series[series.length - 1]!;

    // 매일 시작/종료 시간이 일관되는지 확인
    const startParts = series.map((e) => getKstParts(e.start));
    const endParts = series.map((e) => getKstParts(e.end));
    const allStartSame = startParts.every(
      (p) => p.hour === startParts[0]!.hour && p.minute === startParts[0]!.minute,
    );
    const allEndSame = endParts.every(
      (p) => p.hour === endParts[0]!.hour && p.minute === endParts[0]!.minute,
    );

    merged.push({
      uid: `series-${base}-${first.uid}`,
      title: base,
      description: first.description,
      location: first.location,
      start: first.start,
      end: last.end,
      allDay: first.allDay,
      url: first.url,
      status: first.status,
      dayCount: series.length,
      dailyStartTime:
        allStartSame && !first.allDay
          ? `${startParts[0]!.hour}:${startParts[0]!.minute}`
          : undefined,
      dailyEndTime:
        allEndSame && !first.allDay
          ? `${endParts[0]!.hour}:${endParts[0]!.minute}`
          : undefined,
    });
  }

  merged.sort((a, b) => a.start.getTime() - b.start.getTime());
  return merged;
}

/** 연도별 그룹화 (KST 기준) */
export function groupEventsByYear(
  events: CalendarEvent[],
): Record<number, CalendarEvent[]> {
  const groups: Record<number, CalendarEvent[]> = {};
  for (const event of events) {
    const { year } = getKstParts(event.start);
    if (!groups[year]) groups[year] = [];
    groups[year].push(event);
  }
  return groups;
}

/** 월별 그룹화 (KST 기준) */
export function groupEventsByMonth(
  events: CalendarEvent[],
): { key: string; year: number; month: number; events: CalendarEvent[] }[] {
  const groupMap = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const { year, month } = getKstParts(event.start);
    const key = `${year}-${String(month).padStart(2, '0')}`;
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(event);
  }
  return Array.from(groupMap.entries())
    .map(([key, events]) => {
      const [yearStr, monthStr] = key.split('-');
      return {
        key,
        year: Number(yearStr),
        month: Number(monthStr),
        events,
      };
    })
    .sort((a, b) => a.key.localeCompare(b.key));
}
