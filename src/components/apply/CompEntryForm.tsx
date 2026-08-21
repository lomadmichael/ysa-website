"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import BirthDatePicker from "./BirthDatePicker";
import DepositNotice from "./DepositNotice";
import {
  ENTRY_FEE_PER_DIVISION,
  formatKrw,
  isInEntryGroup,
  type EntryGroup,
} from "@/lib/festival-2026";
import { COUNTRIES, countryName } from "@/lib/countries";
import { ACCEPTED_IMAGE_TYPES, resizeToJpeg } from "@/lib/athlete-photo";
import { CUSTOM_COMP_SLUG } from "@/lib/custom-comp-2026";

// ApplyForm 과 동일한 API base 정책 (golineup.kr fallback + env override)
const CERT_API =
  process.env.NEXT_PUBLIC_CERT_API_BASE ?? "https://golineup.kr";

// ── 다음(카카오) 우편번호 서비스 — 주소 검색 (키 불필요, 무료) ──
// 팝업 대신 페이지 내 embed 레이어 사용: 팝업 차단 이슈 없음 + 모바일 UX 안정.
// window.daum 타입은 src/types/daum.d.ts (KakaoMap 의 roughmap 과 전역 공유)
let daumPostcodePromise: Promise<void> | null = null;
function loadDaumPostcode(): Promise<void> {
  if (window.daum?.Postcode) return Promise.resolve();
  if (!daumPostcodePromise) {
    daumPostcodePromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      script.onload = () => resolve();
      script.onerror = () => {
        daumPostcodePromise = null; // 실패 시 재시도 가능하게
        reject(new Error("postcode script load failed"));
      };
      document.head.appendChild(script);
    });
  }
  return daumPostcodePromise;
}

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
  /** 영문 성명 — 국가대표 선발 관련 대회라 필수 (2026-07-29 계약 확장) */
  athlete_name_en: string;
  athlete_phone: string;
  athlete_birth_date: string;
  athlete_gender: "" | "M" | "F";
  /**
   * 국적 — ISO 3166-1 alpha-2. (2026-08-01 추가)
   * 코리아 오픈은 국가대표 선발 포인트가 부여되는 대회라 **대한민국 국적 선수만
   * 참가할 수 있다** (2026-08-21 확인). 국적은 그 자격 검증과 선수 등록·보험
   * 처리에 쓰인다. 비기너 서핑대회는 국적 제한이 없다.
   */
  athlete_nationality: string;
  athlete_email: string;
  affiliation: string;
  /** 입문연도 — 선택. 현장 해설자 소개용 (2026-08-04 형님 요청) */
  started_year: string;
  /** 하고 싶은 말 — 선택, 200자. 현장 해설자가 소개하는 재미 요소 */
  intro_message: string;
  /** 주소 — 기념품/공문 발송용 필수 */
  address: string;
  /** 개인정보 수집·이용 + 초상권 사용 + 대회 기록 공개 통합 동의 (형님 확정 —
      체크 1개로 받고 API 에는 privacy/portrait/publicity 세 값으로 전송) */
  privacy_consent: boolean;
  refund_consent: boolean;
  /** 참가자격 확인 — 비기너 부문 선택 시에만 필수 (2023-01-01 이후 입문) */
  eligibility_consent: boolean;
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

/* ── 선수 사진 처리는 `@/lib/athlete-photo` 공용 모듈 (맞춤형 대회 폼과 공유) ── */

/**
 * 이 폼이 다루는 대회 목록.
 * 맞춤형 서핑대회는 참가비·수집 항목이 완전히 달라 전용 폼(/apply/custom-competition)
 * 에서만 접수한다 — 여기 섞이면 무료 대회에 참가비 5만원이 합산돼 표시된다.
 */
function visibleCompetitions(
  list: Competition[],
  group: EntryGroup | null = null
): Competition[] {
  return list.filter(
    (c) => c.slug !== CUSTOM_COMP_SLUG && isInEntryGroup(c.slug, group)
  );
}

/** 부문 참가비: entry_fee_override → competition.entry_fee → 기본값 순 */
function divisionFee(d: CompDivision, c: Competition): number {
  const fee = d.entry_fee_override ?? c.entry_fee;
  return typeof fee === "number" && fee > 0 ? fee : ENTRY_FEE_PER_DIVISION;
}

/* ── 폼 ──────────────────────────────────────────────────────── */

export default function CompEntryForm({
  initialCompetitions = [],
  group = null,
  brief,
  children,
}: {
  initialCompetitions?: Competition[];
  /** `?type=` 로 지정된 대회 그룹. null 이면 전체 노출(종전 동작) */
  group?: EntryGroup | null;
  /**
   * 폼 위에 노출할 대회 안내(포스터·일정·장소). 접수 완료 화면에서는 숨긴다.
   */
  brief?: React.ReactNode;
  /**
   * 폼 위에 노출할 안내 영역(서버 컴포넌트 슬롯).
   * 접수 완료 화면에서는 합계가 포함된 안내를 따로 보여주므로 렌더하지 않는다.
   */
  children?: React.ReactNode;
}) {
  const [competitions, setCompetitions] = useState<Competition[]>(() =>
    visibleCompetitions(initialCompetitions, group)
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

  // 영문 이름 — 성/이름 분리 입력 (형님 확정 2026-08-02: "KIMSUNSOO" 처럼
  // 붙여 쓰면 사후 분리 불가 → 국제 명부(ISA) 대비 분리 수집).
  // 저장·전송은 "성 이름" 조합 단일 필드 (API 계약 무변경, 첫 토큰 = 성)
  const [nameEnLast, setNameEnLast] = useState("");
  const [nameEnFirst, setNameEnFirst] = useState("");
  useEffect(() => {
    const combined = [nameEnLast.trim(), nameEnFirst.trim()]
      .filter(Boolean)
      .join(" ");
    setForm((f) => ({ ...f, athlete_name_en: combined }));
  }, [nameEnLast, nameEnFirst]);

  // 주소 검색 (다음 우편번호) — 기본주소는 검색으로만, 상세주소는 직접 입력.
  // form.address 에는 "(우편번호) 도로명주소 상세주소" 로 합쳐 저장 (API 계약 무변경)
  const [addrBase, setAddrBase] = useState("");
  const [addrDetail, setAddrDetail] = useState("");
  const [postcodeOpen, setPostcodeOpen] = useState(false);
  const [postcodeError, setPostcodeError] = useState<string | null>(null);
  const postcodeRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Form>({
    division_ids: [],
    athlete_name: "",
    athlete_name_en: "",
    athlete_phone: "",
    athlete_birth_date: "",
    athlete_gender: "",
    athlete_nationality: "KR",
    athlete_email: "",
    affiliation: "",
    started_year: "",
    intro_message: "",
    address: "",
    privacy_consent: false,
    refund_consent: false,
    eligibility_consent: false,
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
        setCompetitions(visibleCompetitions(data.competitions ?? [], group));
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
  }, [retryCount, initialCompetitions.length, group]);

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

  // 비기너 부문 포함 여부 — 참가자격(2023-01-01 이후 입문) 확인이 필수가 된다.
  // slug 하드코딩 대신 대회명으로 판별 (스테이징 테스트 대회도 커버)
  const beginnerSelected = useMemo(
    () =>
      form.division_ids.some((id) =>
        divisionIndex.get(id)?.competition.name.includes("비기너")
      ),
    [form.division_ids, divisionIndex]
  );

  // 코리아 오픈 부문 포함 여부 — 대한민국 국적만 접수 가능해진다.
  // 코리아 오픈은 국가대표 선발 포인트가 부여되는 대회라 대한민국 국적 선수만
  // 참가할 수 있는데, 폼에 제한 안내가 전혀 없어 인도네시아 국적 선수가 숏보드에
  // 접수하는 일이 있었다 (2026-08-20, 접수 후 개별 안내·환불로 처리).
  // 판별은 하드코딩 대신 slug prefix(`ksa-cup-2026-open-*`) 기준.
  // 비기너 서핑대회(`ksa-cup-2026-beginner`)는 국적 제한이 없다.
  const openSelected = useMemo(
    () =>
      form.division_ids.some((id) => {
        const slug = divisionIndex.get(id)?.competition.slug;
        return !!slug && isInEntryGroup(slug, "open");
      }),
    [form.division_ids, divisionIndex]
  );

  /** 노출 중인 대회에 코리아 오픈이 있는지 — 부문 선택 전 사전 안내용 */
  const hasOpenCompetition = useMemo(
    () => competitions.some((c) => isInEntryGroup(c.slug, "open")),
    [competitions]
  );
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

  // 기본주소/상세주소 → form.address 합성 ("(우편번호) 도로명 상세").
  // 조합 지점을 여기 하나로 — oncomplete 클로저의 stale detail 문제 회피
  useEffect(() => {
    setForm((f) => ({
      ...f,
      address: addrBase
        ? `${addrBase}${addrDetail.trim() ? ` ${addrDetail.trim()}` : ""}`
        : "",
    }));
  }, [addrBase, addrDetail]);

  /** 주소 검색 레이어 열기 — 스크립트 로드 후 레이어만 연다 (embed 는 아래 effect) */
  async function openPostcode() {
    setPostcodeError(null);
    try {
      await loadDaumPostcode();
    } catch {
      setPostcodeError(
        "주소 검색을 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
      );
      return;
    }
    setPostcodeOpen(true);
  }

  // 레이어 div 가 실제로 마운트된 뒤에 embed — rAF 는 React 커밋 전에 돌아
  // ref 가 null 이라 조용히 실패했다 (실검증에서 발견). effect 가 보장 지점.
  useEffect(() => {
    if (!postcodeOpen) return;
    const el = postcodeRef.current;
    const Postcode = window.daum?.Postcode;
    if (!el || !Postcode) return;
    el.innerHTML = "";
    new Postcode({
      oncomplete: (data) => {
        const road = data.roadAddress || data.jibunAddress;
        setAddrBase(`(${data.zonecode}) ${road}`);
        setPostcodeOpen(false);
      },
      width: "100%",
      height: "100%",
    }).embed(el);
  }, [postcodeOpen]);

  /** 성별 선택/변경 — 새 성별과 맞지 않는 부문 선택을 자동 해제
      (남자 부문 + 여자 부문 동시 선택 방지, 형님 확정 2026-07-29) */
  function selectGender(g: "M" | "F") {
    setForm((f) => ({
      ...f,
      athlete_gender: g,
      division_ids: f.division_ids.filter((id) => {
        const hit = divisionIndex.get(id);
        return !hit?.division.gender || hit.division.gender === g;
      }),
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
      setError("개인정보 수집·이용 및 초상권·대회 기록 공개에 동의해주세요.");
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
    // 성별-부문 불일치 이중 방어 (UI 잠금 + 자동 해제가 1차, 여기가 2차)
    const genderMismatched = form.division_ids.some((id) => {
      const hit = divisionIndex.get(id);
      return !!hit?.division.gender && hit.division.gender !== form.athlete_gender;
    });
    if (genderMismatched) {
      setError("성별과 맞지 않는 부문이 선택되어 있습니다. 선택을 확인해주세요.");
      return;
    }
    if (beginnerSelected && !form.eligibility_consent) {
      setError("비기너 부문 참가자격(2023년 1월 1일 이후 입문) 확인에 체크해주세요.");
      return;
    }
    // 코리아 오픈 = 국가대표 선발 포인트 부여 대회 → 대한민국 국적만 참가 가능.
    // (2026-08-20 외국 국적 선수 접수 사고 → 폼 단계에서 차단. 문구는 한/영 병기)
    if (openSelected && form.athlete_nationality !== "KR") {
      setError(
        "코리아 오픈은 국가대표 선발 포인트가 부여되는 대회로, 대한민국 국적 선수만 참가할 수 있습니다. / The Korea Open is open to athletes with Korean nationality only."
      );
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
    if (!nameEnLast.trim() || !nameEnFirst.trim()) {
      setError("영문 이름(성·이름)을 모두 입력해주세요. (필수)");
      return;
    }
    if (!/^[A-Za-z][A-Za-z .'-]*$/.test(form.athlete_name_en.trim())) {
      setError("영문 이름은 영문으로만 입력해주세요. (예: KIM SUNSOO)");
      return;
    }
    if (!form.athlete_nationality) {
      setError("국적을 선택해주세요. (필수)");
      return;
    }
    if (!form.address.trim()) {
      setError("주소 검색으로 주소를 입력해주세요. (필수)");
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
          athlete_name_en: form.athlete_name_en.trim(),
          athlete_phone: form.athlete_phone,
          athlete_birth_date: form.athlete_birth_date,
          athlete_gender: form.athlete_gender,
          athlete_nationality: form.athlete_nationality,
          athlete_email: form.athlete_email || null,
          affiliation: form.affiliation || null,
          // 해설자 소개용 선택 항목 — 값이 있을 때만 전송 (계약: 보낸 경우만 기록)
          ...(beginnerSelected && form.started_year.trim()
            ? { started_year: form.started_year.trim() }
            : {}),
          ...(form.intro_message.trim()
            ? { intro_message: form.intro_message.trim() }
            : {}),
          address: form.address.trim(),
          // 통합 체크 1개가 개인정보·기록 공개·초상권 세 동의를 함께 의미한다
          privacy_consent: form.privacy_consent,
          publicity_consent: form.privacy_consent,
          refund_consent: form.refund_consent,
          portrait_consent: form.privacy_consent,
          // 참가자격 확인은 비기너 부문 선택 시에만 전송 (계약: 보낸 경우만 기록)
          ...(beginnerSelected
            ? { eligibility_consent: form.eligibility_consent }
            : {}),
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
        {brief}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
        {children}
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
              <ReceiptRow
                label="국적"
                value={countryName(form.athlete_nationality)}
              />
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
      {/* 대회 안내(포스터·일정·장소)는 폼 위, 참가비 입금 안내(children)는 폼 하단 */}
      {brief}
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
              <li>성명(국문·영문), 연락처: 대회 운영 안내 및 본인 확인</li>
              <li>생년월일, 성별, 국적: 부문 편성 · 보험 가입 · 선수 등록</li>
              <li>소속: 대회 안내 방송 및 결과 표기</li>
              <li>주소: 기념품·공문 발송</li>
              <li>선수 사진: 대회 중계 화면·전광판 선수 이미지</li>
            </ul>
            <p className="text-xs">보유 기간: 대회 종료 후 1년</p>
            <p className="text-xs">
              제3자 제공: 로마드협동조합(알림 운영대행사) — 알림톡 발송 목적,
              이름·연락처, 발송 후 삭제
            </p>
          </div>
          {/* 초상권·기록 공개 안내 — 개인정보 동의에 포함해 체크 1개로 통합 (형님 확정) */}
          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 space-y-2">
            <p className="font-medium">초상권 사용 안내</p>
            <p className="text-xs">
              대한서핑협회장배 서핑대회 기간 중 촬영된 사진이나 동영상은 관련
              공공기관 및 양양군서핑협회 홍보 활동 등에 사용될 수 있습니다.
            </p>
            <p className="font-medium pt-1">대회 기록 공개 안내</p>
            <p className="text-xs">
              대회 진행을 위해 성명·소속·순위·점수가 현장 전광판, 협회 홈페이지,
              중계 화면에 공개됩니다.
            </p>
          </div>
          <CheckRow
            emphasized
            checked={form.privacy_consent}
            onChange={(v) => updateField("privacy_consent", v)}
            label="개인정보 수집·이용, 초상권 사용 및 대회 기록 공개에 모두 동의합니다. (필수)"
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
            <Field label="영문 이름 (여권 표기)" required>
              {/* 성/이름 분리 — 붙여쓰기(KIMSUNSOO) 방지. 타이핑 즉시 대문자 */}
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
            </Field>
            <Field label="국적" required>
              <select
                required
                value={form.athlete_nationality}
                onChange={(e) =>
                  updateField("athlete_nationality", e.target.value)
                }
                className={inputCls}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
              {/* 코리아 오픈 국적 제한 — 제출 전에 알 수 있게 (2026-08-21) */}
              {openSelected && (
                <p className="mt-1 text-xs text-gray-500">
                  코리아 오픈은 국가대표 선발 포인트 부여 대회로 대한민국 국적
                  선수만 참가할 수 있습니다.
                </p>
              )}
              {openSelected && form.athlete_nationality !== "KR" && (
                <div className="mt-2 space-y-1 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  <p className="font-semibold">
                    선택하신 국적으로는 코리아 오픈에 접수할 수 없습니다.
                  </p>
                  <p>
                    코리아 오픈은 국가대표 선발 포인트가 부여되는 대회로, 대한민국
                    국적 선수만 참가할 수 있습니다.
                  </p>
                  <p className="font-semibold">
                    The Korea Open is open to athletes with Korean nationality
                    only.
                  </p>
                </div>
              )}
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
                      onChange={() => selectGender(g)}
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
              <p className="mt-1 text-xs text-gray-500">
                선택 사항이며, 없으시면 안 적으셔도 됩니다.
              </p>
            </Field>
            {/* 입문연도는 비기너 대회 소개용 항목 — 코리아 오픈에는 불필요
                (형님 지적 2026-08-12). 비기너 부문을 선택했을 때만 노출한다. */}
            {beginnerSelected && (
              <Field label="서핑 입문연도">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={form.started_year}
                  onChange={(e) =>
                    updateField(
                      "started_year",
                      e.target.value.replace(/[^0-9]/g, ""),
                    )
                  }
                  placeholder="예: 2023"
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-gray-500">
                  선택 사항 — 현장 해설자가 선수 소개에 활용합니다.
                </p>
              </Field>
            )}
            <div className="md:col-span-2">
              <Field label="하고 싶은 말">
                <textarea
                  value={form.intro_message}
                  onChange={(e) =>
                    updateField("intro_message", e.target.value.slice(0, 200))
                  }
                  rows={3}
                  maxLength={200}
                  placeholder="예: 3년 만에 첫 대회 출전입니다! 응원해주세요 🙌"
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-gray-500">
                  선택 사항, 최대 200자 — 경기 중 현장 해설자가 소개해 드릴 수
                  있어요. ({form.intro_message.length}/200)
                </p>
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="주소" required>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      placeholder="주소 검색 버튼을 눌러주세요"
                      value={addrBase}
                      onClick={openPostcode}
                      className={`${inputCls} cursor-pointer bg-gray-50`}
                    />
                    <button
                      type="button"
                      onClick={openPostcode}
                      className="shrink-0 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                    >
                      주소 검색
                    </button>
                  </div>
                  {postcodeOpen && (
                    <div className="relative overflow-hidden rounded-lg border border-gray-300">
                      <button
                        type="button"
                        onClick={() => setPostcodeOpen(false)}
                        className="absolute right-2 top-2 z-10 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-gray-600 shadow hover:bg-white"
                      >
                        닫기 ✕
                      </button>
                      <div ref={postcodeRef} className="h-[420px] w-full" />
                    </div>
                  )}
                  {postcodeError && (
                    <p className="text-xs text-red-600">{postcodeError}</p>
                  )}
                  <input
                    type="text"
                    placeholder="상세주소 (동·호수 등)"
                    value={addrDetail}
                    onChange={(e) => setAddrDetail(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </Field>
            </div>
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
            합산됩니다.{" "}
            <span className="font-medium text-gray-700">
              성별을 먼저 선택하면 참가 가능한 부문이 활성화됩니다.
            </span>
          </p>
          {/* 국적 제한은 부문을 고르기 전에 보여야 헛접수를 막는다 (2026-08-21) */}
          {hasOpenCompetition && (
            <p className="text-sm text-red-700">
              코리아 오픈(숏보드·롱보드·SUP 서핑)은 국가대표 선발 포인트 부여
              대회로 <strong>대한민국 국적 선수만</strong> 참가할 수 있습니다. /
              The Korea Open is open to athletes with Korean nationality only.
            </p>
          )}
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
                      // 성별 연동 — 성별 미선택이거나 다른 성별 부문이면 잠금
                      // (남자 부문 + 여자 부문 동시 선택 방지, 형님 확정)
                      const genderLocked =
                        !!d.gender && d.gender !== form.athlete_gender;
                      const disabled = closed || genderLocked;
                      const isSelected = form.division_ids.includes(d.id);
                      return (
                        <label
                          key={d.id}
                          className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 transition ${
                            disabled
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
                              disabled={disabled}
                              onChange={() => !disabled && toggleDivision(d.id)}
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
                          {/* 2026 대회는 정원 없이 전원 접수 — 정원·참가비 표기 제거
                              (형님 확정 2026-07-29. 합계는 하단 합산 바가 안내) */}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* 참가 자격 동의 — 비기너 부문 선택 시에만 (형님 확정: 2023년 1월 1일 기준) */}
        {beginnerSelected && (
          <Section title="참가 자격 동의 (비기너)" required>
            {/* 박탈 경고는 체크박스 아래 빨간 문구로만 노출 (중복 제거, 형님 확정 2026-08-02) */}
            <p className="text-sm text-gray-600 mb-3">
              비기너 부문은 <strong>2023년 1월 1일 이후 서핑에 입문한 분</strong>만
              참가할 수 있으며, <strong>국내외 서핑대회 입상자는 참가할 수 없습니다.</strong>
            </p>
            <CheckRow
              checked={form.eligibility_consent}
              onChange={(v) => updateField("eligibility_consent", v)}
              label="예, 2023년 1월 1일 이후 서핑에 입문했으며 국내외 서핑대회 입상 경력이 없습니다. (필수)"
            />
            <p className="mt-1 text-xs text-red-600">
              (입상 후 2023년 1월 1일 이전 입문 제보 시 입상자격이 박탈됩니다.)
            </p>
          </Section>
        )}

        {/* 대회 기록 공개 동의는 개인정보 통합 동의에 포함됨 (형님 확정 —
            비기너 흐름에서는 이 자리가 참가 자격 동의) */}

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

        {/* 참가비 입금 안내 — 제일 하단 배치 (형님 확정 2026-07-29) */}
        {children}

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
  emphasized = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  /** 강조 박스 스타일 — 안내문 사이에 묻혀 지나치기 쉬운 필수 동의에 사용
      (형님 피드백 2026-08-02: 개인정보 동의 체크를 자꾸 지나침) */
  emphasized?: boolean;
}) {
  if (emphasized) {
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
  return (
    <label className="flex cursor-pointer items-start gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 shrink-0"
      />
      <span>{label}</span>
    </label>
  );
}

// CountPill(정원/대기 표시)은 2026 무제한 접수 대회에서 표기 제거로 미사용 —
// 정원제 대회가 다시 생기면 git 이력에서 복원
