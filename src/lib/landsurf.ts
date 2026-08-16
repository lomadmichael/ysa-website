import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * 2026 랜드서핑 성과공유회 — service_role 전용 RPC 레이어.
 *
 * 서핑캠프(surfcamp-db.ts)와 같은 구조다. 데이터는 격리 스키마 `landsurf` 에 있고
 * PostgREST 노출 스키마가 아니다. 접근 경로는 public.landsurf_* SECURITY DEFINER
 * 함수뿐이며, 이 함수들은 service_role 에게만 EXECUTE 가 부여되어 있다.
 *
 * ★ 환경변수 이름 주의: 이 저장소는 SUPABASE_URL 이 아니라 NEXT_PUBLIC_SUPABASE_URL 이다.
 */

let _client: SupabaseClient | null = null;

function db(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 미설정");
  }
  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

export interface LandSurfRegistration {
  id: string;
  name: string;
  phone: string;
  cohort: string;
  companions: number;
  status: string;
  created_at: string;
}

export type SubmitResult =
  | { ok: true; id: string; cohort: string }
  | { ok: false; error: string };

export async function submitLandSurf(input: {
  name: string;
  phone: string;
  cohort: string;
  companions: number;
}): Promise<SubmitResult> {
  const { data, error } = await db().rpc("landsurf_submit", {
    p_name: input.name,
    p_phone: input.phone,
    p_cohort: input.cohort,
    p_companions: input.companions,
  });
  if (error) {
    console.error("[landsurf] submit RPC 실패:", error.message);
    return { ok: false, error: "server" };
  }
  return data as SubmitResult;
}

export async function listLandSurf(): Promise<LandSurfRegistration[]> {
  const { data, error } = await db().rpc("landsurf_list");
  if (error) {
    console.error("[landsurf] list RPC 실패:", error.message);
    throw new Error("명단을 불러오지 못했습니다.");
  }
  return (data ?? []) as LandSurfRegistration[];
}

/** 하이픈·공백을 제거해 숫자만 남긴다 (DB 정규식과 짝) */
export function normalizePhone(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}
