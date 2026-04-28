// 어드민 접근 허용 이메일 화이트리스트 (admin layout + API route 공통)
// 추가 시: 이 배열에 이메일 추가 + scripts/create-admin.mjs로 auth.users 생성
export const ALLOWED_ADMINS = [
  'michaellee.lomad@gmail.com',
  'ysa_korea@naver.com',
] as const;

export function isAllowedAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ALLOWED_ADMINS.includes(
    email.toLowerCase() as (typeof ALLOWED_ADMINS)[number],
  );
}
