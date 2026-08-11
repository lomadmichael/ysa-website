"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import BirthDatePicker from "./BirthDatePicker";
import { ACCEPTED_IMAGE_TYPES, resizeToJpeg } from "@/lib/athlete-photo";
import {
  COHORT_OPTIONS,
  CUSTOM_COMP,
  CUSTOM_COMP_ENTRY_WINDOW,
  CUSTOM_COMP_SLUG,
  cohortAffiliation,
} from "@/lib/custom-comp-2026";
import type { Competition } from "./CompEntryForm";

const CERT_API =
  process.env.NEXT_PUBLIC_CERT_API_BASE ?? "https://golineup.kr";

interface Form {
  division_id: string;
  athlete_name: string;
  athlete_phone: string;
  athlete_birth_date: string;
  athlete_gender: "" | "M" | "F";
  /** 맞춤형 서핑교실 기수 — lineup 에는 소속(affiliation)으로 저장된다 */
  cohort: string;
  /** 하고 싶은 말 — 선택, 200자. 현장 해설자 소개용 */
  intro_message: string;
  /** 개인정보 수집·이용 + 초상권 + 대회 기록 공개 통합 동의 (체크 1개) */
  privacy_consent: boolean;
}

interface SuccessPayload {
  divisionName: string;
  athleteName: string;
}

/**
 * 2026 맞춤형 서핑대회 접수폼.
 *
 * 코리아 오픈 폼(CompEntryForm)과 달리 부문 택1·참가비 없음·정원 48명이라
 * lineup 의 **단수 접수 계약**(division_id)으로 보낸다. 단수 계약은 주소·국적·
 * 환불동의를 요구하지 않아 형님이 지정한 항목만 받을 수 있다.
 */
export default function CustomCompEntryForm({
  initialCompetition = null,
  brief,
}: {
  initialCompetition?: Competition | null;
  brief?: React.ReactNode;
}) {
  const [competition, setCompetition] = useState<Competition | null>(
    initialCompetition
  );
  const [loading, setLoading] = useState(initialCompetition === null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessPayload | null>(null);

  // 선수 사진 — 리사이즈된 Blob + 미리보기. photoPath 는 업로드 성공 경로로,
  // 접수 등록(②)이 실패해도 유지해 재제출 시 재업로드를 생략한다.
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 영문 이름 — 성/이름 분리 입력 후 "성 이름" 으로 합쳐 전송 (코리아 오픈 폼과 동일 규칙)
  const [nameEnLast, setNameEnLast] = useState("");
  const [nameEnFirst, setNameEnFirst] = useState("");

  const [form, setForm] = useState<Form>({
    division_id: "",
    athlete_name: "",
    athlete_phone: "",
    athlete_birth_date: "",
    athlete_gender: "",
    cohort: "",
    intro_message: "",
    privacy_consent: false,
  });

  const nameEn = useMemo(
    () => [nameEnLast.trim(), nameEnFirst.trim()].filter(Boolean).join(" "),
    [nameEnLast, nameEnFirst]
  );

  useEffect(() => {
    if (retryCount === 0 && initialCompetition !== null) {
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
      .then((data: { competitions?: Competition[] }) => {
        if (cancelled) return;
        setCompetition(
          (data.competitions ?? []).find((c) => c.slug === CUSTOM_COMP_SLUG) ??
            null
        );
      })
      .catch((err: Error) => {
        if (cancelled) return;
        console.error("[custom-comp] competitions load failed:", err);
        setLoadError(err.message ?? "알 수 없는 오류");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [retryCount, initialCompetition]);

  // 미리보기 objectURL 정리
  useEffect(() => {
    if (!photoPreview) return;
    return () => URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  function updateField<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
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
      console.error("[custom-comp] photo resize failed:", err);
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
      setError("개인정보 수집·이용 및 초상권·대회 기록 공개에 동의해주세요.");
      return;
    }
    if (!form.division_id) {
      setError("참가 부문(성인부/아동부)을 선택해주세요.");
      return;
    }
    if (
      !form.athlete_name.trim() ||
      !form.athlete_phone ||
      !form.athlete_birth_date ||
      !form.athlete_gender
    ) {
      setError("필수 항목을 모두 입력해주세요. (생년월일·성별 포함)");
      return;
    }
    if (!nameEnLast.trim() || !nameEnFirst.trim()) {
      setError("영문 이름(성·이름)을 모두 입력해주세요. (필수)");
      return;
    }
    if (!/^[A-Za-z][A-Za-z .'-]*$/.test(nameEn)) {
      setError("영문 이름은 영문으로만 입력해주세요. (예: KIM SUNSOO)");
      return;
    }
    if (!form.cohort) {
      setError("맞춤형 서핑교실 기수를 선택해주세요.");
      return;
    }
    if (!photoBlob && !photoPath) {
      setError("선수 사진을 등록해주세요. (필수)");
      return;
    }

    const divisionName =
      competition?.divisions.find((d) => d.id === form.division_id)?.name ?? "";

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

      // ② 접수 등록 — 부문 택1 이므로 단수(division_id) 계약을 쓴다
      const res = await fetch(`${CERT_API}/api/public/comp-entry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          division_id: form.division_id,
          photo_path: uploadedPath,
          athlete_name: form.athlete_name.trim(),
          athlete_name_en: nameEn,
          athlete_phone: form.athlete_phone,
          athlete_birth_date: form.athlete_birth_date,
          athlete_gender: form.athlete_gender,
          // 기수는 소속(affiliation) 필드에 저장된다 — 콘솔·CSV 에서 바로 읽힌다
          affiliation: cohortAffiliation(form.cohort),
          ...(form.intro_message.trim()
            ? { intro_message: form.intro_message.trim() }
            : {}),
          // 통합 체크 1개가 개인정보·기록 공개·초상권 세 동의를 함께 의미한다
          privacy_consent: form.privacy_consent,
          publicity_consent: form.privacy_consent,
          portrait_consent: form.privacy_consent,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "접수에 실패했습니다.");
        return;
      }
      setSuccess({
        divisionName,
        athleteName: form.athlete_name.trim(),
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
        {brief}
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
      <>
        {brief}
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
      </>
    );
  }

  // 접수창 밖이면 서버(lineup)가 대회를 아예 내려주지 않는다 — 준비 중/마감을 구분해 안내
  if (!competition) {
    const closed = Date.now() > CUSTOM_COMP_ENTRY_WINDOW.closesAt;
    return (
      <>
        {brief}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center space-y-3">
          <h2 className="text-xl font-bold text-navy">
            {closed ? "접수가 마감되었습니다" : "접수 준비 중입니다"}
          </h2>
          <p className="text-sm text-navy/60">
            {closed
              ? "참가자 안내는 접수하신 연락처로 개별 발송됩니다."
              : "접수가 시작되면 이 페이지에서 바로 신청하실 수 있습니다."}
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-navy hover:bg-gray-50"
          >
            홈으로
          </Link>
        </div>
      </>
    );
  }

  if (success) {
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
            참가 신청이 완료되었습니다
          </h2>
          <p className="mt-3 text-sm sm:text-base text-navy/60">
            접수 확인 문자를 보내드렸습니다
          </p>
        </div>

        <div className="border-t border-dashed border-gray-200 px-6 sm:px-10 py-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-navy/40">
            신청 내역
          </p>
          <dl className="space-y-3 text-sm">
            <ReceiptRow label="선수" value={success.athleteName} />
            <ReceiptRow label="참가 부문" value={success.divisionName} />
            <ReceiptRow label="일시" value={CUSTOM_COMP.dateLabel} />
            <ReceiptRow label="장소" value={CUSTOM_COMP.venue} />
            <ReceiptRow label="참가비" value="무료" />
          </dl>
          <p className="mt-5 rounded-lg bg-gray-50 px-4 py-3 text-sm leading-relaxed text-navy/70">
            세부 진행 순서(조 편성·집결 시간)는 접수 마감 후 입력하신 연락처로
            안내드립니다. 참가 취소나 정보 수정이 필요하면 양양군서핑협회로
            연락해주세요.
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
            className="inline-flex items-center justify-center rounded-lg bg-purple px-5 py-2.5 text-sm font-bold text-white hover:bg-purple/90 transition"
          >
            다른 접수 보기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {brief}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 개인정보 동의 */}
        <Section title="개인정보 수집 및 이용 동의">
          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 space-y-2">
            <p className="font-medium">수집 항목 및 목적</p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>성명(국문·영문), 연락처: 대회 운영 안내 및 본인 확인</li>
              <li>생년월일, 성별: 부문 편성 · 보험 가입</li>
              <li>맞춤형 서핑교실 기수: 참가 자격 확인</li>
              <li>선수 사진: 대회 진행 화면·전광판 선수 이미지</li>
            </ul>
            <p className="text-xs">보유 기간: 대회 종료 후 1년</p>
            <p className="text-xs">
              제3자 제공: 로마드협동조합(알림 운영대행사) — 문자 발송 목적,
              이름·연락처, 발송 후 삭제
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 space-y-2">
            <p className="font-medium">초상권 사용 안내</p>
            <p className="text-xs">
              대회 기간 중 촬영된 사진이나 동영상은 관련 공공기관 및
              양양군서핑협회 홍보 활동 등에 사용될 수 있습니다.
            </p>
            <p className="font-medium pt-1">대회 기록 공개 안내</p>
            <p className="text-xs">
              대회 진행을 위해 성명·순위·점수가 현장 전광판, 협회 홈페이지에
              공개됩니다.
            </p>
          </div>
          <CheckRow
            checked={form.privacy_consent}
            onChange={(v) => updateField("privacy_consent", v)}
            label="개인정보 수집·이용, 초상권 사용 및 대회 기록 공개에 모두 동의합니다. (필수)"
          />
        </Section>

        {/* 참가 부문 */}
        <Section title="참가 부문 선택" required>
          <p className="text-sm text-gray-600">
            성인부·아동부 중 하나를 선택해주세요. 각 부문 정원은 48명이며 선착순
            마감됩니다.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {competition.divisions.map((d) => {
              const remaining = Math.max(0, d.capacity - d.confirmed_count);
              const full = remaining === 0;
              const isSelected = form.division_id === d.id;
              return (
                <label
                  key={d.id}
                  className={`flex items-center justify-between gap-3 rounded-lg border p-4 transition ${
                    full
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
                      disabled={full}
                      onChange={() => updateField("division_id", d.id)}
                      className="size-4 accent-purple"
                    />
                    <span className="text-base font-semibold text-navy">
                      {d.name}
                    </span>
                  </div>
                  {full ? (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                      정원 마감
                    </span>
                  ) : (
                    <span className="text-xs text-navy/50">
                      잔여 {remaining}명 / {d.capacity}명
                    </span>
                  )}
                </label>
              );
            })}
          </div>
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
            <Field label="영문 이름" required>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="성 (예: KIM)"
                  value={nameEnLast}
                  onChange={(e) => setNameEnLast(e.target.value.toUpperCase())}
                  className={inputCls}
                />
                <input
                  type="text"
                  required
                  placeholder="이름 (예: SUNSOO)"
                  value={nameEnFirst}
                  onChange={(e) => setNameEnFirst(e.target.value.toUpperCase())}
                  className={inputCls}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                전광판·기록지 표기에 사용됩니다.
              </p>
            </Field>
            <Field label="연락처" required>
              {/* 하이픈·공백을 넣어도 숫자만 남긴다 (서버도 정규화하지만 폼에서 통일) */}
              <input
                type="tel"
                required
                placeholder="01012345678"
                value={form.athlete_phone}
                onChange={(e) =>
                  updateField(
                    "athlete_phone",
                    e.target.value.replace(/[^0-9]/g, "")
                  )
                }
                className={inputCls}
              />
              <p className="mt-1 text-xs text-gray-500">
                아동부는 보호자 연락처를 입력해주세요.
              </p>
            </Field>
            <Field label="맞춤형 서핑교실 기수" required>
              <select
                required
                value={form.cohort}
                onChange={(e) => updateField("cohort", e.target.value)}
                className={inputCls}
              >
                <option value="">선택해주세요</option>
                {COHORT_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                여러 기수에 참여하셨다면 가장 최근 기수를 선택해주세요.
              </p>
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
            <div className="md:col-span-2">
              <Field label="하고 싶은 말">
                <textarea
                  value={form.intro_message}
                  onChange={(e) =>
                    updateField("intro_message", e.target.value.slice(0, 200))
                  }
                  rows={3}
                  maxLength={200}
                  placeholder="예: 맞춤형 교실 끝나고 첫 대회입니다. 재밌게 타고 오겠습니다!"
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-gray-500">
                  선택 사항, 최대 200자 — 대회 당일 현장 해설에 활용됩니다. (
                  {form.intro_message.length}/200)
                </p>
              </Field>
            </div>
          </div>
        </Section>

        {/* 선수 사진 */}
        <Section title="선수 사진" required>
          <p className="text-sm text-gray-600">
            대회 진행 화면·전광판의 선수 이미지로 사용됩니다. 얼굴이 잘 나온 정면
            사진을 올려주세요.
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
                JPG · PNG · WEBP / 업로드 시 자동으로 최대 1600px, JPEG로 줄여서
                전송합니다.
              </p>
              {photoProcessing && (
                <p className="text-xs text-navy/60">사진 처리 중...</p>
              )}
              {photoBlob && !photoProcessing && (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-medium text-teal">
                    사진 준비 완료 (
                    {Math.max(1, Math.round(photoBlob.size / 1024))}KB)
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

function ReceiptRow({ label, value }: { label: string; value: React.ReactNode }) {
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
  // 안내문 사이에 묻혀 지나치기 쉬운 필수 동의라 강조 박스로 (형님 피드백 2026-08-02)
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3.5 transition ${
        checked
          ? "border-purple bg-purple/10"
          : "border-purple/60 bg-purple/5 hover:bg-purple/10"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-5 shrink-0 accent-purple"
      />
      <span className="text-sm font-semibold text-navy">{label}</span>
    </label>
  );
}
