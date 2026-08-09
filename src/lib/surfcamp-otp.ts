import 'server-only';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';

/**
 * 2026 양양 서핑캠프 — 본인조회 OTP + 세션 서명.
 *
 * ★ 레퍼런스(ecology-otp.ts)와의 차이:
 *   원본은 시크릿이 없으면 빈 문자열("")로 HMAC 을 계산했다. 그러면 누구나
 *   `01012345678.<exp>.<HMAC('' , …)>` 형태의 쿠키를 위조해 임의의 번호로
 *   신청 내역을 열람·수정·취소할 수 있다.
 *   → 운영(production)에서 SURFCAMP_OTP_SECRET 이 없으면 모듈 로드 시점에 throw 한다.
 *     로컬 개발에서만 고정 더미 키로 동작한다.
 */

const RAW_SECRET = (process.env.SURFCAMP_OTP_SECRET || '').trim();

if (!RAW_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error(
    'SURFCAMP_OTP_SECRET 미설정 — 세션 쿠키를 위조할 수 있으므로 운영 환경에서는 기동을 중단합니다.',
  );
}

const SECRET = RAW_SECRET || 'surfcamp-dev-only-insecure-secret';

/** 6자리 숫자 인증번호 (crypto 난수) */
export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

/** 인증번호는 평문으로 저장하지 않는다. (번호+코드) HMAC 만 DB 에 남는다. */
export function hashOtp(phone: string, code: string): string {
  return createHmac('sha256', SECRET).update(`${phone}:${code}`).digest('hex');
}

/** 본인인증 세션 토큰 발급. 형식: `<phone>.<exp>.<hmac>` */
export function signSession(phone: string, ttlSeconds: number): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const body = `${phone}.${exp}`;
  return `${body}.${createHmac('sha256', SECRET).update(body).digest('hex')}`;
}

/** 세션 토큰 검증. 유효하면 인증된 휴대폰 번호, 아니면 null. */
export function verifySession(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [phone, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null;

  const expected = createHmac('sha256', SECRET).update(`${phone}.${exp}`).digest('hex');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  return phone;
}
