/**
 * 2026 양양 서핑캠프 접수 — 순수 검증 규칙.
 *
 * 이 파일은 의존성이 하나도 없는 isomorphic 모듈이다.
 * 클라이언트 폼 / 서버 액션 / (내용상) Postgres RPC 가 모두 같은 규칙을 쓰도록
 * "단일 규칙 소스" 역할을 한다. 여기에 import 를 추가하지 말 것
 * (server-only 모듈이 딸려 들어가면 클라이언트 번들이 깨진다).
 *
 * 반환값 규약: 문제 없으면 null, 문제가 있으면 사용자에게 그대로 보여줄
 * 한국어 오류 메시지 문자열.
 */

// ── 프로그램 자격 기준 (surfcamp-config 가 이 값을 재수출한다) ─────────────────
/** 서핑강습 최소 나이(만) */
export const LESSON_MIN_AGE = 11;
/** 서핑강습 최소 신장(cm) */
export const LESSON_MIN_HEIGHT = 130;
/** 한 신청서에 담을 수 있는 최대 참가자 수 */
export const MAX_PARTICIPANTS = 8;

// ── 코드값 ────────────────────────────────────────────────────────────────────
export type ProgramKey = 'lesson' | 'special';
export type RegionKey = 'ganghyeon' | 'yangyang' | 'sonyang' | 'hyeonbuk' | 'hyeonnam';
export type LessonTimeKey = '13:00' | '15:00' | 'any';
export type ResidentTypeKey = 'resident' | 'life';
export type SurfExpKey = 'none' | '1-3' | '4+';
export type GenderKey = 'M' | 'F';

const PROGRAM_KEYS: string[] = ['lesson', 'special'];
const REGION_KEYS: string[] = ['ganghyeon', 'yangyang', 'sonyang', 'hyeonbuk', 'hyeonnam'];
const LESSON_TIME_KEYS: string[] = ['13:00', '15:00', 'any'];
const RESIDENT_TYPE_KEYS: string[] = ['resident', 'life'];
const SURF_EXP_KEYS: string[] = ['none', '1-3', '4+'];
const GENDER_KEYS: string[] = ['M', 'F'];

// ── 입력 타입 ─────────────────────────────────────────────────────────────────
/**
 * 참가자 1명. 폼(JSON)에서 그대로 넘어오므로 코드값 필드는 string 으로 받고
 * validateParticipant 에서 좁힌다. 수정 화면에서는 기존 참가자의 id 가 함께 온다.
 */
export interface ParticipantInput {
  /** 기존 참가자 수정 시에만 존재. 신규 추가는 undefined/null */
  id?: string | null;
  name: string;
  gender: string;
  age: number;
  height_cm: number;
  weight_kg: number;
  surf_exp: string;
  /** 신청 프로그램 ('lesson' | 'special') 1개 이상 */
  programs: string[];
}

/** 신청서(대표자 단위) */
export interface RegistrationInput {
  rep_name: string;
  /** 하이픈 포함 여부 무관. 저장 전 normalizePhone 으로 정규화된다. */
  phone: string;
  address: string;
  address_detail?: string;
  resident_type: string;
  region: string;
  lesson_time: string;
  consent_privacy: boolean;
  consent_notice?: boolean;
  consent_media?: boolean;
  note?: string;
  participants: ParticipantInput[];
}

// ── 전화번호 ──────────────────────────────────────────────────────────────────
/** 숫자만 남긴 형태로 정규화. 예) '010-1234-5678' → '01012345678' */
export function normalizePhone(raw: string): string {
  return (raw ?? '').replace(/\D/g, '');
}

/** 국내 휴대폰 번호(01X-XXXX-XXXX) 여부. 정규화 전/후 문자열 모두 허용. */
export function isValidKrMobile(raw: string): boolean {
  return /^01[016789][0-9]{7,8}$/.test(normalizePhone(raw));
}

// ── 서핑강습 자격 ─────────────────────────────────────────────────────────────
/** 서핑강습 참가 자격: 만 11세 이상 & 신장 130cm 이상 */
export function isLessonEligible(age: number, heightCm: number): boolean {
  return (
    Number.isFinite(age) &&
    Number.isFinite(heightCm) &&
    age >= LESSON_MIN_AGE &&
    heightCm >= LESSON_MIN_HEIGHT
  );
}

// ── 검증 ──────────────────────────────────────────────────────────────────────
function isBlank(v: unknown): boolean {
  return typeof v !== 'string' || v.trim() === '';
}

function asInt(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
}

/** 참가자 1명 검증. 문제 없으면 null. */
export function validateParticipant(p: ParticipantInput): string | null {
  if (isBlank(p?.name)) return '참가자 이름을 입력해 주세요.';
  const who = p.name.trim();
  if (who.length > 40) return `${who} : 이름이 너무 깁니다.`;

  if (!GENDER_KEYS.includes(p.gender)) return `${who} : 성별을 선택해 주세요.`;

  const age = asInt(p.age);
  if (!Number.isFinite(age) || age < 1 || age > 100) {
    return `${who} : 나이를 1~100 사이로 입력해 주세요.`;
  }

  const height = asInt(p.height_cm);
  if (!Number.isFinite(height) || height < 80 || height > 230) {
    return `${who} : 신장을 80~230cm 사이로 입력해 주세요.`;
  }

  const weight = asInt(p.weight_kg);
  if (!Number.isFinite(weight) || weight < 10 || weight > 200) {
    return `${who} : 몸무게를 10~200kg 사이로 입력해 주세요.`;
  }

  if (!SURF_EXP_KEYS.includes(p.surf_exp)) return `${who} : 서핑 경험을 선택해 주세요.`;

  const programs = Array.isArray(p.programs) ? Array.from(new Set(p.programs)) : [];
  if (programs.length === 0) return `${who} : 참가할 프로그램을 1개 이상 선택해 주세요.`;
  for (const prog of programs) {
    if (!PROGRAM_KEYS.includes(prog)) return `${who} : 선택할 수 없는 프로그램입니다.`;
  }

  if (programs.includes('lesson') && !isLessonEligible(age, height)) {
    return `${who} : 서핑강습은 만 ${LESSON_MIN_AGE}세 이상, 신장 ${LESSON_MIN_HEIGHT}cm 이상만 참가할 수 있습니다. (현재 만 ${age}세 · ${height}cm)`;
  }

  return null;
}

/** 신청서 전체 검증. 문제 없으면 null. */
export function validateRegistration(r: RegistrationInput): string | null {
  if (isBlank(r?.rep_name)) return '대표 신청자 이름을 입력해 주세요.';
  if (r.rep_name.trim().length > 40) return '대표 신청자 이름이 너무 깁니다.';

  if (!isValidKrMobile(r.phone)) return '휴대폰 번호를 정확히 입력해 주세요. (예: 010-1234-5678)';

  if (isBlank(r.address)) return '주소를 입력해 주세요.';
  if (r.address.trim().length > 200) return '주소가 너무 깁니다.';

  if (!RESIDENT_TYPE_KEYS.includes(r.resident_type)) {
    return '양양군민 / 양양 생활인구 중 하나를 선택해 주세요.';
  }
  if (!REGION_KEYS.includes(r.region)) return '희망 강습권역을 선택해 주세요.';
  if (!LESSON_TIME_KEYS.includes(r.lesson_time)) return '희망 강습시간을 선택해 주세요.';

  if (r.consent_privacy !== true) return '개인정보 수집·이용 동의가 필요합니다.';

  const participants = Array.isArray(r.participants) ? r.participants : [];
  if (participants.length === 0) return '참가자를 1명 이상 등록해 주세요.';
  if (participants.length > MAX_PARTICIPANTS) {
    return `참가자는 한 번에 최대 ${MAX_PARTICIPANTS}명까지 신청할 수 있습니다.`;
  }

  for (const p of participants) {
    const err = validateParticipant(p);
    if (err) return err;
  }

  return null;
}
