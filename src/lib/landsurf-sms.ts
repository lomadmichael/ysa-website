import "server-only";
import { sendAlimtalk } from "@/lib/solapi";
import { INQUIRY_TEL, SMS_SENDER_ORG } from "@/lib/surfcamp-config";
import { LANDSURF } from "@/lib/landsurf-2026";

/**
 * 랜드서핑 성과공유회 접수 확인 문자.
 *
 * templateId 는 "TMPL_" 플레이스홀더다 — solapi.ts 가 이를 감지해 알림톡 심사 없이
 * fallbackText 를 일반 SMS/LMS 로 보낸다. 따라서 문안은 그 자체로 완결돼야 한다.
 *
 * 발송 실패가 이미 저장된 접수를 되돌리면 안 되므로 호출부에서 try/catch 로 감싼다.
 * (Vercel serverless 는 응답 후 백그라운드가 소실되므로 반드시 await 할 것)
 */

/** 사업 주체가 체육회라 머리말은 주최 명의로 나간다 */
const HEAD = `[${LANDSURF.host}] ${LANDSURF.title}`;
/** 체육회는 사전등록 발신번호가 없어 대행사 번호로 나간다 — 모르는 번호로 오해하지 않도록 명시 */
const SENDER = `[${SMS_SENDER_ORG}] ${LANDSURF.host} 알림 운영 대행`;

export async function sendLandSurfApplicationSms(params: {
  phone: string;
  name: string;
  cohort: string;
  companions: number;
}) {
  // ★ 빈 문자열은 문단 구분용 줄바꿈이다. filter 로 걷어내면 문단이 붙어버리므로
  //   조건부 줄은 spread 로만 넣는다.
  const body = [
    HEAD,
    `${params.name}님, 신청이 정상 접수되었습니다.`,
    "",
    `▶ 일시: 8월 23일(일) ${LANDSURF.assembleLabel}`,
    `▶ 장소: ${LANDSURF.assemblePlace}`,
    `▶ 참가 기수: ${params.cohort}`,
    // 동반 가족을 적지 않았으면 줄 자체를 넣지 않는다 (문자 길이 절약)
    ...(params.companions > 0 ? [`▶ 동반 가족: ${params.companions}명`] : []),
    `▶ 참가비: 무료`,
    "",
    "우천 시 진행 방식이 달라질 수 있습니다.",
    "",
    `문의: ${INQUIRY_TEL}`,
    SENDER,
  ].join("\n");

  return sendAlimtalk({
    to: params.phone,
    templateId: "TMPL_LANDSURF_APPLICATION",
    variables: {},
    fallbackText: body,
  });
}
