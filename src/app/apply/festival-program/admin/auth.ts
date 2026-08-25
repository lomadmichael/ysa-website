import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'crypto';

/**
 * 2026 양양서핑페스티벌 현장 프로그램 관리자 세션.
 *
 * ★ 이 파일에 "use server" 를 넣지 말 것 — 서버 액션 모듈은 모든 export 가 async 여야 하는데
 *   여기 헬퍼들은 동기 함수다. actions.ts / page.tsx / export/route.ts 가 공유한다.
 *
 * 세션은 DB 를 쓰지 않는 무상태 서명 토큰이다.
 *   token = "<만료 epoch(초)>.<HMAC-SHA256(만료, key=관리자 비밀번호)>"
 * 비밀번호 자체가 서명 키이므로 비밀번호를 바꾸면 기존 세션이 전부 즉시 무효화된다(의도된 동작).
 *
 * ★ 환경변수 폴백: FESTPROG_ADMIN_PASSWORD 가 없으면 SURFCAMP_ADMIN_PASSWORD 를 쓴다.
 *   같은 배포에 이미 들어 있는 값이라 env 를 새로 추가하지 않고 열 수 있다.
 *   운영 담당자를 분리하고 싶으면 FESTPROG_ADMIN_PASSWORD 만 넣으면 된다.
 *   (서명 페이로드에 'festprog' 네임스페이스를 섞어 두므로 비밀번호를 공유해도
 *    서핑캠프 관리자 토큰이 여기서 통하지는 않는다)
 */

/** 세션 유효기간 (초) — 8시간 */
const TTL = 60 * 60 * 8;

export const ADMIN_COOKIE = 'festprog_admin';
/** 쿠키를 관리자 경로에만 붙인다. 접수 폼 요청에는 세션 쿠키가 실려 가지 않는다. */
export const ADMIN_COOKIE_PATH = '/apply/festival-program/admin';
export const ADMIN_TTL = TTL;

function secret(): string {
  return process.env.FESTPROG_ADMIN_PASSWORD ?? process.env.SURFCAMP_ADMIN_PASSWORD ?? '';
}

/**
 * 운영 배포에 비밀번호가 없으면 관리자 화면이 "비밀번호 없이 열리는" 상태가 되므로
 * 모듈 로드 시점에 즉시 실패시킨다. 로컬/프리뷰(NODE_ENV !== 'production')는 통과.
 */
if (!secret() && process.env.NODE_ENV === 'production') {
  throw new Error(
    'FESTPROG_ADMIN_PASSWORD / SURFCAMP_ADMIN_PASSWORD 미설정 — 현장 프로그램 관리자 화면을 열 수 없습니다.',
  );
}

/** 길이가 달라도 timingSafeEqual 이 던지지 않도록 항상 32바이트 다이제스트로 비교한다. */
function sha256(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

function equalConstantTime(a: string, b: string): boolean {
  return timingSafeEqual(sha256(a), sha256(b));
}

function sign(exp: number): string {
  return createHmac('sha256', secret()).update(`festprog.admin.${exp}`).digest('hex');
}

/** 로그인 비밀번호 검증. 비교 시간이 입력에 따라 달라지지 않도록 해시 후 비교한다. */
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
