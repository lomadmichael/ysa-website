import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * 심판(REF)·강사(INS)교육 본인조회 — 데이터 레이어.
 *
 * 1) OTP: 이 저장소 Supabase 의 public.edu_otp_set / edu_otp_verify (019_edu_otp.sql).
 *    service_role 전용 RPC. surfcamp-db.ts 와 같은 이유로 전용 클라이언트를 따로 만든다.
 * 2) 신청 조회·취소: 교육 신청 원장은 cert-manager(golineup.kr) DB 에 있으므로
 *    서버 간 API(/api/service/education/*)를 공유 시크릿(EDU_SERVICE_SECRET)으로 호출한다.
 *    ★ 이 함수들은 반드시 OTP 세션 검증을 통과한 번호로만 호출할 것 —
 *      cert-manager 쪽은 시크릿만 확인하고 본인 여부는 호출 측(여기)을 믿는다.
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

async function callRpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await db().rpc(fn, args ?? {});
  if (error) throw new Error(`${fn}: ${error.message}`);
  return data as T;
}

// ── OTP ───────────────────────────────────────────────────────────────────────

export interface RpcFailure {
  ok: false;
  error: string;
  /** 레이트리밋일 때 재시도까지 남은 초 */
  retry_after?: number;
  /** OTP 불일치 시 남은 시도 횟수 */
  attempts_left?: number;
}

export type OtpSetResult = { ok: true; phone: string } | RpcFailure;
export type OtpVerifyResult = { ok: true; phone: string } | RpcFailure;

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
  return callRpc<OtpSetResult>('edu_otp_set', {
    p_phone: phone,
    p_code_hash: codeHash,
    p_ttl: ttlSeconds,
    p_ip_hash: ipHash ?? null,
  });
}

/** OTP 검증 (코드당 5회 시도 제한, 성공/소진/만료 시 즉시 폐기) */
export async function otpVerify(phone: string, codeHash: string): Promise<OtpVerifyResult> {
  return callRpc<OtpVerifyResult>('edu_otp_verify', {
    p_phone: phone,
    p_code_hash: codeHash,
  });
}

// ── cert-manager 서버 간 API ──────────────────────────────────────────────────

const CERT_API = (process.env.NEXT_PUBLIC_CERT_API_BASE ?? 'https://golineup.kr').replace(
  /\/$/,
  '',
);

export type EduApplicationStatus = 'confirmed' | 'waitlisted' | 'cancelled';

export interface EduApplication {
  id: string;
  cert_type: 'REF' | 'INS' | string;
  round: number;
  start_date: string;
  end_date: string;
  status: EduApplicationStatus;
  waitlist_order: number | null;
  cancellable: boolean;
  cancel_block_reason: string | null;
}

function serviceHeaders(): HeadersInit {
  const secret = (process.env.EDU_SERVICE_SECRET ?? '').trim();
  if (!secret) throw new Error('EDU_SERVICE_SECRET 미설정');
  return { 'content-type': 'application/json', 'x-service-secret': secret };
}

/** 이 번호로 접수된, 아직 끝나지 않은 심판·강사교육 신청 목록 (취소 건 포함). */
export async function listEduApplications(phone: string): Promise<EduApplication[]> {
  const res = await fetch(`${CERT_API}/api/service/education/applications`, {
    method: 'POST',
    headers: serviceHeaders(),
    body: JSON.stringify({ phone }),
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`listEduApplications: HTTP ${res.status}`);
  }
  const data = (await res.json()) as { applications?: EduApplication[] };
  return data.applications ?? [];
}

export type CancelEduResult = { ok: true } | { ok: false; status: number; error: string };

/** 신청 취소. 번호가 신청과 다르면 cert-manager 가 404 를 준다. 업무 오류는 throw 하지 않는다. */
export async function cancelEduApplication(id: string, phone: string): Promise<CancelEduResult> {
  const res = await fetch(
    `${CERT_API}/api/service/education/applications/${encodeURIComponent(id)}/cancel`,
    {
      method: 'POST',
      headers: serviceHeaders(),
      body: JSON.stringify({ phone }),
      cache: 'no-store',
    },
  );
  if (res.ok) return { ok: true };
  let error = '';
  try {
    error = ((await res.json()) as { error?: string }).error ?? '';
  } catch {
    // 본문 없음
  }
  return { ok: false, status: res.status, error };
}
