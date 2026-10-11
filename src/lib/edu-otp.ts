import 'server-only';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';

/**
 * 심판·강사교육 본인조회(/apply/education/my) — OTP 해시 + 세션 서명.
 *
 * surfcamp-otp.ts 복제. 새 env 를 만들지 않고 SURFCAMP_OTP_SECRET 을 재사용하되,
 * 모든 HMAC 입력에 'edu:' 도메인 접두를 붙여 서핑캠프 세션·OTP 해시와 호환되지
 * 않게 분리한다(서핑캠프 쿠키를 복사해 와도 여기서는 검증 실패).
 *
 * 운영(production)에서 시크릿이 없으면 모듈 로드 시점에 throw — 빈 키 HMAC 은
 * 누구나 세션을 위조할 수 있기 때문.
 */

const RAW_SECRET = (process.env.SURFCAMP_OTP_SECRET || '').trim();

if (!RAW_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error(
    'SURFCAMP_OTP_SECRET 미설정 — 세션 쿠키를 위조할 수 있으므로 운영 환경에서는 기동을 중단합니다.',
  );
}

const SECRET = RAW_SECRET || 'surfcamp-dev-only-insecure-secret';
/** 서핑캠프와 같은 시크릿을 쓰므로 도메인 접두로 용도를 분리한다. 바꾸면 기존 세션 전부 무효. */
const DOMAIN = 'edu:';

function hmac(input: string): string {
  return createHmac('sha256', SECRET).update(`${DOMAIN}${input}`).digest('hex');
}

/** 6자리 숫자 인증번호 (crypto 난수) */
export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

/** 인증번호는 평문으로 저장하지 않는다. (번호+코드) HMAC 만 DB 에 남는다. */
export function hashOtp(phone: string, code: string): string {
  return hmac(`${phone}:${code}`);
}

/** 본인인증 세션 토큰 발급. 형식: `<phone>.<exp>.<hmac>` */
export function signSession(phone: string, ttlSeconds: number): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const body = `${phone}.${exp}`;
  return `${body}.${hmac(body)}`;
}

/** 세션 토큰 검증. 유효하면 인증된 휴대폰 번호, 아니면 null. */
export function verifySession(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [phone, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null;

  const expected = hmac(`${phone}.${exp}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  return phone;
}
