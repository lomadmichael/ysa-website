/**
 * 심판(REF)·강사(INS)교육 본인조회 화면용 순수 포맷 함수.
 * (서버·클라이언트 양쪽에서 쓰므로 server-only 를 붙이지 않는다. DB·네트워크 의존 없음)
 *
 * ★ 요일·일수·취소 기한은 모두 날짜에서 계산한다 — 하드코딩 금지.
 */

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'] as const;
const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

/** 교육 공통 안내 (운영자 제공 값). 심판·강사 공통이 아닌 것은 EDU_DETAILS 에. */
export const EDU_COMMON = {
  hours: '오전 9시 ~ 오후 6시',
  venue: '양양해양종합레포츠센터',
  address: '강원도 양양군 인구중앙길 122',
  fee: '무료',
  inquiryTel: '033-671-6155',
} as const;

export const EDU_DETAILS: Record<'REF' | 'INS', { label: string; subtitle: string; supplies: string }> = {
  REF: {
    label: '심판교육',
    subtitle: '양양군서핑협회 심판인증 교육',
    supplies: '필기구, 신분증, 편한 복장',
  },
  INS: {
    label: '강사교육',
    subtitle: '양양군서핑협회 강사인증 교육',
    supplies: '슈트, 수건, 샤워용품, 슬리퍼',
  },
};

export function eduDetail(certType: string) {
  return certType === 'REF' || certType === 'INS' ? EDU_DETAILS[certType] : null;
}

export function certLabel(certType: string): string {
  return eduDetail(certType)?.label ?? '교육';
}

/** "YYYY-MM-DD" → UTC 자정 Date (요일 계산용). */
function utcDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function parts(dt: Date) {
  return {
    y: dt.getUTCFullYear(),
    m: dt.getUTCMonth() + 1,
    d: dt.getUTCDate(),
    dow: DAY_NAMES[dt.getUTCDay()],
  };
}

/** "10월 24일(토)" */
export function formatDay(iso: string): string {
  if (!ISO_DATE.test(iso)) return iso;
  const p = parts(utcDate(iso));
  return `${p.m}월 ${p.d}일(${p.dow})`;
}

/**
 * "10월 24일(토) ~ 25일(일)" — 같은 달이면 종료의 월 생략,
 * 월이 바뀌면 "10월 31일(토) ~ 11월 1일(일)", 같은 날이면 하나만, 해가 바뀌면 연도 표기.
 */
export function formatRange(startISO: string, endISO: string): string {
  if (!ISO_DATE.test(startISO) || !ISO_DATE.test(endISO)) return `${startISO} ~ ${endISO}`;
  const s = parts(utcDate(startISO));
  const e = parts(utcDate(endISO));
  const start = `${s.m}월 ${s.d}일(${s.dow})`;
  if (startISO.slice(0, 10) === endISO.slice(0, 10)) return start;
  if (s.y !== e.y) return `${s.y}년 ${start} ~ ${e.y}년 ${e.m}월 ${e.d}일(${e.dow})`;
  const end = s.m === e.m ? `${e.d}일(${e.dow})` : `${e.m}월 ${e.d}일(${e.dow})`;
  return `${start} ~ ${end}`;
}

/** 시작일~종료일 포함 일수. 형식이 틀리면 null. */
export function dayCount(startISO: string, endISO: string): number | null {
  if (!ISO_DATE.test(startISO) || !ISO_DATE.test(endISO)) return null;
  const n = Math.round((utcDate(endISO).getTime() - utcDate(startISO).getTime()) / DAY_MS) + 1;
  return n >= 1 ? n : null;
}

/** "10월 24일(토) ~ 25일(일) · 2일 과정" */
export function formatSchedule(startISO: string, endISO: string): string {
  const n = dayCount(startISO, endISO);
  const range = formatRange(startISO, endISO);
  return n ? `${range} · ${n}일 과정` : range;
}

/**
 * 온라인 취소 기한 = 시작일 전날 오전 9시(KST).
 * cert-manager checkSelfServiceCancelPolicy 가 `new Date(start_date)`(= 시작일 00:00 UTC
 * = 09:00 KST)에서 24시간을 빼므로 정확히 같은 시각이다.
 * → "10월 23일(금) 오전 9시"
 */
export function formatCancelDeadline(startISO: string): string | null {
  if (!ISO_DATE.test(startISO)) return null;
  const p = parts(new Date(utcDate(startISO).getTime() - DAY_MS));
  return `${p.m}월 ${p.d}일(${p.dow}) 오전 9시`;
}

/** ISO 시각 → KST "10월 11일(일) 15:27". 비었거나 해석 불가면 null. */
export function formatKstDateTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return null;
  const k = new Date(t.getTime() + KST_OFFSET_MS);
  const p = parts(k);
  const hh = String(k.getUTCHours()).padStart(2, '0');
  const mm = String(k.getUTCMinutes()).padStart(2, '0');
  return `${p.m}월 ${p.d}일(${p.dow}) ${hh}:${mm}`;
}

/** "01012345676" → "010-****-5676" / 10자리 "0111234567" → "011-***-4567" */
export function maskPhone(raw: string): string {
  const d = (raw ?? '').replace(/\D/g, '');
  if (d.length === 11) return `${d.slice(0, 3)}-****-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-***-${d.slice(6)}`;
  if (d.length > 4) return `${'*'.repeat(d.length - 4)}${d.slice(-4)}`;
  return '****';
}
