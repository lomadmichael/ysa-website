import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'crypto';

/**
 * 코리아 오픈 라이브 경품 관리자 세션.
 * 서핑캠프 관리자(auth.ts)와 같은 무상태 서명 토큰 방식.
 *   token = "<만료 epoch(초)>.<HMAC-SHA256(만료, key=LIVEDRAW_ADMIN_PASSWORD)>"
 */

const TTL = 60 * 60 * 12;

export const ADMIN_COOKIE = 'livedraw_admin';
/** 추첨 화면(/live/draw)도 같은 세션을 쓰므로 쿠키 경로는 /live 로 둔다. */
export const ADMIN_COOKIE_PATH = '/live';
export const ADMIN_TTL = TTL;

if (!process.env.LIVEDRAW_ADMIN_PASSWORD && process.env.NODE_ENV === 'production') {
  throw new Error('LIVEDRAW_ADMIN_PASSWORD 미설정 — 라이브 경품 관리자 화면을 열 수 없습니다.');
}

function secret(): string {
  return process.env.LIVEDRAW_ADMIN_PASSWORD ?? '';
}

function sha256(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

function equalConstantTime(a: string, b: string): boolean {
  return timingSafeEqual(sha256(a), sha256(b));
}

function sign(exp: number): string {
  return createHmac('sha256', secret()).update(`admin.${exp}`).digest('hex');
}

export function checkPassword(input: string): boolean {
  const expected = secret();
  if (!expected) return false;
  return equalConstantTime(input ?? '', expected);
}

export function makeToken(): string {
  const exp = Math.floor(Date.now() / 1000) + TTL;
  return `${exp}.${sign(exp)}`;
}

export function verifyAdmin(token: string | undefined): boolean {
  if (!token) return false;
  if (!secret()) return false;
  const [expStr, sig] = token.split('.');
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  return equalConstantTime(sig ?? '', sign(exp));
}
