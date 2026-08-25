/**
 * 2026 양양서핑페스티벌 현장 프로그램(해변 바레 / 해변 하이록스) 접수 — 순수 검증 규칙.
 *
 * 이 파일은 의존성이 하나도 없는 isomorphic 모듈이다.
 * 클라이언트 폼 / 서버 액션 / (내용상) Postgres RPC 가 모두 같은 규칙을 쓰도록
 * "단일 규칙 소스" 역할을 한다. 여기에 import 를 추가하지 말 것
 * (server-only 모듈이 딸려 들어가면 클라이언트 번들이 깨진다).
 *
 * 반환값 규약: 문제 없으면 null, 문제가 있으면 사용자에게 그대로 보여줄
 * 한국어 오류 메시지 문자열.
 */

// ── 코드값 ────────────────────────────────────────────────────────────────────
export type ProgramKey = 'barre' | 'hyrox';
export type GenderKey = 'M' | 'F';

export const PROGRAM_KEYS: ProgramKey[] = ['barre', 'hyrox'];
const GENDER_KEYS: string[] = ['M', 'F'];

// ── 입력 타입 ─────────────────────────────────────────────────────────────────
/**
 * 신청 1건 = 참가자 1명.
 * 서핑캠프와 달리 대표자/동반 참가자 구조가 없다 — 한 사람이 한 프로그램에 신청한다.
 */
export interface RegistrationInput {
  name: string;
  /** 하이픈 포함 여부 무관. 저장 전 normalizePhone 으로 정규화된다. */
  phone: string;
  gender: string;
  program: string;
  consent_privacy: boolean;
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

/** 표시용 하이픈 포맷. 예) '01012345678' → '010-1234-5678' */
export function formatPhone(raw: string): string {
  const d = normalizePhone(raw);
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return raw ?? '';
}

// ── 검증 ──────────────────────────────────────────────────────────────────────
function isBlank(v: unknown): boolean {
  return typeof v !== 'string' || v.trim() === '';
}

/** 신청 1건 검증. 문제 없으면 null. */
export function validateRegistration(r: RegistrationInput): string | null {
  if (isBlank(r?.name)) return '성명을 입력해 주세요.';
  if (r.name.trim().length > 40) return '성명이 너무 깁니다.';

  if (!isValidKrMobile(r.phone)) {
    return '휴대폰 번호를 정확히 입력해 주세요. (예: 010-1234-5678)';
  }

  if (!GENDER_KEYS.includes(r.gender)) return '성별을 선택해 주세요.';

  if (!(PROGRAM_KEYS as string[]).includes(r.program)) {
    return '참여할 프로그램을 선택해 주세요.';
  }

  if (r.consent_privacy !== true) return '개인정보 수집·이용 동의가 필요합니다.';

  return null;
}
