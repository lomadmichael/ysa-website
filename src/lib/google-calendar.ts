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
} from './calendar-utils';

// 편의상 re-export (서버 컴포넌트에서 한 번의 import로 쓰도록)
export {
  type CalendarEvent,
  formatEventDate,
  getDaysUntil,
  getKstParts,
  groupEventsByYear,
  groupEventsByMonth,
} from './calendar-utils';

// 환경변수로 덮어쓸 수 있게 하되, 기본값으로 주신 캘린더 ID 사용
const CALENDAR_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID ??
  'fecd0424bafe81fc689a66b47881ef925085a618b83b82bcadb3213c21a4b9d0@group.calendar.google.com';

const ICAL_URL = `https://calendar.google.com/calendar/ical/${encodeURIComponent(CALENDAR_ID)}/public/basic.ics`;

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

/**
 * Google Calendar iCal 피드를 가져와서 이벤트 배열로 변환
 */
export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  try {
    const res = await fetch(ICAL_URL, {
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
        status: getEventStatus(start, end),
      });
    }

    events.sort((a, b) => a.start.getTime() - b.start.getTime());

    return events;
  } catch (e) {
    console.warn('[google-calendar] error:', e);
    return [];
  }
}
