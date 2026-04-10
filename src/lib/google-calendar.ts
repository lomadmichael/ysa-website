/**
 * Google Calendar iCal 연동
 *
 * 공개 Google Calendar의 iCal 피드를 fetch해서 파싱합니다.
 * API 키 불필요. 캘린더가 "공개" 설정되어 있어야 합니다.
 */

import ical, { type VEvent } from 'node-ical';

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

// 환경변수로 덮어쓸 수 있게 하되, 기본값으로 주신 캘린더 ID 사용
const CALENDAR_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID ??
  'fecd0424bafe81fc689a66b47881ef925085a618b83b82bcadb3213c21a4b9d0@group.calendar.google.com';

const ICAL_URL = `https://calendar.google.com/calendar/ical/${encodeURIComponent(CALENDAR_ID)}/public/basic.ics`;

/**
 * description에서 [변경] 이력 줄 제거
 * Google Calendar에 관리자가 수동으로 남긴 변경 이력(예: "[변경] 4/13→4/20 ...")은
 * 방문자에게 불필요한 정보이므로 숨김.
 */
function cleanDescription(raw: string): string {
  if (!raw) return '';
  return raw
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('[변경]'))
    .join('\n')
    .trim();
}

/**
 * 일정 상태 판정 (오늘 기준)
 * - upcoming: 시작일이 내일 이후
 * - ongoing: 오늘이 시작~종료 범위 안
 * - past: 종료일이 어제 이전
 */
function getStatus(start: Date, end: Date): CalendarEvent['status'] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  if (end < todayStart) return 'past';
  if (start >= todayEnd) return 'upcoming';
  return 'ongoing';
}

/**
 * Google Calendar iCal 피드를 가져와서 이벤트 배열로 변환
 *
 * @returns 시작일 오름차순 정렬된 이벤트 배열. 에러 시 빈 배열.
 */
export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  try {
    const res = await fetch(ICAL_URL, {
      // 1시간 캐싱 (ISR)
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.warn('[google-calendar] fetch failed:', res.status, res.statusText);
      return [];
    }

    const icsText = await res.text();
    const parsed = ical.sync.parseICS(icsText);

    const events: CalendarEvent[] = [];

    for (const key of Object.keys(parsed)) {
      const item = parsed[key];
      if (!item || item.type !== 'VEVENT') continue;

      const vevent = item as VEvent;
      if (!vevent.start || !vevent.end) continue;

      const start = new Date(vevent.start);
      const end = new Date(vevent.end);

      // iCal DATE (종일 일정)은 dateOnly 속성이 있거나 시간이 00:00:00
      const allDay =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (vevent.start as any).dateOnly === true ||
        (start.getUTCHours() === 0 &&
          start.getUTCMinutes() === 0 &&
          end.getUTCHours() === 0 &&
          end.getUTCMinutes() === 0 &&
          end.getTime() - start.getTime() >= 24 * 60 * 60 * 1000);

      events.push({
        uid: vevent.uid || key,
        title: (vevent.summary as string) || '제목 없음',
        description: cleanDescription((vevent.description as string) || ''),
        location: (vevent.location as string) || '',
        start,
        end,
        allDay,
        url: (vevent.url as string) || null,
        status: getStatus(start, end),
      });
    }

    // 시작일 오름차순 정렬
    events.sort((a, b) => a.start.getTime() - b.start.getTime());

    return events;
  } catch (e) {
    console.warn('[google-calendar] error:', e);
    return [];
  }
}

/**
 * 날짜 범위 포맷 (한국어)
 * - 종일 하루: "2026.04.15"
 * - 종일 여러날: "2026.04.15 ~ 04.17"
 * - 시간 포함 하루: "2026.04.15 (월) 14:00 ~ 17:00"
 * - 시간 포함 여러날: "2026.04.15 ~ 04.17"
 */
export function formatEventDate(event: CalendarEvent): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const start = event.start;
  const end = event.end;

  // 종일 일정은 end가 다음날 00:00으로 저장됨. 실제 종료일 = end - 1day
  const actualEnd = event.allDay
    ? new Date(end.getTime() - 24 * 60 * 60 * 1000)
    : end;

  const sameDay =
    start.getFullYear() === actualEnd.getFullYear() &&
    start.getMonth() === actualEnd.getMonth() &&
    start.getDate() === actualEnd.getDate();

  const startStr = `${start.getFullYear()}.${pad(start.getMonth() + 1)}.${pad(start.getDate())}`;

  if (event.allDay) {
    if (sameDay) return startStr;
    return `${startStr} ~ ${pad(actualEnd.getMonth() + 1)}.${pad(actualEnd.getDate())}`;
  }

  const weekday = ['일', '월', '화', '수', '목', '금', '토'][start.getDay()];
  const startTime = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
  const endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`;

  if (sameDay) {
    return `${startStr} (${weekday}) ${startTime} ~ ${endTime}`;
  }
  return `${startStr} ~ ${pad(actualEnd.getMonth() + 1)}.${pad(actualEnd.getDate())}`;
}

/**
 * 연도별로 이벤트 그룹화
 */
export function groupEventsByYear(events: CalendarEvent[]): Record<number, CalendarEvent[]> {
  const groups: Record<number, CalendarEvent[]> = {};
  for (const event of events) {
    const year = event.start.getFullYear();
    if (!groups[year]) groups[year] = [];
    groups[year].push(event);
  }
  return groups;
}

/**
 * 월별로 이벤트 그룹화 (같은 연도 내)
 * 키: "2026-04" 형식
 */
export function groupEventsByMonth(
  events: CalendarEvent[],
): { key: string; year: number; month: number; events: CalendarEvent[] }[] {
  const groupMap = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const year = event.start.getFullYear();
    const month = event.start.getMonth() + 1;
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
