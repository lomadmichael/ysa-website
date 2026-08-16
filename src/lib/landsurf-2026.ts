/**
 * 2026 서핑특화교육(랜드서핑) 성과공유회 상수.
 * 출처: 양양군체육회 「성과공유회 계획서」(2026.08).
 *
 * 대회가 아니라 한 해 수업을 마무리하는 자리라 lineup(대회 운영 시스템)에 태우지 않고
 * ysa-website 자체 접수로 받는다. 저장소는 Supabase `landsurf` 스키마.
 */

export const LANDSURF = {
  title: "2026 랜드서핑 성과공유회",
  program: "서핑특화교육(랜드서핑)",
  dateLabel: "2026년 8월 23일(일)",
  /** 집결은 10시, 프로그램은 10시 30분 시작 (형님 확정 2026-08-16) */
  assembleLabel: "오전 10시 집결",
  timeLabel: "오전 10시 집결 · 오후 4시 종료",
  venue: "죽도해변 (양양군 현남면)",
  /** 당일 모이는 지점 — 문자·안내에 이 표기를 쓴다 */
  assemblePlace: "죽도해변 웨이브웍스 주차장 옆",
  target: "랜드서핑교실 참가자 및 학부모",
  feeLabel: "무료",
  host: "양양군체육회",
  organizer: "양양군서핑협회",
} as const;

/** 접수 마감 — 2026-08-19(수) 23:59 KST. DB(landsurf_submit)의 게이트와 반드시 동일해야 한다 */
export const LANDSURF_CLOSES_AT = Date.UTC(2026, 7, 19, 14, 59, 59);
export const LANDSURF_CLOSE_LABEL = "8월 19일(수) 23:59";

/** 기수 — 접수 시 택1 */
export const LANDSURF_COHORTS = ["1기", "2기"] as const;

/** 동반 가족 수 상한 (DB 검증과 동일) */
export const MAX_COMPANIONS = 10;

/** 당일 진행 순서 */
export const LANDSURF_SCHEDULE: { time: string; title: string; desc?: string }[] = [
  { time: "10:30 ~ 12:00", title: "프리라이딩", desc: "상급자 시범 및 무료 강습" },
  { time: "12:00 ~ 13:00", title: "점심식사" },
  { time: "13:00 ~ 14:00", title: "트랙 러닝", desc: "좌·우 각 1회, 1바퀴 기록 측정" },
  { time: "14:00 ~ 14:30", title: "밸런스 보드", desc: "오래 버티기 (최대 1분)" },
  {
    time: "14:30 ~ 16:00",
    title: "고급 기술 교육 · 프리라이딩",
    desc: "드랍인, 슬라이드 등",
  },
];
