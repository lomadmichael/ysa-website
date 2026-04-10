/**
 * Calendar 관련 순수 유틸 + 타입
 *
 * 이 파일은 node-ical 같은 Node 전용 의존성 없이 순수 JS/TS만 사용하므로
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
