"use client";

import { useEffect, useRef, useState } from "react";

/** 모바일에서 계좌번호 등을 한 번에 복사하기 위한 작은 클라이언트 버튼 */
export default function CopyButton({
  value,
  label = "복사",
  copiedLabel = "복사됨",
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function handleCopy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(value);
      ok = true;
    } catch {
      // 구형 사파리 / 비보안 컨텍스트 폴백
      try {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (!ok) return;
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-live="polite"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-navy/15 bg-white px-3 py-2 text-xs font-semibold text-navy transition hover:bg-navy/5 active:scale-[0.98]"
    >
      {copied ? (
        <svg
          className="h-3.5 w-3.5 text-teal"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12.5l4.5 4.5L19 7" />
        </svg>
      ) : (
        <svg
          className="h-3.5 w-3.5 text-navy/50"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15V5a2 2 0 0 1 2-2h10" />
        </svg>
      )}
      {copied ? copiedLabel : label}
    </button>
  );
}
