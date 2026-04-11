/**
 * Google Calendar API v3 연동 (서버 전용)
 *
 * 공개 iCal 피드 대신 Calendar API v3 + API Key 인증을 사용합니다.
 * iCal 피드는 Google 측 캐시로 인해 수정/삭제 반영이 수 시간~수 일 지연되는
 * 문제가 있어서 실시간성이 필요한 시즌 운영에 부적합했습니다.
 *
 * Calendar API v3는:
 * - JSON 응답 (파싱 단순)
 * - 공개 캘린더는 API Key만으로 read 가능 (OAuth 불필요)
 * - 수정/삭제가 수 분 내 반영
 *
 * 필수 환경변수:
 * - GOOGLE_CALENDAR_API_KEY (서버 전용, NEXT_PUBLIC_ 접두사 없음)
 */
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

/** Calendar API v3 응답 타입 (필요한 필드만) */
interface GCalEvent {
  id: string;
  iCalUID?: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  status?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
}

interface GCalResponse {
  items?: GCalEvent[];
  nextPageToken?: string;
  error?: { code: number; message: string };
}

/**
 * 이벤트 단일 건 파싱: Calendar API 응답 → CalendarEvent
 * 반환 null = 파싱 불가 또는 취소된 이벤트
 */
function parseGCalEvent(item: GCalEvent): CalendarEvent | null {
  if (!item.start || !item.end) return null;
  if (item.status === 'cancelled') return null;

  // 종일 이벤트: start.date / end.date (YYYY-MM-DD)
  // 시간제 이벤트: start.dateTime / end.dateTime (ISO 8601 with TZ)
  const allDay = Boolean(item.start.date && !item.start.dateTime);

  let start: Date;
  let end: Date;

  if (allDay) {
    // 종일 이벤트의 end.date는 exclusive (DTEND:VALUE=DATE와 동일 규칙)
    start = new Date(item.start.date + 'T00:00:00Z');
    end = new Date(item.end.date + 'T00:00:00Z');
  } else {
    start = new Date(item.start.dateTime!);
    end = new Date(item.end.dateTime!);
  }

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

  return {
    uid: item.iCalUID || item.id,
    title: normalizeRoundText(item.summary || '제목 없음'),
    description: cleanDescription(item.description || ''),
    location: item.location || '',
    start,
    end,
    allDay,
    url: item.htmlLink || null,
    status: getEventStatus(start, end),
  };
}

/**
 * 단일 캘린더에서 이벤트를 페이지네이션으로 모두 가져옴
 */
async function fetchSingleCalendar(
  calendarId: string,
  apiKey: string,
): Promise<CalendarEvent[]> {
  // 1년 전부터 2년 후까지 (충분한 윈도우)
  const now = new Date();
  const timeMin = new Date(now.getFullYear() - 1, 0, 1).toISOString();
  const timeMax = new Date(now.getFullYear() + 2, 11, 31).toISOString();

  const events: CalendarEvent[] = [];
  let pageToken: string | undefined = undefined;

  try {
    // 최대 10페이지까지만 순회 (안전장치)
    for (let page = 0; page < 10; page++) {
      const params = new URLSearchParams({
        key: apiKey,
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '250',
        timeMin,
        timeMax,
        showDeleted: 'false',
      });
      if (pageToken) params.set('pageToken', pageToken);

      const url =
        'https://www.googleapis.com/calendar/v3/calendars/' +
        encodeURIComponent(calendarId) +
        '/events?' +
        params.toString();

      const res = await fetch(url, {
        // Calendar API는 실시간성이 생명. 5분 revalidate.
        next: { revalidate: 300 },
      });

      if (!res.ok) {
        console.warn(
          `[google-calendar] API fetch failed for ${calendarId}:`,
          res.status,
          res.statusText,
        );
        break;
      }

      const data = (await res.json()) as GCalResponse;

      if (data.error) {
        console.warn(
          `[google-calendar] API error for ${calendarId}:`,
          data.error,
        );
        break;
      }

      for (const item of data.items || []) {
        const parsed = parseGCalEvent(item);
        if (parsed) events.push(parsed);
      }

      if (!data.nextPageToken) break;
      pageToken = data.nextPageToken;
    }
  } catch (e) {
    console.warn(`[google-calendar] exception for ${calendarId}:`, e);
  }

  return events;
}

/**
 * 모든 Google Calendar를 병렬로 페치해서 병합, 정렬, 시리즈 묶기까지 처리.
 */
export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
  if (!apiKey) {
    console.warn(
      '[google-calendar] GOOGLE_CALENDAR_API_KEY 환경변수가 설정되지 않았습니다. 빈 배열 반환.',
    );
    return [];
  }

  const calendarIds = getCalendarIds();
  const results = await Promise.all(
    calendarIds.map((id) => fetchSingleCalendar(id, apiKey)),
  );

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
