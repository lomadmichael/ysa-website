/**
 * Hand-drawn style SVG icon library
 * viewBox="0 0 48 48", stroke-based line art
 */

interface IconProps {
  className?: string;
}

const defaults = {
  viewBox: '0 0 48 48',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/* ── 1. Competition: trophy with handles ── */
export function IconCompetition({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <path d="M16 8h16v12c0 4-4 8-8 8s-8-4-8-8V8z" />
      <path d="M16 12h-4c-2 0-4 2-4 4v2c0 3 3 6 6 6h2" />
      <path d="M32 12h4c2 0 4 2 4 4v2c0 3-3 6-6 6h-2" />
      <line x1="24" y1="28" x2="24" y2="34" />
      <path d="M18 34h12v4H18z" />
    </svg>
  );
}

/* ── 2. Education: person at a board ── */
export function IconEducation({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <rect x="6" y="6" width="24" height="18" rx="2" />
      <line x1="12" y1="12" x2="24" y2="12" />
      <line x1="12" y1="17" x2="20" y2="17" />
      <circle cx="38" cy="18" r="4" />
      <path d="M32 36c0-4 2.5-7 6-7s6 3 6 7" />
      <line x1="18" y1="24" x2="18" y2="30" />
    </svg>
  );
}

/* ── 3. Youth: sprout / young growth ── */
export function IconYouth({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <path d="M24 40V24" />
      <path d="M24 24c-4-8-14-8-14-2s8 10 14 2z" />
      <path d="M24 20c4-8 14-8 14-2s-8 10-14 2z" />
      <circle cx="24" cy="12" r="4" />
      <path d="M18 42h12" />
    </svg>
  );
}

/* ── 4. Safety: shield with check ── */
export function IconSafety({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <path d="M24 4L8 12v10c0 12 16 20 16 20s16-8 16-20V12L24 4z" />
      <path d="M18 24l4 4 8-8" />
    </svg>
  );
}

/* ── 5. Instructor: person with star ── */
export function IconInstructor({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <circle cx="24" cy="14" r="6" />
      <path d="M12 38c0-7 5-12 12-12s12 5 12 12" />
      <path d="M30 8l4-4M34 4l-2 6 6-2" />
    </svg>
  );
}

/* ── 6. Referee: clipboard with whistle ── */
export function IconReferee({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <rect x="14" y="6" width="20" height="28" rx="2" />
      <line x1="20" y1="14" x2="28" y2="14" />
      <line x1="20" y1="20" x2="28" y2="20" />
      <line x1="20" y1="26" x2="25" y2="26" />
      <path d="M24 34v8M18 42h12" />
    </svg>
  );
}

/* ── 7. Surf: wave with surfer ── */
export function IconSurf({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <path d="M8 36c4-4 8-4 12 0s8 4 12 0 8-4 12 0" />
      <path d="M32 10c-2 6-6 14-14 22" />
      <path d="M28 8c2 0 6 2 6 6" />
      <circle cx="22" cy="18" r="3" />
    </svg>
  );
}

/* ── 8. Trophy: trophy for competitions ── */
export function IconTrophy({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <path d="M16 8h16v12c0 4-4 8-8 8s-8-4-8-8V8z" />
      <path d="M16 12h-4c-2 0-4 2-4 4v2c0 3 3 6 6 6h2" />
      <path d="M32 12h4c2 0 4 2 4 4v2c0 3-3 6-6 6h-2" />
      <line x1="24" y1="28" x2="24" y2="34" />
      <path d="M18 34h12v4H18z" />
    </svg>
  );
}

/* ── 9. Notice: envelope ── */
export function IconNotice({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <path d="M10 12l14 8 14-8" />
      <path d="M10 12v20c0 2 2 4 4 4h20c2 0 4-2 4-4V12" />
      <path d="M10 12c0-2 2-4 4-4h20c2 0 4 2 4 4" />
    </svg>
  );
}

/* ── 10. Phone ── */
export function IconPhone({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <path d="M12 6h6l3 8-4 3c2 5 6 9 11 11l3-4 8 3v6c0 2-2 4-4 4C18 36 6 24 6 10c0-2 2-4 4-4h2z" />
    </svg>
  );
}

/* ── 11. Email ── */
export function IconEmail({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <rect x="6" y="10" width="36" height="26" rx="3" />
      <path d="M6 14l18 10 18-10" />
    </svg>
  );
}

/* ── 12. Clock ── */
export function IconClock({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <circle cx="24" cy="24" r="18" />
      <path d="M24 12v12l8 4" />
    </svg>
  );
}

/* ── 13. Location: map pin ── */
export function IconLocation({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <path d="M24 42s14-10 14-20a14 14 0 1 0-28 0c0 10 14 20 14 20z" />
      <circle cx="24" cy="20" r="5" />
    </svg>
  );
}

/* ── 14. Partnership: handshake ── */
export function IconPartnership({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <path d="M6 20l8-8h6l4 4-8 8" />
      <path d="M42 20l-8-8h-6l-4 4 8 8" />
      <path d="M16 24l4 4 4-4 4 4 4-4" />
      <line x1="6" y1="20" x2="14" y2="28" />
      <line x1="42" y1="20" x2="34" y2="28" />
    </svg>
  );
}

/* ── 15. Membership: person with plus ── */
export function IconMembership({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <circle cx="20" cy="16" r="6" />
      <path d="M8 38c0-7 5-12 12-12s12 5 12 12" />
      <line x1="38" y1="16" x2="38" y2="26" />
      <line x1="33" y1="21" x2="43" y2="21" />
    </svg>
  );
}

/* ── 16. Rescue: lifesaver ring ── */
export function IconRescue({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <circle cx="24" cy="24" r="16" />
      <circle cx="24" cy="24" r="7" />
      <line x1="12" y1="12" x2="19" y2="19" />
      <line x1="36" y1="12" x2="29" y2="19" />
      <line x1="12" y1="36" x2="19" y2="29" />
      <line x1="36" y1="36" x2="29" y2="29" />
    </svg>
  );
}

/* ── 17. Skate: skateboard / land surfing ── */
export function IconSkate({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <path d="M10 30h28c2 0 3 1 3 2s-1 2-3 2H10c-2 0-3-1-3-2s1-2 3-2z" />
      <circle cx="14" cy="38" r="3" />
      <circle cx="34" cy="38" r="3" />
      <path d="M18 30l-2-12h16l-2 12" />
      <path d="M20 18c0-4 4-8 4-8s4 4 4 8" />
    </svg>
  );
}

/* ── 18. Yoga: person in yoga pose ── */
export function IconYoga({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <circle cx="24" cy="10" r="4" />
      <path d="M24 14v12" />
      <path d="M16 22l8 4 8-4" />
      <path d="M18 42l6-16 6 16" />
    </svg>
  );
}

/* ── 19. Athlete: running person ── */
export function IconAthlete({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <circle cx="28" cy="8" r="4" />
      <path d="M20 18l8-2 6 8" />
      <path d="M14 24l6-6 4 6-4 8" />
      <path d="M20 32l-6 10" />
      <path d="M26 26l8 8" />
    </svg>
  );
}

/* ── 20. Gym: dumbbell ── */
export function IconGym({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <line x1="14" y1="24" x2="34" y2="24" />
      <rect x="8" y="18" width="6" height="12" rx="1" />
      <rect x="34" y="18" width="6" height="12" rx="1" />
      <line x1="5" y1="20" x2="8" y2="20" />
      <line x1="5" y1="28" x2="8" y2="28" />
      <line x1="40" y1="20" x2="43" y2="20" />
      <line x1="40" y1="28" x2="43" y2="28" />
    </svg>
  );
}

/* ── Checkmark: for benefit lists ── */
export function IconCheck({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg {...defaults} className={className}>
      <path d="M10 26l8 8 20-20" />
    </svg>
  );
}
