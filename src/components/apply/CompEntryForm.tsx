"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import BirthDatePicker from "./BirthDatePicker";
import DepositNotice from "./DepositNotice";
import { ENTRY_FEE_PER_DIVISION, formatKrw } from "@/lib/festival-2026";

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

interface EntryResult {
  id: string;
  division_id: string;
  division_name: string;
  status: "confirmed" | "waitlisted";
  waitlist_order: number | null;
}

interface SuccessPayload {
  entries: EntryResult[];
  fee_total: number;
  entry_group_id: string;
}

interface Form {
  division_ids: string[];
  athlete_name: string;
  athlete_phone: string;
  athlete_birth_date: string;
  athlete_gender: "" | "M" | "F";
  athlete_email: string;
  affiliation: string;
  privacy_consent: boolean;
  publicity_consent: boolean;
  refund_consent: boolean;
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

/* ── 선수 사진 처리 ───────────────────────────────────────────── */

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
/** 리사이즈 후 최대 변 길이 (px) */
const MAX_IMAGE_SIDE = 1600;
const JPEG_QUALITY = 0.85;

async function loadImageSource(file: File): Promise<{
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  if (typeof createImageBitmap === "function") {
    try {
      // EXIF 회전 정보를 반영해 디코딩 (모바일 세로 사진 대응)
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      // 폴백으로 진행
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("이미지를 읽을 수 없습니다."));
      el.src = url;
    });
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      cleanup: () => URL.revokeObjectURL(url),
    };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

/** 최대 변 1600px / JPEG q0.85 로 축소해 업로드 용량(4MB 제한)을 맞춘다. */
async function resizeToJpeg(file: File): Promise<Blob> {
  const { source, width, height, cleanup } = await loadImageSource(file);
  try {
    if (!width || !height) throw new Error("이미지 크기를 확인할 수 없습니다.");
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("이 브라우저에서는 사진 처리를 지원하지 않습니다.");
    ctx.drawImage(source, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob) throw new Error("사진 변환에 실패했습니다.");
    return blob;
  } finally {
    cleanup();
  }
}

/** 부문 참가비: entry_fee_override → competition.entry_fee → 기본값 순 */
function divisionFee(d: CompDivision, c: Competition): number {
  const fee = d.entry_fee_override ?? c.entry_fee;
  return typeof fee === "number" && fee > 0 ? fee : ENTRY_FEE_PER_DIVISION;
}

/* ── 폼 ──────────────────────────────────────────────────────── */

export default function CompEntryForm({
  initialCompetitions = [],
  children,
}: {
  initialCompetitions?: Competition[];
  /**
   * 폼 위에 노출할 안내 영역(서버 컴포넌트 슬롯).
   * 접수 완료 화면에서는 합계가 포함된 안내를 따로 보여주므로 렌더하지 않는다.
   */
  children?: React.ReactNode;
}) {
  const [competitions, setCompetitions] = useState<Competition[]>(
    initialCompetitions
  );
  const [loading, setLoading] = useState(initialCompetitions.length === 0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessPayload | null>(null);

  // 선수 사진: 리사이즈된 Blob + 미리보기 URL.
  // photoPath 는 업로드 성공 후 받은 경로. 2단계 제출에서 ②가 실패해도
  // 유지해 두어 재제출 시 재업로드를 생략한다.
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Form>({
    division_ids: [],
    athlete_name: "",
    athlete_phone: "",
    athlete_birth_date: "",
    athlete_gender: "",
    athlete_email: "",
    affiliation: "",
    privacy_consent: false,
    publicity_consent: false,
    refund_consent: false,
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

  // 미리보기 objectURL 정리
  useEffect(() => {
    if (!photoPreview) return;
    return () => URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  /** division_id → {부문, 대회} 조회 인덱스 */
  const divisionIndex = useMemo(() => {
    const map = new Map<
      string,
      { division: CompDivision; competition: Competition }
    >();
    competitions.forEach((c) =>
      c.divisions.forEach((d) => map.set(d.id, { division: d, competition: c }))
    );
    return map;
  }, [competitions]);

  const selectedCount = form.division_ids.length;
  const selectedFeeTotal = useMemo(
    () =>
      form.division_ids.reduce((sum, id) => {
        const hit = divisionIndex.get(id);
        return (
          sum +
          (hit
            ? divisionFee(hit.division, hit.competition)
            : ENTRY_FEE_PER_DIVISION)
        );
      }, 0),
    [form.division_ids, divisionIndex]
  );

  function updateField<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleDivision(id: string) {
    setForm((f) => ({
      ...f,
      division_ids: f.division_ids.includes(id)
        ? f.division_ids.filter((v) => v !== id)
        : [...f.division_ids, id],
    }));
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setPhotoError("JPG · PNG · WEBP 형식의 이미지만 올릴 수 있습니다.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setPhotoProcessing(true);
    try {
      const blob = await resizeToJpeg(file);
      setPhotoBlob(blob);
      setPhotoPath(null); // 사진이 바뀌면 이전 업로드 경로 무효화
      setPhotoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } catch (err) {
      console.error("[comp-entry] photo resize failed:", err);
      setPhotoError(
        err instanceof Error ? err.message : "사진을 처리하지 못했습니다."
      );
      setPhotoBlob(null);
      setPhotoPath(null);
      setPhotoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    } finally {
      setPhotoProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removePhoto() {
    setPhotoBlob(null);
    setPhotoPath(null);
    setPhotoError(null);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
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
    if (!form.refund_consent) {
      setError("환불 정책에 동의해주세요.");
      return;
    }
    if (form.division_ids.length === 0) {
      setError("참가 부문을 1개 이상 선택해주세요.");
      return;
    }
    if (!photoBlob && !photoPath) {
      setError("선수 사진을 등록해주세요. (필수)");
      return;
    }
    if (
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
      // ① 사진 업로드 (이미 업로드된 경로가 있으면 재사용)
      let uploadedPath = photoPath;
      if (!uploadedPath) {
        if (!photoBlob) {
          setError("선수 사진을 등록해주세요. (필수)");
          return;
        }
        const fd = new FormData();
        fd.append("file", photoBlob, "athlete.jpg");
        let photoRes: Response;
        try {
          photoRes = await fetch(`${CERT_API}/api/public/comp-entry-photo`, {
            method: "POST",
            body: fd,
          });
        } catch {
          setError(
            "사진 업로드 중 네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
          );
          return;
        }
        const photoData = await photoRes.json().catch(() => ({}));
        if (!photoRes.ok || !photoData?.path) {
          setError(photoData?.error ?? "사진 업로드에 실패했습니다.");
          return;
        }
        uploadedPath = photoData.path as string;
        setPhotoPath(uploadedPath);
      }

      // ② 접수 등록
      const res = await fetch(`${CERT_API}/api/public/comp-entry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          division_ids: form.division_ids,
          photo_path: uploadedPath,
          athlete_name: form.athlete_name,
          athlete_phone: form.athlete_phone,
          athlete_birth_date: form.athlete_birth_date,
          athlete_gender: form.athlete_gender,
          athlete_email: form.athlete_email || null,
          affiliation: form.affiliation || null,
          privacy_consent: form.privacy_consent,
          publicity_consent: form.publicity_consent,
          refund_consent: form.refund_consent,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "접수에 실패했습니다.");
        return;
      }
      setSuccess({
        entries: (data.entries ?? []) as EntryResult[],
        fee_total:
          typeof data.fee_total === "number"
            ? data.fee_total
            : selectedFeeTotal,
        entry_group_id: data.entry_group_id ?? "",
      });
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <>
        {children}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </>
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
    const entries = success.entries;
    const waitlistedCount = entries.filter(
      (e) => e.status === "waitlisted"
    ).length;
    const allWaitlisted = entries.length > 0 && waitlistedCount === entries.length;
    const someWaitlisted = waitlistedCount > 0 && !allWaitlisted;
    const accent = allWaitlisted ? "sunset" : "teal";

    return (
      <div className="space-y-6">
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
              {allWaitlisted ? (
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
              {allWaitlisted ? "대기 접수 완료" : "참가 신청이 완료되었습니다"}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-navy/60">
              {allWaitlisted
                ? "대기 순번으로 등록되었습니다"
                : someWaitlisted
                  ? "일부 부문은 대기 순번으로 등록되었습니다"
                  : "대회 안내는 입력하신 연락처로 전달됩니다"}
            </p>
          </div>

          <div className="border-t border-dashed border-gray-200 px-6 sm:px-10 py-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-navy/40">
              신청 내역
            </p>
            <dl className="space-y-3 text-sm">
              <ReceiptRow label="선수" value={form.athlete_name} />
            </dl>

            <ul className="mt-4 space-y-2">
              {entries.map((entry) => {
                const hit = divisionIndex.get(entry.division_id);
                const isWaitlisted = entry.status === "waitlisted";
                return (
                  <li
                    key={entry.id ?? entry.division_id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      {hit && (
                        <p className="text-[11px] text-navy/45">
                          {hit.competition.name}
                        </p>
                      )}
                      <p className="text-sm font-semibold text-navy">
                        {entry.division_name ?? hit?.division.name ?? "부문"}
                      </p>
                    </div>
                    <StatusBadge
                      waitlisted={isWaitlisted}
                      waitlistOrder={entry.waitlist_order}
                    />
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-dashed border-gray-200 pt-4 text-sm">
              <dt className="shrink-0 text-navy/50">
                참가비 합계 ({entries.length}종목)
              </dt>
              <dd className="text-right text-base font-bold text-navy">
                {formatKrw(success.fee_total)}원
              </dd>
            </div>

            <p
              className="mt-4 rounded-lg px-4 py-3 text-sm leading-relaxed text-navy/80"
              style={{
                background:
                  "color-mix(in srgb, var(--color-sunset) 8%, transparent)",
              }}
            >
              입금자명은 반드시{" "}
              <strong className="font-bold text-sunset">
                {form.athlete_name || "선수 이름"}
              </strong>
              (선수 이름)과 동일하게 입금해주세요.
            </p>

            {success.entry_group_id && (
              <p className="mt-3 text-[11px] font-mono text-navy/35">
                접수번호 {success.entry_group_id}
              </p>
            )}
          </div>

          {someWaitlisted && (
            <div
              className="border-t border-gray-100 px-6 sm:px-10 py-4 text-xs sm:text-sm leading-relaxed text-navy/70"
              style={{
                background:
                  "color-mix(in srgb, var(--color-sunset) 6%, transparent)",
              }}
            >
              대기 부문은 빈 자리가 생기면 입력하신 연락처로{" "}
              <strong className="text-navy">확정 안내</strong>를 보내드립니다.
              자동 전환되므로 별도 재접수는 필요하지 않습니다.
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 border-t border-gray-100 bg-gray-50/50 px-6 sm:px-10 py-5">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-navy hover:bg-gray-50 transition"
            >
              홈으로
            </Link>
            <Link
              href="/festival"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white hover:bg-purple/90 transition"
            >
              대회 안내 보기
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

        <DepositNotice
          selectedCount={entries.length}
          total={success.fee_total}
        />
      </div>
    );
  }

  return (
    <>
      {children}
      <form
        id="comp-entry-form"
        onSubmit={handleSubmit}
        className={`space-y-8 ${selectedCount > 0 ? "pb-28" : ""}`}
      >
        {/* 개인정보 동의 */}
        <Section title="개인정보 수집 및 이용 동의">
          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 space-y-2">
            <p className="font-medium">수집 항목 및 목적</p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>성명, 연락처: 대회 운영 안내 및 본인 확인</li>
              <li>생년월일, 성별: 부문 편성 및 보험 가입</li>
              <li>소속: 대회 안내 방송 및 결과 표기</li>
              <li>선수 사진: 대회 중계 화면·전광판 선수 이미지</li>
            </ul>
            <p className="text-xs">보유 기간: 대회 종료 후 1년</p>
            <p className="text-xs">
              제3자 제공: 로마드협동조합(알림 운영대행사) — 알림톡 발송 목적,
              이름·연락처, 발송 후 삭제
            </p>
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

        {/* 선수 사진 */}
        <Section title="선수 사진" required>
          <p className="text-sm text-gray-600">
            이 사진은 대회 중계 화면·전광판의 선수 이미지로 사용됩니다. 얼굴이 잘
            나온 정면 사진을 올려주세요.
          </p>

          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50">
              {photoPreview ? (
                // 로컬 objectURL 미리보기 — next/image 최적화 대상이 아니므로 img 사용
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview}
                  alt="선수 사진 미리보기"
                  className="h-full w-full object-cover"
                />
              ) : (
                <svg
                  className="h-8 w-8 text-gray-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="9" r="3.2" />
                  <path d="M4 20c1.6-3.4 4.5-5 8-5s6.4 1.6 8 5" />
                </svg>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-purple file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-purple/90"
              />
              <p className="text-xs text-gray-500">
                JPG · PNG · WEBP / 업로드 시 자동으로 최대 1600px, JPEG로
                줄여서 전송합니다.
              </p>
              {photoProcessing && (
                <p className="text-xs text-navy/60">사진 처리 중...</p>
              )}
              {photoBlob && !photoProcessing && (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-medium text-teal">
                    사진 준비 완료 ({Math.max(1, Math.round(photoBlob.size / 1024))}KB)
                  </span>
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    사진 제거
                  </button>
                </div>
              )}
              {photoError && (
                <p className="text-xs font-medium text-red-600">{photoError}</p>
              )}
            </div>
          </div>
        </Section>

        {/* 대회/부문 선택 */}
        <Section title="참가 부문 선택" required>
          <p className="text-sm text-gray-600">
            여러 종목에 함께 신청할 수 있습니다. 참가비는 선택한 종목 수만큼
            합산됩니다.
          </p>
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
                      const isSelected = form.division_ids.includes(d.id);
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
                              type="checkbox"
                              name="division_ids"
                              value={d.id}
                              checked={isSelected}
                              disabled={closed}
                              onChange={() => !closed && toggleDivision(d.id)}
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
                            <span className="text-xs font-medium text-navy/50">
                              {formatKrw(divisionFee(d, c))}원
                            </span>
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

        {/* 환불 정책 동의 */}
        <Section title="환불 정책 동의" required>
          <p className="text-sm text-gray-600 mb-3">
            선수 등록 최종 확정 이후 개인사정으로 인한 환불은 불가합니다.
          </p>
          <CheckRow
            checked={form.refund_consent}
            onChange={(v) => updateField("refund_consent", v)}
            label="환불 정책에 동의합니다. (필수)"
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
            disabled={submitting || photoProcessing}
            className="inline-flex items-center justify-center rounded-lg bg-purple px-8 py-3 text-white font-bold hover:bg-purple/90 disabled:opacity-50"
          >
            {submitting ? "접수 중..." : "참가 신청하기"}
          </button>
        </div>
      </form>

      {/* 선택 종목 합산 바 (모바일 우선) */}
      {selectedCount > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur"
          style={{
            paddingBottom: "env(safe-area-inset-bottom)",
            boxShadow: "0 -6px 24px -12px rgba(26, 26, 46, 0.35)",
          }}
        >
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-navy/40">
                선택 {selectedCount}종목
              </p>
              <p className="text-sm font-bold text-navy sm:text-base">
                참가비 합계 {formatKrw(selectedFeeTotal)}원
              </p>
            </div>
            <button
              type="submit"
              form="comp-entry-form"
              disabled={submitting || photoProcessing}
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white transition hover:bg-purple/90 disabled:opacity-50"
            >
              {submitting ? "접수 중..." : "참가 신청하기"}
            </button>
          </div>
        </div>
      )}
    </>
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

function StatusBadge({
  waitlisted,
  waitlistOrder,
}: {
  waitlisted: boolean;
  waitlistOrder: number | null;
}) {
  const accent = waitlisted ? "sunset" : "teal";
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{
        background: `color-mix(in srgb, var(--color-${accent}) 12%, transparent)`,
        color: `var(--color-${accent})`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: `var(--color-${accent})` }}
      />
      {waitlisted
        ? waitlistOrder
          ? `대기 ${waitlistOrder}번`
          : "대기"
        : "확정"}
    </span>
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
