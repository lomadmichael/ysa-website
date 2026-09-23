/**
 * 2026 양양군의장배 알로하 팀 챌린지 전국서핑대회 — 화면 문구·검증 상수 단일 소스.
 *
 * 혼성 4인(남2·여2) 1팀 단위로 접수한다. 개인 단위 접수 폼(CompEntryForm)과
 * 계약이 완전히 달라 전용 폼(/apply/aloha-team)에서만 받고, 일반 대회 폼에서는 제외한다.
 *
 * 실제 접수 게이트는 lineup 서버(competitions.entry_opens_at/closes_at)다.
 * 여기 값은 화면 안내용이며, 서버 값과 반드시 같아야 한다.
 */

/** lineup 대회 slug — 이 대회는 팀 접수 폼에서만 접수한다 */
export const ALOHA_TEAM_SLUG = "alohateamcomp";

export const ALOHA_TEAM = {
  title: "2026 양양군의장배 알로하 팀 챌린지 전국서핑대회",
  shortTitle: "알로하 팀 챌린지",
  dateLabel: "2026년 10월 9일(금)",
  venue: "죽도해변",
  format: "혼성 4인 1팀 (남 2 · 여 2)",
  feeLabel: "팀당 100,000원",
  feeAmount: 100000,
  capacityLabel: "20팀 선착순",
  entryPeriodLabel: "9월 23일(수) ~ 9월 30일(수) 23:59",
  bank: {
    name: "신한은행",
    account: "100-035-939329",
    holder: "국민생활체육양양군서핑연합회",
  },
} as const;

/** 접수창 — 2026-09-23 00:00 ~ 09-30 23:59:59 KST (화면 안내용 클라 시계) */
export const ALOHA_TEAM_ENTRY_WINDOW = {
  opensAt: Date.UTC(2026, 8, 22, 15, 0, 0),
  closesAt: Date.UTC(2026, 8, 30, 14, 59, 59),
} as const;

/** 생년월일 상한 — 참가 대상 제한 없음(형님 확정 9/23, 포스터 기준). 대회일 이후 출생만 막는 오입력 방어 */
export const ALOHA_MAX_BIRTH_DATE = "2026-10-09";

/** 이 날짜 이후 출생 = 대회일(2026-10-09) 기준 미성년 → 보호자 정보·동의 필요 */
export const ALOHA_MINOR_AFTER = "2007-10-09";

/** 선수 교체·환불 규정 — 동의 체크 상세와 상단 안내의 단일 소스 */
export const ALOHA_REFUND_POLICY = [
  "선수 교체는 접수 마감(9월 30일 23:59) 전까지 팀 대표자가 홈페이지 「팀 정보 수정」에서 직접 할 수 있습니다.",
  "입금 확정 이후 개인 사정으로 인한 환불은 불가합니다.",
  "기상 악화 등으로 대회가 취소되면 참가비를 전액 환불합니다.",
] as const;

export const TEAM_SIZE = 4;

/** 히어로 「참가 신청하기」가 스크롤해 오는 접수폼 앵커 id */
export const ALOHA_FORM_ANCHOR = "apply-form";

/** 팀 정보 수정 마감 안내 (서버 entry_closes_at 이 실제 게이트) */
export const ALOHA_EDIT_DEADLINE_LABEL = "9월 30일(수) 23:59";
