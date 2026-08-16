"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  LANDSURF,
  LANDSURF_CLOSE_LABEL,
  LANDSURF_COHORTS,
  MAX_COMPANIONS,
} from "@/lib/landsurf-2026";
import { submitLandSurfAction, type LandSurfFormState } from "./actions";

const INITIAL: LandSurfFormState = { status: "idle" };

const inputCls =
  "block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal";

/**
 * 랜드서핑 성과공유회 접수폼.
 *
 * 대회가 아니라 수업 마무리 자리라 받는 항목을 최소로 뒀다 (형님 확정 2026-08-16):
 * 이름 · 연락처 · 기수, 그리고 선택으로 동반 가족 수.
 * 생년월일·성별·사진은 받지 않는다.
 */
export default function LandSurfForm({ closed }: { closed: boolean }) {
  const [state, action, pending] = useActionState(submitLandSurfAction, INITIAL);

  if (state.status === "success") {
    return (
      <div
        className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        style={{ animation: "ysaFadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        <div
          className="px-6 sm:px-10 pt-10 pb-8 text-center"
          style={{
            background:
              "linear-gradient(to bottom, color-mix(in srgb, var(--color-teal) 10%, transparent), transparent)",
          }}
        >
          <div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full shadow-lg"
            style={{
              background: "var(--color-teal)",
              boxShadow:
                "0 10px 30px -10px color-mix(in srgb, var(--color-teal) 60%, transparent)",
            }}
          >
            <svg
              className="h-11 w-11 text-white"
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
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-navy tracking-tight">
            신청이 완료되었습니다
          </h2>
          <p className="mt-3 text-sm sm:text-base text-navy/60">
            {state.name} 님 · {state.cohort}
          </p>
        </div>

        <div className="border-t border-dashed border-gray-200 px-6 sm:px-10 py-6">
          <dl className="space-y-3 text-sm">
            <Row
              label="일시"
              value={`${LANDSURF.dateLabel} ${LANDSURF.assembleLabel}`}
            />
            <Row label="장소" value={LANDSURF.assemblePlace} />
            <Row label="참가비" value="무료" />
          </dl>
          <p className="mt-5 rounded-lg bg-gray-50 px-4 py-3 text-sm leading-relaxed text-navy/70">
            접수 확인 문자를 보내드렸습니다. 우천 시 진행 방식이 달라질 수 있으며,
            변경이나 취소가 필요하시면 양양군서핑협회로 연락해주세요.
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 border-t border-gray-100 bg-gray-50/50 px-6 sm:px-10 py-5">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-navy hover:bg-gray-50 transition"
          >
            홈으로
          </Link>
          <Link
            href="/apply"
            className="inline-flex items-center justify-center rounded-lg bg-teal px-5 py-2.5 text-sm font-bold text-white hover:bg-teal/90 transition"
          >
            다른 접수 보기
          </Link>
        </div>
      </div>
    );
  }

  if (closed) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center space-y-3">
        <h2 className="text-xl font-bold text-navy">접수가 마감되었습니다</h2>
        <p className="text-sm text-navy/60">
          참가자 안내는 접수하신 연락처로 개별 발송됩니다.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-navy hover:bg-gray-50"
        >
          홈으로
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-7">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">참가자 정보</h2>

        <Field label="이름" required>
          <input type="text" name="name" required maxLength={30} className={inputCls} />
        </Field>

        <Field label="연락처" required>
          {/* 하이픈을 넣어도 서버·DB 에서 숫자만 남긴다 */}
          <input
            type="tel"
            name="phone"
            required
            inputMode="numeric"
            placeholder="01012345678"
            className={inputCls}
          />
          <p className="mt-1 text-xs text-gray-500">
            안내 문자를 받으실 번호입니다. 어린이는 보호자 연락처를 입력해주세요.
          </p>
        </Field>

        <Field label="참가 기수" required>
          <div className="grid grid-cols-2 gap-2">
            {LANDSURF_COHORTS.map((c) => (
              <label
                key={c}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3.5 text-base font-semibold text-navy transition hover:border-teal has-[:checked]:border-teal has-[:checked]:bg-teal/5"
              >
                <input
                  type="radio"
                  name="cohort"
                  value={c}
                  required
                  className="size-4 accent-teal"
                />
                {c}
              </label>
            ))}
          </div>
        </Field>

        <Field label="동반 가족 수">
          <input
            type="number"
            name="companions"
            min={0}
            max={MAX_COMPANIONS}
            step={1}
            inputMode="numeric"
            placeholder="0"
            className={inputCls}
          />
          <p className="mt-1 text-xs text-gray-500">
            선택 사항입니다. 함께 오시는 가족이 있으면 본인을 제외한 인원수를
            적어주세요.
          </p>
        </Field>
      </section>

      {state.status === "error" && state.message && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {state.message}
        </div>
      )}

      <p className="text-xs leading-relaxed text-gray-500">
        접수 마감 {LANDSURF_CLOSE_LABEL} · 입력하신 이름과 연락처는 행사 운영과 안내
        목적으로만 사용하며 행사 종료 후 파기합니다.
      </p>

      <div className="flex justify-end gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 font-medium hover:bg-gray-50"
        >
          취소
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-lg bg-teal px-8 py-3 font-bold text-white transition hover:bg-teal/90 disabled:opacity-50"
        >
          {pending ? "접수 중..." : "신청하기"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-navy/50">{label}</dt>
      <dd className="text-right font-medium text-navy">{value}</dd>
    </div>
  );
}
