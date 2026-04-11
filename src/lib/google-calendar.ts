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
  attachMultiDayMeta,
  categorizeEvent,
  extractTotalSessions,
  getEventStatus,
  mergeEventSeries,
  normalizeRoundText,
} from './calendar-utils';

// 편의상 re-export (서버 컴포넌트에서 한 번의 import로 쓰도록)
export {
  type CalendarEvent,
  type EventCategory,
  categorizeEvent,
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
const MAIN_CALENDAR_ID =
  'fecd0424bafe81fc689a66b47881ef925085a618b83b82bcadb3213c21a4b9d0@group.calendar.google.com';

/**
 * 서핑협회 접수일정 캘린더.
 * 여기에 속한 모든 이벤트는 제목과 무관하게 '접수' 카테고리로 강제 분류된다.
 */
const REGISTRATION_CALENDAR_ID =
  '58339465c94c749d2b23e272800602b3c201b204526ea4a2501e3861972e496b@group.calendar.google.com';

const DEFAULT_CALENDAR_IDS = [MAIN_CALENDAR_ID, REGISTRATION_CALENDAR_ID];

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
 * description 정리:
 * - 리터럴 "\n" (백슬래시+n) 문자열을 실제 개행으로 변환
 *   (캘린더 입력 시 이스케이프된 경우 대비)
 * - [변경] 이력 줄 제거
 * - HTML 태그 일부 제거 (Google Calendar description은 HTML 허용)
 */
function cleanDescription(raw: string): string {
  if (!raw) return '';
  return raw
    // 리터럴 \n (2글자) → 실제 개행
    .replace(/\\n/g, '\n')
    // <br>, <br/>, <br /> → 개행
    .replace(/<br\s*\/?>/gi, '\n')
    // 나머지 HTML 태그 제거
    .replace(/<[^>]+>/g, '')
    // HTML 엔티티 몇 가지
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
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
function parseGCalEvent(
  item: GCalEvent,
  sourceCalendarId: string,
): CalendarEvent | null {
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

  const title = normalizeRoundText(item.summary || '제목 없음');
  const description = cleanDescription(item.description || '');

  // 접수 캘린더 이벤트는 "접수 시작" 같은 단일 알림 성격이므로
  // 강좌 회차 매핑 (랜드서핑=10, 맞춤형=20 등)을 적용하지 않음.
  // 잘못하면 "맞춤형서핑교실 3,4기 접수 시작"에 "20회 과정" 뱃지가
  // 붙는 오류가 생김.
  const isRegistrationEvent = sourceCalendarId === REGISTRATION_CALENDAR_ID;

  return {
    uid: item.iCalUID || item.id,
    title,
    description,
    location: item.location || '',
    start,
    end,
    allDay,
    url: item.htmlLink || null,
    status: getEventStatus(start, end),
    totalSessions: isRegistrationEvent
      ? undefined
      : extractTotalSessions(title, description),
    sourceCalendarId,
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
        const parsed = parseGCalEvent(item, calendarId);
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

  // 내부 행정용 이벤트 제거 ([업무] / [마감] 접두어)
  // 캘린더 원본에 남겨두되 사이트에는 노출하지 않음.
  const publicEvents = unique.filter(
    (e) => !/^\s*\[\s*(업무|마감)\s*\]/.test(e.title),
  );

  // 시작일 오름차순 정렬
  publicEvents.sort((a, b) => a.start.getTime() - b.start.getTime());

  // 시리즈 처리:
  // - intensive (Day/일차) → 병합 + dayCount
  // - sequential (회차) → 개별 유지 + seriesIndex/seriesTotal
  const withSeries = mergeEventSeries(publicEvents);

  // 병합 안 된 단일 이벤트 중 여러 날짜 timed event → dayCount 자동 설정
  // (예: 심판교육 1기처럼 4/23 09:00 ~ 4/24 18:00 단일 이벤트)
  const withMultiDay = attachMultiDayMeta(withSeries);

  // 카테고리 계산 (대회/교육/접수)
  // - 접수일정 캘린더 소속 이벤트는 제목/설명과 무관하게 '접수'(event)로 강제 분류
  // - 그 외는 키워드 기반 자동 분류
  return withMultiDay.map((e) => {
    if (e.sourceCalendarId === REGISTRATION_CALENDAR_ID) {
      return { ...e, category: 'event' as const };
    }
    return { ...e, category: categorizeEvent(e) };
  });
}
