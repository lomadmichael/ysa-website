import 'server-only';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';

/**
 * 2026 양양서핑페스티벌 현장 프로그램 — 본인조회 OTP + 세션 서명.
 *
 * ★ 시크릿이 없으면 운영에서 기동을 중단한다.
 *   빈 문자열로 HMAC 을 계산하면 누구나 `01012345678.<exp>.<HMAC('', …)>` 형태의
 *   쿠키를 위조해 임의의 번호로 신청 내역을 열람·취소할 수 있다.
 *
 * ★ 환경변수 폴백: FESTPROG_OTP_SECRET 이 없으면 SURFCAMP_OTP_SECRET 을 쓴다.
 *   같은 프로젝트·같은 배포에 이미 들어 있는 값이라, 이번 접수를 열려고
 *   Vercel 환경변수를 새로 추가할 필요가 없다. 나중에 서핑캠프와 세션을
 *   완전히 분리하고 싶으면 FESTPROG_OTP_SECRET 만 넣으면 된다.
 *   (쿠키 이름·path 가 다르므로 키를 공유해도 세션이 섞이지는 않는다)
 */

const RAW_SECRET = (
  process.env.FESTPROG_OTP_SECRET ||
  process.env.SURFCAMP_OTP_SECRET ||
  ''
).trim();

if (!RAW_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error(
    'FESTPROG_OTP_SECRET / SURFCAMP_OTP_SECRET 미설정 — 세션 쿠키를 위조할 수 있으므로 운영 환경에서는 기동을 중단합니다.',
  );
}

const SECRET = RAW_SECRET || 'festprog-dev-only-insecure-secret';

/** 6자리 숫자 인증번호 (crypto 난수) */
export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

/** 인증번호는 평문으로 저장하지 않는다. (번호+코드) HMAC 만 DB 에 남는다. */
export function hashOtp(phone: string, code: string): string {
  // 서핑캠프와 시크릿을 공유할 수 있으므로 네임스페이스를 섞어
  // 한쪽 OTP 해시를 다른 쪽에 재사용할 수 없게 한다.
  return createHmac('sha256', SECRET).update(`festprog:${phone}:${code}`).digest('hex');
}

/** 본인인증 세션 토큰 발급. 형식: `<phone>.<exp>.<hmac>` */
export function signSession(phone: string, ttlSeconds: number): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const body = `${phone}.${exp}`;
  return `${body}.${createHmac('sha256', SECRET).update(`festprog:${body}`).digest('hex')}`;
}

/** 세션 토큰 검증. 유효하면 인증된 휴대폰 번호, 아니면 null. */
export function verifySession(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [phone, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null;

  const expected = createHmac('sha256', SECRET)
    .update(`festprog:${phone}.${exp}`)
    .digest('hex');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  return phone;
}

/**
 * 요청 IP 해시. 원본 IP 는 저장하지 않는다(개인정보).
 * 소금은 FESTPROG_IP_SALT → SURFCAMP_IP_SALT 순으로 찾는다.
 */
export function hashIp(ip: string): string {
  const salt = process.env.FESTPROG_IP_SALT ?? process.env.SURFCAMP_IP_SALT ?? '';
  return createHmac('sha256', salt).update(ip).digest('hex');
}
