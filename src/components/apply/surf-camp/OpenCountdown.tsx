'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseIsoToEpochMs } from '@/lib/surfcamp-config';

/**
 * 예약 오픈까지 남은 시간 카운트다운.
 *
 * ★ hydration 규칙
 *   첫 렌더는 반드시 서버가 계산해 넘겨준 `initialSeconds` 로만 그린다.
 *   `Date.now()` 는 서버와 클라이언트 값이 다르므로 렌더 중에는 절대 부르지 않고,
 *   마운트 이후 `useEffect` 안에서만 사용해 실제 시각과 동기화한다.
 *
 * ★ 접근성
 *   매초 바뀌는 숫자를 스크린리더가 계속 읽으면 방해가 되므로 숫자 블록은
 *   `aria-hidden` 으로 감추고, 상태 안내 문구에만 `aria-live="polite"` 를 둔다.
 *   (오픈 순간의 「접수가 시작되었습니다」 안내는 이 문구로 한 번 전달된다.)
 */
export default function OpenCountdown({
  openAtIso,
  initialSeconds,
}: {
  openAtIso: string;
  initialSeconds: number;
}) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.floor(Number.isFinite(initialSeconds) ? initialSeconds : 0)),
  );

  useEffect(() => {
    const parsed = parseIsoToEpochMs(openAtIso);
    // 문자열 파싱이 실패하면 서버가 준 남은 초를 기준으로 목표 시각을 잡는다.
    const target =
      parsed ??
      Date.now() + Math.max(0, Number.isFinite(initialSeconds) ? initialSeconds : 0) * 1000;

    const left = () => Math.max(0, Math.ceil((target - Date.now()) / 1000));

    let interval: ReturnType<typeof setInterval> | undefined;
    const sync = () => {
      const next = left();
      setRemaining(next);
      if (next <= 0 && interval !== undefined) clearInterval(interval);
      return next;
    };

    // 첫 동기화도 effect 본문이 아니라 타이머 콜백에서 한다.
    // 본문에서 곧바로 setState 하면 렌더가 연쇄로 한 번 더 돌고(cascading render),
    // 첫 페인트는 어차피 서버가 준 값 그대로여야 하므로 한 틱 미루는 편이 맞다.
    const kickoff = setTimeout(() => {
      if (sync() > 0) interval = setInterval(sync, 1000);
    }, 0);

    return () => {
      clearTimeout(kickoff);
      if (interval !== undefined) clearInterval(interval);
    };
  }, [openAtIso, initialSeconds]);

  // ── 오픈 도달 ──────────────────────────────────────────────────────────────
  if (remaining <= 0) {
    return (
      <div className="mt-6">
        <p
          aria-live="polite"
          className="text-base font-bold"
          style={{ color: 'var(--color-teal)' }}
        >
          접수가 시작되었습니다. 새로고침해 주세요.
        </p>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-purple px-6 py-2.5 text-sm font-bold text-white transition hover:bg-purple/90"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 11a8 8 0 1 0-2.3 5.7" />
            <path d="M20 5v6h-6" />
          </svg>
          새로고침
        </button>
      </div>
    );
  }

  // ── 카운트다운 ─────────────────────────────────────────────────────────────
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  /** 하루 이상 → 일 포함, 1시간 미만 → 분·초만 크게. */
  const urgent = remaining < 3600;
  const segments: { value: number; unit: string; pad: boolean }[] =
    days > 0
      ? [
          { value: days, unit: '일', pad: false },
          { value: hours, unit: '시간', pad: true },
          { value: minutes, unit: '분', pad: true },
          { value: seconds, unit: '초', pad: true },
        ]
      : urgent
        ? [
            { value: minutes, unit: '분', pad: true },
            { value: seconds, unit: '초', pad: true },
          ]
        : [
            { value: hours, unit: '시간', pad: false },
            { value: minutes, unit: '분', pad: true },
            { value: seconds, unit: '초', pad: true },
          ];

  return (
    <div className="mt-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-navy/40">접수 시작까지</p>
      <div
        aria-hidden="true"
        className="mt-2 flex items-end justify-center gap-2 sm:gap-3"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {segments.map((seg) => (
          <div key={seg.unit} className="flex items-baseline gap-1">
            <span
              className={`font-extrabold leading-none tracking-tight ${
                urgent ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'
              }`}
              style={{ color: urgent ? 'var(--color-sunset)' : 'var(--color-ocean)' }}
            >
              {seg.pad ? String(seg.value).padStart(2, '0') : seg.value}
            </span>
            <span className="text-sm font-semibold text-navy/50">{seg.unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
