import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { GenderKey, ProgramKey, RegistrationInput } from '@/lib/festprog-validate';

/**
 * 2026 양양서핑페스티벌 현장 프로그램 — service_role 전용 RPC 레이어.
 *
 * 데이터는 격리 스키마 festprog 에 있고 PostgREST 노출 스키마가 아니다.
 * 접근 경로는 public.festprog_* SECURITY DEFINER 함수뿐이며,
 * 이 함수들은 service_role 에게만 EXECUTE 가 부여되어 있다.
 *
 * ★ 서핑캠프(surfcamp-db.ts)와 같은 Supabase 프로젝트·같은 환경변수를 쓴다.
 *   스키마와 함수 접두만 다르므로 배포 시 env 를 새로 넣을 필요가 없다.
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

export type RegistrationStatus = 'confirmed' | 'waitlist' | 'cancelled';

export interface ProgramAvailability {
  capacity: number;
  confirmed: number;
  waitlist: number;
}

export interface FestprogAvailability {
  open: boolean;
  barre: ProgramAvailability;
  hyrox: ProgramAvailability;
}

/** 대기 → 확정으로 승급된 신청. 승급 문자 발송 대상. */
export interface Promoted {
  registration_id: string;
  program: ProgramKey;
  name: string;
  phone: string;
}

export interface FestprogRegistration {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  phone: string;
  gender: GenderKey;
  program: ProgramKey;
  status: RegistrationStatus;
  /** 대기일 때만 값이 있다. 내 앞에 대기 중인 인원 수. */
  wait_ahead: number | null;
}

export interface FestprogAdminRow {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  gender: GenderKey;
  program: ProgramKey;
  status: RegistrationStatus;
  batch_seq: number;
  wait_ahead: number | null;
  cancelled_at: string | null;
  cancelled_by: 'self' | 'admin' | null;
  cancel_reason: string | null;
  /** 내부 운영 메모. 관리자 화면·CSV 에서만 쓴다. */
  staff_note: string | null;
}

/** 업무 오류(정원/중복/동의 등). error 는 RPC 가 돌려주는 기계용 코드. */
export interface RpcFailure {
  ok: false;
  error: string;
  /** duplicate_phone 일 때 이미 신청된 프로그램 */
  program?: ProgramKey;
  /** 레이트리밋일 때 재시도까지 남은 초 */
  retry_after?: number;
  /** OTP 오입력 시 남은 시도 횟수 */
  attempts_left?: number;
}

export interface SubmitSuccess {
  ok: true;
  registration_id: string;
  name: string;
  phone: string;
  program: ProgramKey;
  status: 'confirmed' | 'waitlist';
  /** 대기일 때 내 앞의 대기 인원 */
  wait_ahead: number | null;
  promoted: Promoted[];
}
export type SubmitResult = SubmitSuccess | RpcFailure;

export interface CancelSuccess {
  ok: true;
  /** 이미 취소된 건을 다시 취소하면 false (멱등) */
  cancelled: boolean;
  name?: string;
  phone?: string;
  program?: ProgramKey;
  was_status?: 'confirmed' | 'waitlist';
  promoted: Promoted[];
}
export type CancelResult = CancelSuccess | RpcFailure;

export type OtpSetResult = { ok: true; phone: string } | RpcFailure;
export type OtpVerifyResult = { ok: true; phone: string } | RpcFailure;
export type SetOpenResult = { ok: true; open: boolean };
export type SetCapacityResult =
  | { ok: true; barre: number; hyrox: number; promoted: Promoted[] }
  | RpcFailure;
export type PromoteResult = { ok: true; promoted: Promoted[] } | RpcFailure;

// ── RPC 래퍼 ──────────────────────────────────────────────────────────────────

/** 잔여현황 (폼 헤더 / 관리자 카드) */
export async function getAvailability(): Promise<FestprogAvailability> {
  return callRpc<FestprogAvailability>('festprog_availability');
}

/** 신규 접수. 정원 판정·중복 검사·대기 승급까지 RPC 안에서 원자적으로 처리된다. */
export async function submitRegistration(input: RegistrationInput): Promise<SubmitResult> {
  return callRpc<SubmitResult>('festprog_submit', { payload: input });
}

/**
 * 신청 취소.
 * @param phone OTP 로 인증된 번호. null 이면 관리자 강제취소.
 */
export async function cancelRegistration(
  registrationId: string,
  phone: string | null,
  reason?: string | null,
): Promise<CancelResult> {
  return callRpc<CancelResult>('festprog_cancel', {
    p_registration_id: registrationId,
    p_phone: phone,
    p_reason: reason ?? null,
  });
}

/** 관리자 강제취소 (소유권 검사 없음) */
export async function forceCancel(
  registrationId: string,
  reason?: string | null,
): Promise<CancelResult> {
  return callRpc<CancelResult>('festprog_force_cancel', {
    p_registration_id: registrationId,
    p_reason: reason ?? null,
  });
}

/** 본인조회 — 해당 번호의 활성 신청(최대 1건) */
export async function lookupByPhone(phone: string): Promise<FestprogRegistration[]> {
  const rows = await callRpc<FestprogRegistration[] | null>('festprog_lookup_by_phone', {
    p_phone: phone,
  });
  return rows ?? [];
}

/** 관리자 명단 */
export async function adminList(includeCancelled = false): Promise<FestprogAdminRow[]> {
  const rows = await callRpc<FestprogAdminRow[] | null>('festprog_admin_list', {
    p_include_cancelled: includeCancelled,
  });
  return rows ?? [];
}

/** 접수 오픈/마감 */
export async function setOpen(open: boolean): Promise<SetOpenResult> {
  return callRpc<SetOpenResult>('festprog_set_open', { p_open: open });
}

/** 정원 조절. 증설 시 대기열 승급까지 함께 수행된다. */
export async function setCapacity(barre: number, hyrox: number): Promise<SetCapacityResult> {
  return callRpc<SetCapacityResult>('festprog_set_capacity', {
    p_barre: barre,
    p_hyrox: hyrox,
  });
}

/**
 * 수동 승급 (운영 예비용).
 * 평상시엔 submit / cancel / setCapacity 안에서 자동으로 돈다.
 * ★ 반환된 승급 건에는 문자가 자동으로 나가지 않는다 — 호출부가 보내야 한다.
 */
export async function promote(program?: ProgramKey | null): Promise<PromoteResult> {
  return callRpc<PromoteResult>('festprog_promote', { p_program: program ?? null });
}

/**
 * OTP 발급 + 레이트리밋 게이트.
 * ★ 반드시 SOLAPI 발송보다 먼저 호출한다 — 차단된 요청은 문자 비용이 0 이어야 한다.
 */
export async function otpSet(
  phone: string,
  codeHash: string,
  ttlSeconds: number,
  ipHash?: string | null,
): Promise<OtpSetResult> {
  return callRpc<OtpSetResult>('festprog_otp_set', {
    p_phone: phone,
    p_code_hash: codeHash,
    p_ttl: ttlSeconds,
    p_ip_hash: ipHash ?? null,
  });
}

/** OTP 검증 (코드당 5회 시도 제한, 성공/소진/만료 시 즉시 폐기) */
export async function otpVerify(phone: string, codeHash: string): Promise<OtpVerifyResult> {
  return callRpc<OtpVerifyResult>('festprog_otp_verify', {
    p_phone: phone,
    p_code_hash: codeHash,
  });
}
