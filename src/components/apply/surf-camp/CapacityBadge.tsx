import { PROGRAMS } from '@/lib/surfcamp-config';
import type { ProgramAvailability, SurfcampAvailability } from '@/lib/surfcamp-db';

/**
 * 프로그램별 잔여현황 pill.
 *
 * surfcamp-db 는 server-only 이지만 여기서는 타입만 가져오므로(=컴파일 시 소거)
 * 클라이언트 컴포넌트가 이 파일을 import 해도 서버 모듈이 딸려오지 않는다.
 */

function remainOf(p: ProgramAvailability): number {
  return Math.max(0, p.capacity - p.confirmed);
}

function Pill({ label, avail }: { label: string; avail: ProgramAvailability }) {
  const remain = remainOf(avail);
  const full = remain === 0;
  const accent = full ? 'var(--color-sunset)' : 'var(--color-teal)';

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
      style={{
        background: `color-mix(in srgb, ${accent} 12%, transparent)`,
        color: accent,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
      {label} · {full ? '대기 접수 중' : `잔여 ${remain}석`}
    </span>
  );
}

export default function CapacityBadge({
  availability,
}: {
  availability: SurfcampAvailability;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PROGRAMS.map((p) => (
        <Pill key={p.key} label={p.label} avail={availability[p.key]} />
      ))}
    </div>
  );
}
