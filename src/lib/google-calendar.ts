/**
 * Google Calendar iCal 연동 (서버 전용)
 *
 * node-ical은 Node.js 전용 모듈이므로 이 파일은 서버 컴포넌트에서만 import 가능합니다.
 * 클라이언트 컴포넌트에서는 대신 `./calendar-utils`를 import하세요.
 */
import ical, { type VEvent } from 'node-ical';
import {
  type CalendarEvent,
  getEventStatus,
  mergeEventSeries,
  normalizeRoundText,
} from './calendar-utils';

// 편의상 re-export (서버 컴포넌트에서 한 번의 import로 쓰도록)
export {
  type CalendarEvent,
  formatEventDate,
  getDaysUntil,
  getKstParts,
  groupEventsByYear,
  groupEventsByMonth,
  mergeEventSeries,
} from './calendar-utils';

/**
 * 사이트에 표시할 Google Calendar ID 목록.
 *
 * 환경변수 NEXT_PUBLIC_GOOGLE_CALENDAR_IDS (쉼표 구분)로 덮어쓸 수 있음.
 * 기본값:
 * - 양양군서핑협회 메인 (대회/교육)
 * - 후반기 프로그램 접수 일정
 */
const DEFAULT_CALENDAR_IDS = [
  'fecd0424bafe81fc689a66b47881ef925085a618b83b82bcadb3213c21a4b9d0@group.calendar.google.com',
  '58339465c94c749d2b23e272800602b3c201b204526ea4a2501e3861972e496b@group.calendar.google.com',
];

function getCalendarIds(): string[] {
  const envValue = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_IDS;
  if (envValue) {
    return envValue
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  // 단일 캘린더 환경변수 fallback (이전 버전 호환)
  const single = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID;
  if (single) return [single];
  return DEFAULT_CALENDAR_IDS;
}

function icalUrl(calendarId: string): string {
  return `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`;
}

/**
 * description에서 [변경] 이력 줄 제거
 */
function cleanDescription(raw: string): string {
  if (!raw) return '';
  return raw
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('[변경]'))
    .join('\n')
    .trim();
}

/** 단일 캘린더 iCal 페치 → CalendarEvent[] */
async function fetchSingleCalendar(calendarId: string): Promise<CalendarEvent[]> {
  try {
    const res = await fetch(icalUrl(calendarId), {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.warn(
        `[google-calendar] fetch failed for ${calendarId}:`,
        res.status,
        res.statusText,
      );
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
        title: normalizeRoundText((vevent.summary as string) || '제목 없음'),
        description: cleanDescription((vevent.description as string) || ''),
        location: (vevent.location as string) || '',
        start,
        end,
        allDay,
        url: (vevent.url as string) || null,
        status: getEventStatus(start, end),
      });
    }

    return events;
  } catch (e) {
    console.warn(`[google-calendar] error for ${calendarId}:`, e);
    return [];
  }
}

/**
 * 모든 Google Calendar iCal 피드를 병렬로 페치해서 병합, 정렬, 시리즈 묶기까지 처리.
 */
export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  const calendarIds = getCalendarIds();
  const results = await Promise.all(calendarIds.map(fetchSingleCalendar));

  // 여러 캘린더 합치기
  const allEvents = results.flat();

  // uid 중복 제거 (같은 일정이 여러 캘린더에 등록된 경우)
  const seen = new Set<string>();
  const unique: CalendarEvent[] = [];
  for (const event of allEvents) {
    if (seen.has(event.uid)) continue;
    seen.add(event.uid);
    unique.push(event);
  }

  // 시작일 오름차순 정렬
  unique.sort((a, b) => a.start.getTime() - b.start.getTime());

  // 다일차 시리즈 병합 ((Day1), (Day2) 등을 하나로 묶음)
  return mergeEventSeries(unique);
}
