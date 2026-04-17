"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BirthDatePicker from "./BirthDatePicker";
import AddressSearch from "./AddressSearch";

const CERT_API =
  process.env.NEXT_PUBLIC_CERT_API_BASE ??
  "https://cert-manager-taupe.vercel.app";

interface Schedule {
  id: string;
  cert_type: "REF" | "INS";
  round: number;
  start_date: string;
  end_date: string;
  capacity: number;
  current_count: number;
  waitlist_count: number;
  status: string;
}

interface Form {
  schedule_id: string;
  applicant_name: string;
  applicant_name_en: string;
  applicant_email: string;
  applicant_phone: string;
  applicant_birth_date: string;
  applicant_gender: "" | "M" | "F";
  applicant_address: string;
  applicant_address_detail: string;
  prev_completion: string;
  photo_consent: boolean;
  privacy_consent: boolean;
}

const PREV_COMPLETION_OPTIONS = [
  { value: "completed_2022", label: "수료 (2022년)" },
  { value: "completed_2023", label: "수료 (2023년)" },
  { value: "completed_2024", label: "수료 (2024년)" },
  { value: "completed_2025", label: "수료 (2025년)" },
  { value: "none", label: "미수료" },
];

const certTypeLabel = (c: string) => (c === "REF" ? "심판" : "강사");

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

export default function ApplyForm({
  initialSchedules = [],
}: {
  initialSchedules?: Schedule[];
}) {
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
  const [loading, setLoading] = useState(initialSchedules.length === 0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{
    waitlisted: boolean;
    waitlistOrder?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const [form, setForm] = useState<Form>({
    schedule_id: "",
    applicant_name: "",
    applicant_name_en: "",
    applicant_email: "",
    applicant_phone: "",
    applicant_birth_date: "",
    applicant_gender: "",
    applicant_address: "",
    applicant_address_detail: "",
    prev_completion: "",
    photo_consent: true, // default: 예
    privacy_consent: false,
  });

  useEffect(() => {
    // Skip client fetch if SSR already provided schedules (unless retrying)
    if (retryCount === 0 && initialSchedules.length > 0) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    fetch(`${CERT_API}/api/public/schedules`)
      .then(async (r) => {
        if (!r.ok) {
          throw new Error(`HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((data: { schedules: Schedule[] }) => {
        if (cancelled) return;
        setSchedules(data.schedules ?? []);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        console.error("[apply] schedule load failed:", err);
        setLoadError(err.message ?? "알 수 없는 오류");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [retryCount, initialSchedules.length]);

  function updateField<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.privacy_consent) {
      setError("개인정보 수집·이용에 동의해주세요.");
      return;
    }
    if (
      !form.schedule_id ||
      !form.applicant_name ||
      !form.applicant_name_en ||
      !form.applicant_email ||
      !form.applicant_phone ||
      !form.applicant_address ||
      !form.prev_completion
    ) {
      setError("필수 항목을 모두 입력해주세요.");
      return;
    }
    if (!form.photo_consent) {
      setError("촬영 홍보 활용 동의가 필요합니다.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${CERT_API}/api/public/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedule_id: form.schedule_id,
          applicant_name: form.applicant_name,
          applicant_name_en: form.applicant_name_en || null,
          applicant_email: form.applicant_email,
          applicant_phone: form.applicant_phone,
          applicant_birth_date: form.applicant_birth_date || null,
          applicant_gender: form.applicant_gender || null,
          applicant_address:
            form.applicant_address && form.applicant_address_detail
              ? `${form.applicant_address} ${form.applicant_address_detail}`
              : form.applicant_address || null,
          prev_completion: form.prev_completion,
          photo_consent: form.photo_consent,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "접수에 실패했습니다.");
        return;
      }
      setSuccess({
        waitlisted: data._waitlisted,
        waitlistOrder: data._waitlistOrder,
      });
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-lg bg-gray-100"
          />
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center space-y-4">
        <div className="text-5xl">⚠️</div>
        <h2 className="text-xl font-bold text-red-900">
          교육 일정을 불러올 수 없습니다
        </h2>
        <p className="text-sm text-red-700">
          일시적인 네트워크 오류일 수 있습니다. 잠시 후 다시 시도해주세요.
        </p>
        <p className="text-xs text-red-600 font-mono">{loadError}</p>
        <button
          type="button"
          onClick={() => setRetryCount((c) => c + 1)}
          className="inline-flex items-center justify-center rounded-lg bg-red-600 px-6 py-3 text-white font-medium hover:bg-red-700"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (success) {
    const selectedSchedule = schedules.find((s) => s.id === form.schedule_id);
    const isWaitlisted = success.waitlisted;
    const accent = isWaitlisted ? "sunset" : "teal";

    return (
      <div
        className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        style={{ animation: "ysaFadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        {/* Hero: icon + title */}
        <div
          className="px-6 sm:px-10 pt-10 pb-8 text-center"
          style={{
            background: `linear-gradient(to bottom, color-mix(in srgb, var(--color-${accent}) 10%, transparent), transparent)`,
          }}
        >
          <div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full shadow-lg"
            style={{
              background: `var(--color-${accent})`,
              boxShadow: `0 10px 30px -10px color-mix(in srgb, var(--color-${accent}) 60%, transparent)`,
              animation: "ysaScaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s backwards",
            }}
          >
            {isWaitlisted ? (
              <svg
                className="h-10 w-10 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            ) : (
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
                <path
                  d="M5 12.5l4.5 4.5L19 7"
                  style={{
                    strokeDasharray: 48,
                    animation:
                      "ysaCheckDraw 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.35s backwards",
                  }}
                />
              </svg>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-navy tracking-tight">
            {isWaitlisted ? "대기 접수 완료" : "접수가 완료되었습니다"}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-navy/60">
            {isWaitlisted
              ? `대기순번 ${success.waitlistOrder}번으로 등록되었습니다`
              : "입력하신 연락처로 안내 메시지를 보내드립니다"}
          </p>
        </div>

        {/* Receipt */}
        {selectedSchedule && (
          <div className="border-t border-dashed border-gray-200 px-6 sm:px-10 py-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-navy/40">
              신청 내역
            </p>
            <dl className="space-y-3 text-sm">
              <ReceiptRow label="신청자" value={form.applicant_name} />
              <ReceiptRow
                label="교육"
                value={`${certTypeLabel(selectedSchedule.cert_type)}교육 ${selectedSchedule.round}차`}
              />
              <ReceiptRow
                label="일정"
                value={`${formatDate(selectedSchedule.start_date)} ~ ${formatDate(selectedSchedule.end_date)}`}
              />
              <ReceiptRow
                label="상태"
                value={
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{
                      background: `color-mix(in srgb, var(--color-${accent}) 12%, transparent)`,
                      color: `var(--color-${accent})`,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: `var(--color-${accent})` }}
                    />
                    {isWaitlisted ? `대기 ${success.waitlistOrder}번` : "확정"}
                  </span>
                }
              />
            </dl>
          </div>
        )}

        {/* Waitlist explainer */}
        {isWaitlisted && (
          <div
            className="border-t border-gray-100 px-6 sm:px-10 py-4 text-xs sm:text-sm leading-relaxed text-navy/70"
            style={{
              background:
                "color-mix(in srgb, var(--color-sunset) 6%, transparent)",
            }}
          >
            빈 자리가 생기면 입력하신 연락처로 <strong className="text-navy">확정 안내</strong>를
            보내드립니다. 자동 전환되므로 별도 재접수는 필요하지 않습니다.
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 border-t border-gray-100 bg-gray-50/50 px-6 sm:px-10 py-5">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-navy hover:bg-gray-50 transition"
          >
            홈으로
          </Link>
          <Link
            href="/schedule"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white hover:bg-purple/90 transition"
          >
            교육 일정 보기
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
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  // Group schedules by cert_type for display
  const refSchedules = schedules.filter((s) => s.cert_type === "REF");
  const insSchedules = schedules.filter((s) => s.cert_type === "INS");

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 개인정보 동의 */}
      <Section title="개인정보 수집 및 이용 동의">
        <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 space-y-2">
          <p className="font-medium">수집 항목 및 목적</p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>성명, 연락처, 이메일: 교육 안내 및 연락</li>
            <li>생년월일, 성별, 영문명: 자격증 발급</li>
            <li>주소: 자격증 배송</li>
            <li>교육 수료 여부: 교육과정 편성</li>
          </ul>
          <p className="text-xs">
            보유 기간: 교육 종료 후 3년 또는 자격증 유효기간 만료 시까지
          </p>
        </div>
        <CheckRow
          checked={form.privacy_consent}
          onChange={(v) => updateField("privacy_consent", v)}
          label="개인정보 수집 및 이용에 동의합니다. (필수)"
        />
      </Section>

      {/* 신청자 정보 */}
      <Section title="신청자 정보">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="이름" required>
            <input
              type="text"
              required
              value={form.applicant_name}
              onChange={(e) => updateField("applicant_name", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="영문명" required>
            <input
              type="text"
              required
              value={form.applicant_name_en}
              onChange={(e) => updateField("applicant_name_en", e.target.value)}
              placeholder="Hong Gildong"
              className={inputCls}
            />
          </Field>
          <Field label="생년월일">
            <BirthDatePicker
              value={form.applicant_birth_date}
              onChange={(v) => updateField("applicant_birth_date", v)}
            />
          </Field>
          <Field label="성별">
            <div className="flex gap-3 pt-2">
              {(["M", "F"] as const).map((g) => (
                <label
                  key={g}
                  className="inline-flex items-center gap-1.5 cursor-pointer text-sm"
                >
                  <input
                    type="radio"
                    name="gender"
                    checked={form.applicant_gender === g}
                    onChange={() => updateField("applicant_gender", g)}
                  />
                  {g === "M" ? "남" : "여"}
                </label>
              ))}
            </div>
          </Field>
          <Field label="연락처" required>
            <input
              type="tel"
              required
              placeholder="010-1234-5678"
              value={form.applicant_phone}
              onChange={(e) => updateField("applicant_phone", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="이메일" required>
            <input
              type="email"
              required
              value={form.applicant_email}
              onChange={(e) => updateField("applicant_email", e.target.value)}
              className={inputCls}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="주소" required>
              <AddressSearch
                value={form.applicant_address}
                detailValue={form.applicant_address_detail}
                onChange={(v) => updateField("applicant_address", v)}
                onDetailChange={(v) =>
                  updateField("applicant_address_detail", v)
                }
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* 교육일정 선택 */}
      <Section title="교육 일정 선택">
        {schedules.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">
            현재 모집 중인 교육 일정이 없습니다.
          </p>
        ) : (
          <div className="space-y-4">
            {refSchedules.length > 0 && (
              <ScheduleGroup
                title="심판교육"
                schedules={refSchedules}
                selected={form.schedule_id}
                onSelect={(id) => updateField("schedule_id", id)}
              />
            )}
            {insSchedules.length > 0 && (
              <ScheduleGroup
                title="강사교육"
                schedules={insSchedules}
                selected={form.schedule_id}
                onSelect={(id) => updateField("schedule_id", id)}
              />
            )}
          </div>
        )}
      </Section>

      {/* 강사인증 교육 수료 여부 */}
      <Section title="강사인증 교육 수료 여부" required>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {PREV_COMPLETION_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`cursor-pointer rounded-lg border px-3 py-2 text-sm text-center transition ${
                form.prev_completion === opt.value
                  ? "border-purple bg-purple text-white"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input
                type="radio"
                name="prev_completion"
                value={opt.value}
                checked={form.prev_completion === opt.value}
                onChange={() => updateField("prev_completion", opt.value)}
                className="hidden"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </Section>

      {/* 촬영 홍보 활용 동의 */}
      <Section title="촬영 홍보 활용 동의" required>
        <p className="text-sm text-gray-600 mb-3">
          교육 중 촬영된 사진 및 영상을 홍보 목적으로 활용하는 것에 동의합니다.
          (교육 신청 시 필수 동의 항목)
        </p>
        <CheckRow
          checked={form.photo_consent}
          onChange={(v) => updateField("photo_consent", v)}
          label="촬영 홍보 활용에 동의합니다. (필수)"
        />
      </Section>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 font-medium hover:bg-gray-50"
        >
          취소
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-lg bg-purple px-8 py-3 text-white font-bold hover:bg-purple/90 disabled:opacity-50"
        >
          {submitting ? "접수 중..." : "접수하기"}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple";

function Section({
  title,
  required,
  children,
}: {
  title: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        {title}
        {required && <span className="text-red-500 text-sm">*</span>}
      </h2>
      {children}
    </section>
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

function ReceiptRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-navy/50">{label}</dt>
      <dd className="text-right font-medium text-navy">{value}</dd>
    </div>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

function ScheduleGroup({
  title,
  schedules,
  selected,
  onSelect,
}: {
  title: string;
  schedules: Schedule[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700">{title}</h3>
      <div className="grid grid-cols-1 gap-2">
        {schedules.map((s) => {
          const confirmedFull = s.current_count >= s.capacity;
          const waitlistFull = s.waitlist_count >= s.capacity;
          const fullyClosed = confirmedFull && waitlistFull;
          const isSelected = selected === s.id;
          return (
            <label
              key={s.id}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 transition ${
                fullyClosed
                  ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
                  : isSelected
                    ? "cursor-pointer border-purple bg-purple/5"
                    : "cursor-pointer border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="schedule_id"
                  value={s.id}
                  checked={isSelected}
                  disabled={fullyClosed}
                  onChange={() => !fullyClosed && onSelect(s.id)}
                />
                <div>
                  <p className="text-sm font-medium">
                    [{certTypeLabel(s.cert_type)}] {s.round}차
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(s.start_date)} ~ {formatDate(s.end_date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <CountPill
                  label="정원"
                  current={s.current_count}
                  max={s.capacity}
                  full={confirmedFull}
                />
                <CountPill
                  label="대기"
                  current={s.waitlist_count}
                  max={s.capacity}
                  full={waitlistFull}
                  muted
                />
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function CountPill({
  label,
  current,
  max,
  full,
  muted,
}: {
  label: string;
  current: number;
  max: number;
  full: boolean;
  muted?: boolean;
}) {
  const cls = full
    ? "bg-red-100 text-red-700 border-red-200"
    : muted
      ? "bg-gray-100 text-gray-600 border-gray-200"
      : "bg-green-50 text-green-700 border-green-200";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}
    >
      {label} {current} / {max}명
    </span>
  );
}
