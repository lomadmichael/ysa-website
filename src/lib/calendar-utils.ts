/**
 * Calendar 관련 순수 유틸 + 타입
 *
 * 이 파일은 서버 전용 의존성 없이 순수 JS/TS만 사용하므로
 * 클라이언트 컴포넌트에서도 안전하게 import할 수 있습니다.
 */

/** 카테고리 분류 — 제목/설명 키워드 기반 */
export type EventCategory = 'competition' | 'education' | 'event';

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
  /** 회차 시리즈의 총 회차 수 (예: 10회 과정이면 10) */
  seriesTotal?: number;
  /** 회차 시리즈 내 현재 회차 (1부터 시작) */
  seriesIndex?: number;
  /** 카테고리: 대회/교육/행사 중 하나 */
  category?: EventCategory;
}

/** 제목/설명 키워드로 카테고리 자동 분류 */
export function categorizeEvent(event: CalendarEvent): EventCategory {
  const text = `${event.title} ${event.description}`.toLowerCase();
  if (/대회|페스티벌|championship|cup|배\s|경기/i.test(text)) return 'competition';
  if (/교육|강습|워크샵|training|교실|course|클래스|레슨/i.test(text)) return 'education';
  return 'event';
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
 * 시리즈 패턴 종류
 * - 'intensive': Day/일차/일 (집중 연속 과정 → 병합 대상)
 * - 'sequential': 회차 (순차 독립 레슨 → 병합 안 함, 인덱스 부여)
 */
type SeriesKind = 'intensive' | 'sequential';

interface SeriesParsed {
  /** 시리즈 base 이름 (예: "랜드서핑 교실 상반기") */
  base: string;
  /** 차수 번호 (1부터) */
  day: number;
  /** 시리즈 종류 */
  kind: SeriesKind;
  /** 차수 뒤에 붙은 서브타이틀 (예: "- 메커니즘"에서 "메커니즘") */
  subtitle?: string;
}

/**
 * 제목에서 차수 정보 추출
 *
 * 지원 패턴:
 * - intensive: (Day N), Day N, (N일차), N일차, (N일), (N/M)
 *   → "연속 N일 교육" 의미. mergeEventSeries가 1개 카드로 병합.
 * - sequential: (회차N), (N회차), 회차N, N회차
 *   → "순차 N번째 레슨" 의미. 각 회차 독립 카드 유지 + seriesIndex 부여.
 *
 * 차수 뒤에 " - 서브타이틀"이 붙어 있으면 subtitle로 분리해서 반환.
 * 예: "랜드서핑 교실 상반기 1회차 - 메커니즘"
 *     → { base: "랜드서핑 교실 상반기", day: 1, kind: 'sequential', subtitle: "메커니즘" }
 *
 * @returns SeriesParsed | null (매치 안 되면 null)
 */
function extractSeriesInfo(title: string): SeriesParsed | null {
  // 각 패턴은 차수 부분만 매치하고, 뒤에 optional " - 서브타이틀"을 허용한다.
  // [base](공백)[차수패턴](공백하이픈공백서브타이틀)?
  const tail = /(?:\s*[-–·]\s*(.+?))?\s*$/.source; // optional subtitle suffix

  type PatternSpec = { regex: RegExp; kind: SeriesKind };
  const specs: PatternSpec[] = [
    // --- intensive: Day / 일차 / 일 / N/M ---
    { regex: new RegExp(`^(.+?)\\s*\\(\\s*Day\\s*(\\d+)\\s*\\)${tail}`, 'i'), kind: 'intensive' },
    { regex: new RegExp(`^(.+?)\\s*\\(\\s*(\\d+)\\s*일차\\s*\\)${tail}`), kind: 'intensive' },
    { regex: new RegExp(`^(.+?)\\s*\\(\\s*(\\d+)\\s*일\\s*\\)${tail}`), kind: 'intensive' },
    { regex: new RegExp(`^(.+?)\\s*\\(\\s*(\\d+)\\s*\\/\\s*\\d+\\s*\\)${tail}`), kind: 'intensive' },
    { regex: new RegExp(`^(.+?)\\s+Day\\s*(\\d+)${tail}`, 'i'), kind: 'intensive' },
    { regex: new RegExp(`^(.+?)\\s+(\\d+)\\s*일차${tail}`), kind: 'intensive' },
    // --- sequential: 회차 ---
    { regex: new RegExp(`^(.+?)\\s*\\(\\s*(\\d+)\\s*회차\\s*\\)${tail}`), kind: 'sequential' },
    { regex: new RegExp(`^(.+?)\\s+(\\d+)\\s*회차${tail}`), kind: 'sequential' },
  ];

  for (const { regex, kind } of specs) {
    const m = title.match(regex);
    if (m && m[1] && m[2]) {
      const subtitle = m[3]?.trim();
      return {
        base: m[1].trim(),
        day: Number(m[2]),
        kind,
        subtitle: subtitle || undefined,
      };
    }
  }
  return null;
}

/**
 * 단일 이벤트지만 여러 날에 걸친 시간제 이벤트 감지 → dayCount/dailyStartTime/dailyEndTime 자동 설정.
 *
 * 예시:
 * - "심판교육 1기" start: 4/23 09:00, end: 4/24 18:00
 *   → dayCount: 2, dailyStartTime: "09:00", dailyEndTime: "18:00"
 *
 * 이미 dayCount가 설정된 이벤트(병합된 시리즈)는 건드리지 않음.
 * 종일 이벤트도 기존 로직이 처리하므로 건드리지 않음.
 */
export function attachMultiDayMeta(events: CalendarEvent[]): CalendarEvent[] {
  return events.map((event) => {
    if (event.dayCount !== undefined) return event;
    if (event.allDay) return event;

    const sParts = getKstParts(event.start);
    const eParts = getKstParts(event.end);
    const sameDay =
      sParts.year === eParts.year &&
      sParts.month === eParts.month &&
      sParts.day === eParts.day;
    if (sameDay) return event;

    // 일수 계산 (KST 자정 기준)
    const sUtc = Date.UTC(sParts.year, sParts.month - 1, sParts.day);
    const eUtc = Date.UTC(eParts.year, eParts.month - 1, eParts.day);
    const days = Math.round((eUtc - sUtc) / (24 * 60 * 60 * 1000)) + 1;
    if (days < 2) return event;

    return {
      ...event,
      dayCount: days,
      dailyStartTime: `${sParts.hour}:${sParts.minute}`,
      dailyEndTime: `${eParts.hour}:${eParts.minute}`,
    };
  });
}

/**
 * 시리즈 정보 기반으로 이벤트를 처리.
 *
 * 두 가지 처리 방식을 시리즈 kind에 따라 분기:
 *
 * 1. **intensive** (Day/일차): 연속 N일 집중 과정
 *    → 같은 base의 이벤트들을 1개 카드로 **병합**. dayCount 설정.
 *    예: "서프레스큐 교실 1기 (Day1)" 4/20 + "(Day2)" 4/21
 *        → "서프레스큐 교실 1기" (4/20~4/21, 2일 과정)
 *
 * 2. **sequential** (회차): 순차 독립 레슨
 *    → 각 회차 카드 **유지**. seriesIndex/seriesTotal 부여.
 *    예: "랜드서핑 교실 상반기 1회차 - 메커니즘", "2회차 - 스탠스" ... 10회차
 *        → 10개 카드 유지, 각 카드에 { seriesIndex: n, seriesTotal: 10 }
 *
 * 차수 정보 없는 이벤트는 그대로 standalone.
 * 차수 정보 있지만 시리즈에 1개뿐이면:
 *   - intensive: base 제목으로 치환 (기존 동작 유지)
 *   - sequential: 원 제목 유지 + seriesTotal=1 부여
 */
export function mergeEventSeries(events: CalendarEvent[]): CalendarEvent[] {
  // base(+kind) 단위로 그룹화. 같은 base라도 kind가 다르면 분리.
  const seriesMap = new Map<
    string,
    { kind: SeriesKind; base: string; items: Array<{ event: CalendarEvent; day: number }> }
  >();
  const standalone: CalendarEvent[] = [];

  for (const event of events) {
    const parsed = extractSeriesInfo(event.title);
    if (!parsed) {
      standalone.push(event);
      continue;
    }
    const key = `${parsed.kind}::${parsed.base}`;
    if (!seriesMap.has(key)) {
      seriesMap.set(key, { kind: parsed.kind, base: parsed.base, items: [] });
    }
    seriesMap.get(key)!.items.push({ event, day: parsed.day });
  }

  const result: CalendarEvent[] = [...standalone];

  for (const { kind, base, items } of seriesMap.values()) {
    if (kind === 'sequential') {
      // 회차 시리즈: 병합하지 않고 각 카드 유지 + 시리즈 인덱스 부여
      const total = items.length;
      // 회차 번호 기준으로 정렬 (표시 순서는 date 기준이 아닌 series index 기준)
      items.sort((a, b) => a.day - b.day);
      for (const { event, day } of items) {
        result.push({
          ...event,
          seriesIndex: day,
          seriesTotal: total,
        });
      }
      continue;
    }

    // intensive 시리즈: 기존 병합 로직
    if (items.length === 1) {
      result.push({ ...items[0]!.event, title: base });
      continue;
    }

    const sorted = [...items].sort(
      (a, b) => a.event.start.getTime() - b.event.start.getTime(),
    );
    const first = sorted[0]!.event;
    const last = sorted[sorted.length - 1]!.event;

    const startParts = sorted.map((s) => getKstParts(s.event.start));
    const endParts = sorted.map((s) => getKstParts(s.event.end));
    const allStartSame = startParts.every(
      (p) => p.hour === startParts[0]!.hour && p.minute === startParts[0]!.minute,
    );
    const allEndSame = endParts.every(
      (p) => p.hour === endParts[0]!.hour && p.minute === endParts[0]!.minute,
    );

    result.push({
      uid: `series-${base}-${first.uid}`,
      title: base,
      description: first.description,
      location: first.location,
      start: first.start,
      end: last.end,
      allDay: first.allDay,
      url: first.url,
      status: first.status,
      dayCount: sorted.length,
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

  result.sort((a, b) => a.start.getTime() - b.start.getTime());
  return result;
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
