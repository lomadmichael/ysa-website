import 'server-only';
import { createAdminClient } from './supabase';

/**
 * 2026 코리아 오픈 유튜브 라이브 경품 응모/추첨 DB 래퍼.
 *
 * ⚠️ livedraw 스키마는 PostgREST 에 노출하지 않는다(= from('...') 로 직접 못 읽는다).
 *    응모·추첨·조회를 전부 public 스키마의 SECURITY DEFINER RPC 로만 처리하고,
 *    그 RPC 들은 service_role 에만 execute 권한이 있다.
 *    서핑캠프(surfcamp_submit)와 같은 방식.
 */

export interface Prize {
  code: string;
  sponsor: string;
  title: string;
  qty: number;
  grp: 'A' | 'B';
  sort: number;
  won: number;
}

export interface WinnerRow {
  prize_code: string;
  prize_title: string;
  sponsor: string;
  name: string;
  phone: string;
  drawn_at: string;
  notified_at: string | null;
}

export interface LiveState {
  is_open: boolean;
  closes_at: string | null;
  entry_count: number;
  prizes: Prize[];
}

export type SubmitCode =
  | 'ok'
  | 'invalid_name'
  | 'invalid_phone'
  | 'duplicate_phone'
  | 'closed'
  | 'error';

export interface PickResult {
  ok: boolean;
  code?: string;
  prize?: string;
  sponsor?: string;
  total_entries?: number;
  remaining?: number;
  winners?: { name: string; phone: string; masked_name: string; masked_phone: string }[];
}

const EMPTY_STATE: LiveState = {
  is_open: false,
  closes_at: null,
  entry_count: 0,
  prizes: [],
};

/* eslint-disable @typescript-eslint/no-explicit-any */
async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T | null> {
  const sb = createAdminClient();
  const { data, error } = await (sb as any).rpc(fn, args ?? {});
  if (error) {
    console.error(`[livedraw] ${fn} 실패:`, error.message);
    return null;
  }
  return data as T;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function submitEntry(name: string, phone: string): Promise<SubmitCode> {
  const r = await rpc<{ ok: boolean; code?: string }>('livedraw_submit', {
    p_name: name,
    p_phone: phone,
  });
  if (!r) return 'error';
  return r.ok ? 'ok' : ((r.code as SubmitCode) ?? 'error');
}

export async function pickWinners(prizeCode: string, count: number): Promise<PickResult> {
  const r = await rpc<PickResult>('livedraw_pick', {
    p_prize_code: prizeCode,
    p_count: count,
  });
  return r ?? { ok: false, code: 'error' };
}

export async function getState(): Promise<LiveState> {
  const r = await rpc<LiveState>('livedraw_state');
  return r ?? EMPTY_STATE;
}

export async function setOpen(isOpen: boolean): Promise<void> {
  await rpc('livedraw_set_open', { p_open: isOpen });
}

export async function listWinners(): Promise<WinnerRow[]> {
  const r = await rpc<WinnerRow[]>('livedraw_winner_list');
  return r ?? [];
}
