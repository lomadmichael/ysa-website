"use server";

import { LANDSURF_COHORTS, MAX_COMPANIONS } from "@/lib/landsurf-2026";
import { normalizePhone, submitLandSurf } from "@/lib/landsurf";
import { sendLandSurfApplicationSms } from "@/lib/landsurf-sms";

/**
 * 랜드서핑 성과공유회 접수 서버 액션.
 *
 * 클라이언트 검증은 UX 용이고, 여기서 전량 다시 본다.
 * DB(landsurf_submit)에도 같은 규칙이 한 겹 더 있다 — 접수창·형식·중복은 그쪽이 최종 판정.
 */

export interface LandSurfFormState {
  status: "idle" | "error" | "success";
  message?: string;
  cohort?: string;
  name?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  closed: "접수가 마감되었습니다.",
  name_required: "이름을 입력해주세요.",
  phone_invalid: "연락처를 정확히 입력해주세요. (예: 01012345678)",
  cohort_invalid: "참가 기수를 선택해주세요.",
  companions_invalid: `동반 가족은 ${MAX_COMPANIONS}명까지 입력할 수 있습니다.`,
  duplicate: "이미 같은 이름·연락처로 접수된 신청이 있습니다.",
  server: "접수 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
};

export async function submitLandSurfAction(
  _prev: LandSurfFormState,
  formData: FormData
): Promise<LandSurfFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const cohort = String(formData.get("cohort") ?? "");
  const rawCompanions = String(formData.get("companions") ?? "").trim();

  if (!name) return { status: "error", message: ERROR_MESSAGES.name_required };
  if (!/^01[0-9]{8,9}$/.test(phone))
    return { status: "error", message: ERROR_MESSAGES.phone_invalid };
  if (!(LANDSURF_COHORTS as readonly string[]).includes(cohort))
    return { status: "error", message: ERROR_MESSAGES.cohort_invalid };

  // 동반 가족은 선택 항목 — 비워두면 0명
  const companions = rawCompanions === "" ? 0 : Number(rawCompanions);
  if (!Number.isInteger(companions) || companions < 0 || companions > MAX_COMPANIONS)
    return { status: "error", message: ERROR_MESSAGES.companions_invalid };

  const result = await submitLandSurf({ name, phone, cohort, companions });
  if (!result.ok) {
    return {
      status: "error",
      message: ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.server,
    };
  }

  // 접수 확인 문자 (형님 승인 2026-08-16).
  // 발송 실패가 이미 저장된 접수를 되돌리면 안 되므로 삼켜서 로그만 남긴다.
  // ⚠️ Vercel serverless 는 응답 후 백그라운드가 소실되므로 반드시 await.
  try {
    const sms = await sendLandSurfApplicationSms({
      phone,
      name,
      cohort,
      companions,
    });
    if (!sms.success) {
      console.error(`[landsurf] 접수 확인 문자 실패 (${phone}): ${sms.reason}`);
    }
  } catch (e) {
    console.error(`[landsurf] 접수 확인 문자 예외 (${phone}):`, e);
  }

  return { status: "success", cohort: result.cohort, name };
}
