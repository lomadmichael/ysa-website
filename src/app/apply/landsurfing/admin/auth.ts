import "server-only";
import { createHash, createHmac, timingSafeEqual } from "crypto";

/**
 * 랜드서핑 성과공유회 관리자 세션 (서핑캠프 admin/auth.ts 와 동일 방식).
 *
 * ★ "use server" 를 넣지 말 것 — 서버 액션 모듈은 모든 export 가 async 여야 하는데
 *   여기 헬퍼는 동기 함수다. actions.ts / page.tsx 가 공유한다.
 *
 * 세션은 DB 를 쓰지 않는 무상태 서명 토큰이다.
 *   token = "<만료 epoch(초)>.<HMAC-SHA256(만료, key=비밀번호)>"
 *
 * 비밀번호는 서핑캠프와 같은 SURFCAMP_ADMIN_PASSWORD 를 쓴다 — 같은 협회 운영자가
 * 두 명단을 함께 보므로 별도 비밀번호를 늘리지 않는다. 쿠키는 경로가 달라 서로 섞이지 않는다.
 */

const TTL = 60 * 60 * 8; // 8시간

export const ADMIN_COOKIE = "landsurf_admin";
export const ADMIN_COOKIE_PATH = "/apply/landsurfing/admin";
export const ADMIN_TTL = TTL;

if (!process.env.SURFCAMP_ADMIN_PASSWORD && process.env.NODE_ENV === "production") {
  throw new Error(
    "SURFCAMP_ADMIN_PASSWORD 미설정 — 랜드서핑 관리자 화면을 열 수 없습니다."
  );
}

function secret(): string {
  return process.env.SURFCAMP_ADMIN_PASSWORD ?? "";
}

/** 길이가 달라도 timingSafeEqual 이 던지지 않도록 항상 32바이트 다이제스트로 비교한다. */
function sha256(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

function equalConstantTime(a: string, b: string): boolean {
  return timingSafeEqual(sha256(a), sha256(b));
}

function sign(exp: number): string {
  return createHmac("sha256", secret()).update(`landsurf.${exp}`).digest("hex");
}

export function checkPassword(input: string): boolean {
  const expected = secret();
  if (!expected) return false;
  return equalConstantTime(input ?? "", expected);
}

export function makeToken(): string {
  const exp = Math.floor(Date.now() / 1000) + TTL;
  return `${exp}.${sign(exp)}`;
}

export function verifyAdmin(token: string | undefined): boolean {
  if (!token) return false;
  if (!secret()) return false;
  const [expStr, sig] = token.split(".");
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  return equalConstantTime(sig ?? "", sign(exp));
}
