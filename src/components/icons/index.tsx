/**
 * Hand-drawn surf-style SVG icon library
 * Inspired by V2 classic surf icons (moon, sun, spiral, waves, starfish)
 * viewBox="0 0 64 64", strokeWidth 2.5, organic curves
 */

interface IconProps {
  className?: string;
}

const d = {
  viewBox: '0 0 64 64',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/* ═══════════════════════════════════ */
/* ── 자연물 기본 아이콘 (V2 원본) ── */
/* ═══════════════════════════════════ */

export function IconMoon({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...d} className={className}>
      <path d="M40 12c-12 2-20 12-18 24s14 20 26 18c-6 4-14 4-20-1S18 40 20 28s10-16 20-16z" />
      <circle cx="36" cy="22" r="3" fill="currentColor" />
    </svg>
  );
}

export function IconSun({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...d} className={className}>
      <circle cx="32" cy="32" r="8" />
      <path d="M32 12v6M32 46v6M12 32h6M46 32h6M19 19l4 4M41 41l4 4M45 19l-4 4M23 41l-4 4" />
      <path d="M26 14l2 4M38 46l2 4M14 38l4-2M46 26l4-2" />
    </svg>
  );
}

export function IconSpiral({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...d} className={className}>
      <path d="M32 28a4 4 0 0 1 4 4 8 8 0 0 1-8 8 12 12 0 0 1-12-12 16 16 0 0 1 16-16 20 20 0 0 1 20 20 24 24 0 0 1-24 24" />
    </svg>
  );
}

export function IconWaves({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...d} className={className}>
      <path d="M8 24c4-4 8-4 12 0s8 4 12 0 8-4 12 0 8 4 12 0" />
      <path d="M8 34c4-4 8-4 12 0s8 4 12 0 8-4 12 0 8 4 12 0" />
      <path d="M8 44c4-4 8-4 12 0s8 4 12 0 8-4 12 0 8 4 12 0" />
    </svg>
  );
}

export function IconStarfish({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...d} className={className}>
      <path d="M32 8l4 16 16-4-12 12 12 12-16-4-4 16-4-16-16 4 12-12-12-12 16 4z" />
    </svg>
  );
}

/* ═══════════════════════════════════ */
/* ── 기능 아이콘 (서프 스타일) ────── */
/* ═══════════════════════════════════ */

/* 대회 운영: 파도 위 깃발 */
export function IconCompetition({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...d} className={className}>
      <path d="M16 56V20" />
      <path d="M16 20c8-6 16 2 24-4v18c-8 6-16-2-24 4" />
      <path d="M8 56c4-3 8-3 12 0s8 3 12 0 8-3 12 0" />
    </svg>
  );
}

/* 교육 운영: 파도 위 태양 (배움의 빛) */
export function IconEducation({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...d} className={className}>
      <circle cx="32" cy="22" r="7" />
      <path d="M32 9v3M32 32v3M19 22h3M42 22h3M22 14l2 2M40 30l2 2M42 14l-2 2M22 30l-2 2" />
      <path d="M8 46c5-5 10-5 15 0s10 5 15 0 10-5 15 0" />
    </svg>
  );
}

/* 선수·청소년 육성: 새싹 + 파도 */
export function IconYouth({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...d} className={className}>
      <path d="M32 52V30" />
      <path d="M32 30c-6-10-18-8-16 0s12 6 16 0z" />
      <path d="M32 24c6-10 18-8 16 0s-12 6-16 0z" />
      <path d="M26 14c0-4 3-8 6-8s6 4 6 8" />
      <path d="M8 56c4-3 8-3 12 0s8 3 12 0 8-3 12 0" />
    </svg>
  );
}

/* 안전문화 조성: 조개 껍질 (보호) */
export function IconSafety({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...d} className={className}>
      <path d="M32 10c-14 0-22 12-22 22 0 6 4 12 10 14h24c6-2 10-8 10-14 0-10-8-22-22-22z" />
      <path d="M32 10v36" />
      <path d="M32 16c-6 4-10 10-12 18" />
      <path d="M32 16c6 4 10 10 12 18" />
      <path d="M32 22c-4 3-7 7-9 14" />
      <path d="M32 22c4 3 7 7 9 14" />
    </svg>
  );
}

/* 강사 교육: 사람 + 파도 */
export function IconInstructor({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...d} className={className}>
      <circle cx="24" cy="14" r="6" />
      <path d="M14 40c0-6 4-11 10-11s10 5 10 11" />
      <path d="M38 16l6-4M44 12l-2 6" />
      <path d="M6 52c4-3 8-3 12 0s8 3 12 0 8-3 12 0 8 3 12 0" />
    </svg>
  );
}

/* 심판 교육: 호루라기 */
export function IconReferee({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...d} className={className}>
      <circle cx="24" cy="28" r="10" />
      <path d="M24 18v-8" />
      <path d="M20 10h8" />
      <circle cx="24" cy="28" r="3" fill="currentColor" />
      <path d="M34 24l8-4" />
      <path d="M8 52c4-3 8-3 12 0s8 3 12 0 8-3 12 0" />
    </svg>
  );
}

/* 서핑특화 교육: 서핑보드 */
export function IconSurf({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...d} className={className}>
      <path d="M18 8c-4 10-6 24 0 36 2 4 6 8 14 8s12-4 14-8c6-12 4-26 0-36-2-4-8-4-14-4s-12 0-14 4z" />
      <path d="M32 16v32" />
      <path d="M26 20c2 2 4 4 6 4s4-2 6-4" />
    </svg>
  );
}

/* 대회 일정: 트로피 + 파도 */
export function IconTrophy({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...d} className={className}>
      <path d="M20 10h24v14c0 6-5 10-12 10s-12-4-12-10V10z" />
      <path d="M20 16h-6c-2 0-3 2-3 4v2c0 4 3 6 6 6h3" />
      <path d="M44 16h6c2 0 3 2 3 4v2c0 4-3 6-6 6h-3" />
      <path d="M32 34v6" />
      <path d="M24 40h16" />
      <path d="M8 52c4-3 8-3 12 0s8 3 12 0 8-3 12 0" />
    </svg>
  );
}

/* 공지사항: 조가비 열린 모양 (소식) */
export function IconNotice({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...d} className={className}>
      <path d="M12 20c0-6 9-12 20-12s20 6 20 12" />
      <path d="M12 20c0 6 9 12 20 12s20-6 20-12" />
      <path d="M32 8v24" />
      <path d="M22 12c2 4 6 8 10 10" />
      <path d="M42 12c-2 4-6 8-10 10" />
      <path d="M8 48c4-3 8-3 12 0s8 3 12 0 8-3 12 0" />
    </svg>
  );
}

/* 전화: 소라 껍데기 모양 */
export function IconPhone({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...d} className={className}>
      <path d="M44 8c-12 2-24 14-30 30" />
      <path d="M44 8c2 4 4 10 2 16" />
      <path d="M14 38c4 2 10 4 16 2" />
      <path d="M46 24c-2 4-6 6-10 6" />
      <path d="M30 44c-4-2-6-6-6-10" />
      <circle cx="32" cy="32" r="2" fill="currentColor" />
    </svg>
  );
}

/* 이메일: 유리병 편지 */
export function IconEmail({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...d} className={className}>
      <path d="M18 14c-2 0-4 4-4 10s4 20 10 24c4 2 8 2 12 0 6-4 10-18 10-24s-2-10-4-10c-4 0-8 4-12 4s-8-4-12-4z" />
      <path d="M24 28h16" />
      <path d="M26 34h12" />
      <path d="M28 22h8" />
    </svg>
  );
}

/* 시간: 해시계 */
export function IconClock({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...d} className={className}>
      <circle cx="32" cy="28" r="18" />
      <path d="M32 16v12l8 6" />
      <circle cx="32" cy="28" r="2" fill="currentColor" />
      <path d="M8 52c4-3 8-3 12 0s8 3 12 0 8-3 12 0" />
    </svg>
  );
}

/* 위치: 등대 */
export function IconLocation({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...d} className={className}>
      <path d="M26 6h12l-2 28H28L26 6z" />
      <path d="M32 6v-2" />
      <circle cx="32" cy="14" r="3" />
      <path d="M22 34h20" />
      <path d="M20 42h24" />
      <path d="M8 52c4-3 8-3 12 0s8 3 12 0 8-3 12 0" />
    </svg>
  );
}

/* 제휴·협업: 매듭/로프 */
export function IconPartnership({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...d} className={className}>
      <path d="M8 20c6 0 10 4 14 4s8-4 14-4" />
      <path d="M22 24c-4 4-8 12-8 16" />
      <path d="M42 24c4 4 8 12 8 16" />
      <path d="M14 40c6-4 12-4 18 0s12 4 18 0" />
      <circle cx="22" cy="24" r="3" />
      <circle cx="42" cy="24" r="3" />
    </svg>
  );
}

/* 회원안내: 산호 (커뮤니티) */
export function IconMembership({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...d} className={className}>
      <circle cx="26" cy="16" r="7" />
      <path d="M14 42c0-7 5-13 12-13s12 6 12 13" />
      <path d="M44 22a5 5 0 1 0 0-10" />
      <path d="M44 22c4 0 8 4 8 9" />
      <path d="M8 52c4-3 8-3 12 0s8 3 12 0 8-3 12 0" />
    </svg>
  );
}

/* 서프레스큐: 구명부표 */
export function IconRescue({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...d} className={className}>
      <circle cx="32" cy="24" r="14" />
      <circle cx="32" cy="24" r="5" />
      <path d="M22 14l-6-6M42 14l6-6M22 34l-6 6M42 34l6 6" />
      <path d="M8 52c4-3 8-3 12 0s8 3 12 0 8-3 12 0" />
    </svg>
  );
}

/* 랜드서핑: 스케이트보드 + 파도 */
export function IconSkate({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...d} className={className}>
      <path d="M14 34h36c2 0 3 2 2 4H12c-1-2 0-4 2-4z" />
      <circle cx="20" cy="42" r="3" />
      <circle cx="44" cy="42" r="3" />
      <path d="M24 34c2-8 6-18 8-22" />
      <path d="M40 34c-2-8-4-14-6-18" />
      <path d="M8 54c4-3 8-3 12 0s8 3 12 0 8-3 12 0" />
    </svg>
  );
}

/* 서핑요가: 연꽃 */
export function IconYoga({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...d} className={className}>
      <path d="M32 36c-6 0-12-4-12-10s6-10 12-10 12 4 12 10-6 10-12 10z" />
      <path d="M32 16c-2-6-8-8-12-6s-4 8 0 12" />
      <path d="M32 16c2-6 8-8 12-6s4 8 0 12" />
      <path d="M20 22c-6-2-10 0-10 4s4 6 10 6" />
      <path d="M44 22c6-2 10 0 10 4s-4 6-10 6" />
      <path d="M32 36v10" />
      <path d="M8 54c4-3 8-3 12 0s8 3 12 0 8-3 12 0" />
    </svg>
  );
}

/* 선수교육: 돌고래 */
export function IconAthlete({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...d} className={className}>
      <path d="M10 30c4-14 16-20 26-16 4 2 8 6 10 12" />
      <path d="M46 26c2-4 6-8 10-8" />
      <path d="M10 30c-2 4-4 8 0 10s8-2 10-6" />
      <circle cx="42" cy="22" r="2" fill="currentColor" />
      <path d="M36 28c2 2 6 2 8 0" />
      <path d="M8 48c4-3 8-3 12 0s8 3 12 0 8-3 12 0" />
    </svg>
  );
}

/* 전문체육교실: 닻 */
export function IconGym({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...d} className={className}>
      <circle cx="32" cy="10" r="4" />
      <path d="M32 14v28" />
      <path d="M24 8h16" />
      <path d="M18 34c0 8 6 14 14 14s14-6 14-14" />
      <path d="M26 26h12" />
    </svg>
  );
}

/* 체크마크: 파도 위 체크 */
export function IconCheck({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...d} className={className}>
      <path d="M14 32l8 8 20-20" />
      <path d="M8 52c4-3 8-3 12 0s8 3 12 0 8-3 12 0" />
    </svg>
  );
}
