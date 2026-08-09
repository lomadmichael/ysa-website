import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  GenderKey,
  LessonTimeKey,
  ProgramKey,
  RegionKey,
  RegistrationInput,
  ResidentTypeKey,
  SurfExpKey,
} from '@/lib/surfcamp-validate';

/**
 * 2026 양양 서핑캠프 — service_role 전용 RPC 레이어.
 *
 * 데이터는 격리 스키마 surfcamp 에 있고 PostgREST 노출 스키마가 아니다.
 * 접근 경로는 public.surfcamp_* SECURITY DEFINER 함수뿐이며,
 * 이 함수들은 service_role 에게만 EXECUTE 가 부여되어 있다.
 *
 * ★ src/lib/supabase.ts 의 createAdminClient() 를 쓰지 않는 이유
 *   1) SupabaseClient<Database> 로 타입이 고정돼 있는데 Database 에 RPC 맵이 없어
 *      .rpc('surfcamp_submit') 이 타입 에러가 난다.
 *   2) 그 모듈에는 server-only 가드가 없어 브라우저 싱글턴이 서버 모듈 그래프로 딸려온다.
 *   → 여기서 전용 클라이언트를 따로 만든다.
 *
 * ★ 환경변수 이름 주의: 이 저장소는 SUPABASE_URL 이 아니라 NEXT_PUBLIC_SUPABASE_URL 이다.
 */

let _client: SupabaseClient | null = null;

function db(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 미설정');
  }
  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

/** RPC 는 전부 JSONB 한 덩어리를 돌려준다. 전송 오류만 throw 하고 업무 오류는 그대로 반환. */
async function callRpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await db().rpc(fn, args ?? {});
  if (error) throw new Error(`${fn}: ${error.message}`);
  return data as T;
}

// ── 반환 타입 ─────────────────────────────────────────────────────────────────

export type SignupStatus = 'confirmed' | 'waitlist' | 'cancelled';
export type RegistrationStatus = 'active' | 'cancelled';

export interface ProgramAvailability {
  capacity: number;
  confirmed: number;
  waitlist: number;
}

export interface SurfcampAvailability {
  /**
   * 실질 오픈 여부 = 수동 스위치 ON 이면서 예약 오픈 시각이 지났을 때만 true.
   * 폼·서버 액션·RPC 가 모두 이 값을 기준으로 판단한다. (KILL_SWITCH 와는 별개)
   */
  open: boolean;
  /** 관리자 수동 스위치 원값. 예약 시각 전이면 true 여도 open 은 false 다. */
  submissions_open: boolean;
  /** 예약 오픈 시각(ISO). null 이면 수동 스위치만으로 판단한다. */
  open_at: string | null;
  /** 예약 오픈까지 남은 초. 이미 지났거나 예약이 없으면 null. */
  opens_in_seconds: number | null;
  lesson: ProgramAvailability;
  special: ProgramAvailability;
}

/** 대기 → 확정 승급된 묶음. 승급 문자 발송 대상. */
export interface Promoted {
  registration_id: string;
  program: ProgramKey;
  count: number;
  phone: string;
  rep_name: string;
}

/** 프로그램별 신청 결과 (해당 프로그램 신청이 없으면 null) */
export interface ProgramOutcome {
  count: number;
  status: 'confirmed' | 'waitlist';
}

export interface SurfcampSignup {
  program: ProgramKey;
  status: SignupStatus;
  slot: string | null;
  /** 대기일 때만 값이 있다. 내 앞에 대기 중인 인원 수. */
  wait_ahead: number | null;
}

export interface SurfcampParticipant {
  id: string;
  name: string;
  gender: GenderKey;
  age: number;
  height_cm: number;
  weight_kg: number;
  surf_exp: SurfExpKey;
  signups: SurfcampSignup[];
}

export interface SurfcampRegistration {
  id: string;
  created_at: string;
  updated_at: string;
  rep_name: string;
  phone: string;
  address: string;
  address_detail: string | null;
  resident_type: ResidentTypeKey;
  region: RegionKey;
  lesson_time: LessonTimeKey;
  consent_media: boolean;
  note: string | null;
  status: RegistrationStatus;
  participants: SurfcampParticipant[];
}

/** 관리자 명단의 참가자 행 — 프로그램 상태가 평평하게 붙어 있다. */
export interface SurfcampAdminParticipant {
  id: string;
  name: string;
  gender: GenderKey;
  age: number;
  height_cm: number;
  weight_kg: number;
  surf_exp: SurfExpKey;
  lesson: SignupStatus | null;
  special: SignupStatus | null;
}

export interface SurfcampAdminRegistration {
  id: string;
  created_at: string;
  rep_name: string;
  phone: string;
  address: string;
  address_detail: string | null;
  resident_type: ResidentTypeKey;
  region: RegionKey;
  lesson_time: LessonTimeKey;
  status: RegistrationStatus;
  cancelled_at: string | null;
  cancelled_by: 'self' | 'admin' | null;
  consent_media: boolean;
  note: string | null;
  participants: SurfcampAdminParticipant[];
}

/** 업무 오류(정원/중복/자격 등). error 는 RPC 가 돌려주는 기계용 코드. */
export interface RpcFailure {
  ok: false;
  error: string;
  /** 참가자 단위 오류일 때 어느 참가자인지 */
  name?: string;
  age?: number;
  height_cm?: number;
  /** 레이트리밋일 때 재시도까지 남은 초 */
  retry_after?: number;
  /** OTP 오입력 시 남은 시도 횟수 */
  attempts_left?: number;
}

export interface SubmitSuccess {
  ok: true;
  registration_id: string;
  rep_name: string;
  phone: string;
  programs: {
    lesson: ProgramOutcome | null;
    special: ProgramOutcome | null;
  };
  promoted: Promoted[];
}
export type SubmitResult = SubmitSuccess | RpcFailure;

export interface UpdateSuccess {
  ok: true;
  registration_id: string;
  changed: {
    lesson: { added: number; removed: number; status: 'confirmed' | 'waitlist' | null };
    special: { added: number; removed: number; status: 'confirmed' | 'waitlist' | null };
  };
  /** 수정 후 이 신청서의 프로그램별 확정/대기 인원 */
  current: Partial<Record<ProgramKey, { confirmed: number; waitlist: number }>> | null;
  promoted: Promoted[];
}
export type UpdateResult = UpdateSuccess | RpcFailure;

export interface CancelSuccess {
  ok: true;
  /** 이미 취소된 건을 다시 취소하면 false (멱등) */
  cancelled: boolean;
  rep_name?: string;
  phone?: string;
  freed?: { lesson: number; special: number };
  promoted: Promoted[];
}
export type CancelResult = CancelSuccess | RpcFailure;

export interface OtpSetSuccess {
  ok: true;
  phone: string;
}
export type OtpSetResult = OtpSetSuccess | RpcFailure;

export interface OtpVerifySuccess {
  ok: true;
  phone: string;
}
export type OtpVerifyResult = OtpVerifySuccess | RpcFailure;

export interface SetOpenResult {
  ok: true;
  open: boolean;
}

export type SetOpenAtResult =
  | { ok: true; open_at: string | null }
  | RpcFailure;

export type SetCapacityResult =
  | { ok: true; lesson: number; special: number; promoted: Promoted[] }
  | RpcFailure;

// ── RPC 래퍼 ──────────────────────────────────────────────────────────────────

/** 잔여현황 (폼 헤더 / 관리자 카드) */
export async function getAvailability(): Promise<SurfcampAvailability> {
  return callRpc<SurfcampAvailability>('surfcamp_availability');
}

/** 신규 접수. 정원 판정·중복 검사·대기 승급까지 RPC 안에서 원자적으로 처리된다. */
export async function submitRegistration(input: RegistrationInput): Promise<SubmitResult> {
  return callRpc<SubmitResult>('surfcamp_submit', { payload: input });
}

/**
 * 신청 수정.
 * @param phone OTP 로 인증된 번호. null 이면 관리자 경로(소유권 검사 생략).
 */
export async function updateRegistration(
  registrationId: string,
  phone: string | null,
  input: RegistrationInput,
): Promise<UpdateResult> {
  return callRpc<UpdateResult>('surfcamp_update', {
    p_registration_id: registrationId,
    p_phone: phone,
    payload: input,
  });
}

/**
 * 신청 취소 (본인).
 * @param phone OTP 로 인증된 번호. null 이면 관리자 강제취소.
 */
export async function cancelRegistration(
  registrationId: string,
  phone: string | null,
  reason?: string | null,
): Promise<CancelResult> {
  return callRpc<CancelResult>('surfcamp_cancel', {
    p_registration_id: registrationId,
    p_phone: phone,
    p_reason: reason ?? null,
  });
}

/** 본인조회 — 해당 번호의 활성 신청(최대 1건) */
export async function lookupByPhone(phone: string): Promise<SurfcampRegistration[]> {
  const rows = await callRpc<SurfcampRegistration[] | null>('surfcamp_lookup_by_phone', {
    p_phone: phone,
  });
  return rows ?? [];
}

/** 관리자 명단 */
export async function adminList(
  includeCancelled = false,
): Promise<SurfcampAdminRegistration[]> {
  const rows = await callRpc<SurfcampAdminRegistration[] | null>('surfcamp_admin_list', {
    p_include_cancelled: includeCancelled,
  });
  return rows ?? [];
}

/** 관리자 강제취소 */
export async function adminCancel(
  registrationId: string,
  reason?: string | null,
): Promise<CancelResult> {
  return callRpc<CancelResult>('surfcamp_admin_cancel', {
    p_registration_id: registrationId,
    p_reason: reason ?? null,
  });
}

/** 접수 오픈/마감 (수동 스위치) */
export async function setOpen(open: boolean): Promise<SetOpenResult> {
  return callRpc<SetOpenResult>('surfcamp_set_open', { p_open: open });
}

/**
 * 예약 오픈 시각 설정. null 이면 예약을 해제하고 수동 스위치만으로 판단한다.
 * @param openAtIso ISO8601 문자열 (예: 2026-08-10T00:00:00Z = 9시 KST)
 */
export async function setOpenAt(openAtIso: string | null): Promise<SetOpenAtResult> {
  return callRpc<SetOpenAtResult>('surfcamp_set_open_at', { p_open_at: openAtIso });
}

/** 정원 조절. 증설 시 대기열 승급까지 함께 수행된다. */
export async function setCapacity(
  lesson: number,
  special: number,
): Promise<SetCapacityResult> {
  return callRpc<SetCapacityResult>('surfcamp_set_capacity', {
    p_lesson: lesson,
    p_special: special,
  });
}

/**
 * OTP 발급 + 레이트리밋 게이트.
 * ★ 반드시 SOLAPI 발송보다 먼저 호출한다 — 차단된 요청은 문자 비용이 0 이어야 한다.
 * 리밋 값(쿨다운/시간·일 한도/IP·전역 한도)은 RPC 기본값을 그대로 쓴다.
 */
export async function otpSet(
  phone: string,
  codeHash: string,
  ttlSeconds: number,
  ipHash?: string | null,
): Promise<OtpSetResult> {
  return callRpc<OtpSetResult>('surfcamp_otp_set', {
    p_phone: phone,
    p_code_hash: codeHash,
    p_ttl: ttlSeconds,
    p_ip_hash: ipHash ?? null,
  });
}

/** OTP 검증 (코드당 5회 시도 제한, 성공/소진/만료 시 즉시 폐기) */
export async function otpVerify(phone: string, codeHash: string): Promise<OtpVerifyResult> {
  return callRpc<OtpVerifyResult>('surfcamp_otp_verify', {
    p_phone: phone,
    p_code_hash: codeHash,
  });
}
