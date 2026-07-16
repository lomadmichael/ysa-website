"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BirthDatePicker from "./BirthDatePicker";

// ApplyForm 과 동일한 API base 정책 (golineup.kr fallback + env override)
const CERT_API =
  process.env.NEXT_PUBLIC_CERT_API_BASE ?? "https://golineup.kr";

export interface CompDivision {
  id: string;
  name: string;
  gender: string | null;
  capacity: number;
  confirmed_count: number;
  waitlist_count: number;
  entry_fee_override: number | null;
}

export interface Competition {
  id: string;
  name: string;
  slug: string;
  venue: string | null;
  starts_on: string;
  ends_on: string;
  status: string;
  entry_fee: number;
  divisions: CompDivision[];
}

interface Form {
  division_id: string;
  athlete_name: string;
  athlete_phone: string;
  athlete_birth_date: string;
  athlete_gender: "" | "M" | "F";
  athlete_email: string;
  affiliation: string;
  privacy_consent: boolean;
  publicity_consent: boolean;
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

export default function CompEntryForm({
  initialCompetitions = [],
}: {
  initialCompetitions?: Competition[];
}) {
  const [competitions, setCompetitions] = useState<Competition[]>(
    initialCompetitions
  );
  const [loading, setLoading] = useState(initialCompetitions.length === 0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    waitlisted: boolean;
    waitlistOrder?: number | null;
  } | null>(null);

  const [form, setForm] = useState<Form>({
    division_id: "",
    athlete_name: "",
    athlete_phone: "",
    athlete_birth_date: "",
    athlete_gender: "",
    athlete_email: "",
    affiliation: "",
    privacy_consent: false,
    publicity_consent: false,
  });

  useEffect(() => {
    if (retryCount === 0 && initialCompetitions.length > 0) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    fetch(`${CERT_API}/api/public/competitions`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: { competitions: Competition[] }) => {
        if (cancelled) return;
        setCompetitions(data.competitions ?? []);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        console.error("[comp-entry] competitions load failed:", err);
        setLoadError(err.message ?? "알 수 없는 오류");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [retryCount, initialCompetitions.length]);

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
    if (!form.publicity_consent) {
      setError("대회 기록 공개에 동의해주세요.");
      return;
    }
    if (
      !form.division_id ||
      !form.athlete_name ||
      !form.athlete_phone ||
      !form.athlete_birth_date ||
      !form.athlete_gender
    ) {
      setError("필수 항목을 모두 입력해주세요. (생년월일·성별 포함)");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${CERT_API}/api/public/comp-entry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          division_id: form.division_id,
          athlete_name: form.athlete_name,
          athlete_phone: form.athlete_phone,
          athlete_birth_date: form.athlete_birth_date,
          athlete_gender: form.athlete_gender,
          athlete_email: form.athlete_email || null,
          affiliation: form.affiliation || null,
          privacy_consent: form.privacy_consent,
          publicity_consent: form.publicity_consent,
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
          <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center space-y-4">
        <div className="text-5xl">⚠️</div>
        <h2 className="text-xl font-bold text-red-900">
          대회 정보를 불러올 수 없습니다
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
    const division = competitions
      .flatMap((c) => c.divisions.map((d) => ({ ...d, competition: c })))
      .find((d) => d.id === form.division_id);
    const isWaitlisted = success.waitlisted;
    const accent = isWaitlisted ? "sunset" : "teal";

    return (
      <div
        className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        style={{ animation: "ysaFadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
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
                <path d="M5 12.5l4.5 4.5L19 7" />
              </svg>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-navy tracking-tight">
            {isWaitlisted ? "대기 접수 완료" : "참가 신청이 완료되었습니다"}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-navy/60">
            {isWaitlisted
              ? `대기순번 ${success.waitlistOrder}번으로 등록되었습니다`
              : "대회 안내는 입력하신 연락처로 전달됩니다"}
          </p>
        </div>

        {division && (
          <div className="border-t border-dashed border-gray-200 px-6 sm:px-10 py-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-navy/40">
              신청 내역
            </p>
            <dl className="space-y-3 text-sm">
              <ReceiptRow label="선수" value={form.athlete_name} />
              <ReceiptRow label="대회" value={division.competition.name} />
              <ReceiptRow label="부문" value={division.name} />
              <ReceiptRow
                label="일정"
                value={`${formatDate(division.competition.starts_on)} ~ ${formatDate(division.competition.ends_on)}`}
              />
              <ReceiptRow
                label="상태"
                value={isWaitlisted ? `대기 ${success.waitlistOrder}번` : "확정"}
              />
            </dl>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 border-t border-gray-100 bg-gray-50/50 px-6 sm:px-10 py-5">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-navy hover:bg-gray-50 transition"
          >
            홈으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 개인정보 동의 */}
      <Section title="개인정보 수집 및 이용 동의">
        <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 space-y-2">
          <p className="font-medium">수집 항목 및 목적</p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>성명, 연락처: 대회 운영 안내 및 본인 확인</li>
            <li>생년월일, 성별: 부문 편성 및 보험 가입</li>
            <li>소속: 대회 안내 방송 및 결과 표기</li>
          </ul>
          <p className="text-xs">보유 기간: 대회 종료 후 1년</p>
        </div>
        <CheckRow
          checked={form.privacy_consent}
          onChange={(v) => updateField("privacy_consent", v)}
          label="개인정보 수집 및 이용에 동의합니다. (필수)"
        />
      </Section>

      {/* 선수 정보 */}
      <Section title="선수 정보">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="이름" required>
            <input
              type="text"
              required
              value={form.athlete_name}
              onChange={(e) => updateField("athlete_name", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="연락처" required>
            <input
              type="tel"
              required
              placeholder="01012345678"
              value={form.athlete_phone}
              onChange={(e) => updateField("athlete_phone", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="생년월일" required>
            <BirthDatePicker
              value={form.athlete_birth_date}
              onChange={(v) => updateField("athlete_birth_date", v)}
            />
          </Field>
          <Field label="성별" required>
            <div className="flex gap-3 pt-2">
              {(["M", "F"] as const).map((g) => (
                <label
                  key={g}
                  className="inline-flex items-center gap-1.5 cursor-pointer text-sm"
                >
                  <input
                    type="radio"
                    name="gender"
                    checked={form.athlete_gender === g}
                    onChange={() => updateField("athlete_gender", g)}
                  />
                  {g === "M" ? "남" : "여"}
                </label>
              ))}
            </div>
          </Field>
          <Field label="이메일">
            <input
              type="email"
              value={form.athlete_email}
              onChange={(e) => updateField("athlete_email", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="소속 (샵/크루)">
            <input
              type="text"
              value={form.affiliation}
              onChange={(e) => updateField("affiliation", e.target.value)}
              placeholder="예: 죽도서프"
              className={inputCls}
            />
          </Field>
        </div>
      </Section>

      {/* 대회/부문 선택 */}
      <Section title="참가 부문 선택">
        {competitions.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">
            현재 접수 중인 대회가 없습니다.
          </p>
        ) : (
          <div className="space-y-6">
            {competitions.map((c) => (
              <div key={c.id} className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">
                  {c.name}
                  <span className="ml-2 text-xs text-gray-400">
                    {formatDate(c.starts_on)} ~ {formatDate(c.ends_on)}
                    {c.venue && ` · ${c.venue}`}
                  </span>
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {c.divisions.map((d) => {
                    const confirmedFull = d.confirmed_count >= d.capacity;
                    const waitlistFull = d.waitlist_count >= d.capacity;
                    const closed = confirmedFull && waitlistFull;
                    const isSelected = form.division_id === d.id;
                    return (
                      <label
                        key={d.id}
                        className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 transition ${
                          closed
                            ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
                            : isSelected
                              ? "cursor-pointer border-purple bg-purple/5"
                              : "cursor-pointer border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="division_id"
                            value={d.id}
                            checked={isSelected}
                            disabled={closed}
                            onChange={() =>
                              !closed && updateField("division_id", d.id)
                            }
                          />
                          <p className="text-sm font-medium">
                            {d.name}
                            {closed && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                                정원 마감
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                          <CountPill
                            label="정원"
                            current={d.confirmed_count}
                            max={d.capacity}
                            full={confirmedFull}
                          />
                          {d.waitlist_count > 0 && (
                            <CountPill
                              label="대기"
                              current={d.waitlist_count}
                              max={d.capacity}
                              full={waitlistFull}
                              muted
                            />
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* 대회 기록 공개 동의 */}
      <Section title="대회 기록 공개 동의" required>
        <p className="text-sm text-gray-600 mb-3">
          대회 진행을 위해 성명·소속·순위·점수가 현장 전광판, 협회 홈페이지,
          중계 화면에 공개되는 것에 동의합니다. (참가 필수 동의 항목)
        </p>
        <CheckRow
          checked={form.publicity_consent}
          onChange={(v) => updateField("publicity_consent", v)}
          label="대회 기록 공개에 동의합니다. (필수)"
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
          {submitting ? "접수 중..." : "참가 신청하기"}
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
