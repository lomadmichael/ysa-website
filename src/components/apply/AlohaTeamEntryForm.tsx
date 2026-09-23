"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Competition } from "./CompEntryForm";
import {
  ALOHA_TEAM,
  ALOHA_TEAM_ENTRY_WINDOW,
  ALOHA_TEAM_SLUG,
  ALOHA_REFUND_POLICY,
  TEAM_SIZE,
} from "./aloha-team";
import {
  ConsentRow,
  DepositBox,
  Field,
  GenderCount,
  MemberCard,
  ReceiptRow,
  Section,
  birthTooYoung,
  emptyMember,
  inputCls,
  isMinor,
  isValidMobile,
  type Member,
} from "./aloha-team-ui";

const CERT_API =
  process.env.NEXT_PUBLIC_CERT_API_BASE ?? "https://golineup.kr";

/** lineup 이 내려줄 수 있는 접수 여부 플래그 (없으면 목록 포함 = 접수 중으로 본다) */
type AlohaCompetition = Competition & { entry_open?: boolean };

interface Consents {
  privacy: boolean;
  publicity: boolean;
  portrait: boolean;
  refund: boolean;
  guardian: boolean;
}

interface SuccessPayload {
  teamName: string;
  repName: string;
  feeTotal: number;
  members: { name: string; isRep: boolean }[];
}

/**
 * 2026 양양군의장배 알로하 팀 챌린지 — 팀(혼성 4인) 단위 접수폼.
 *
 * 개인 접수 계약(comp-entry)이 아니라 lineup 의 팀 접수 계약(`/api/public/team-entry`)
 * 으로 팀원 4명을 한 번에 보낸다. 대표자 1명의 연락처로 접수·확정 문자가 가고,
 * 입금자명도 대표자 이름으로 맞춘다.
 */
export default function AlohaTeamEntryForm({
  initialCompetition = null,
  brief,
}: {
  initialCompetition?: AlohaCompetition | null;
  brief?: React.ReactNode;
}) {
  const [competition, setCompetition] = useState<AlohaCompetition | null>(
    initialCompetition
  );
  const [loading, setLoading] = useState(initialCompetition === null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const [teamName, setTeamName] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [members, setMembers] = useState<Member[]>(() =>
    Array.from({ length: TEAM_SIZE }, emptyMember)
  );
  const [repIndex, setRepIndex] = useState(0);
  const [consents, setConsents] = useState<Consents>({
    privacy: false,
    publicity: false,
    portrait: false,
    refund: false,
    guardian: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [errorMember, setErrorMember] = useState<number | null>(null);
  const [success, setSuccess] = useState<SuccessPayload | null>(null);
  const memberRefs = useRef<(HTMLDivElement | null)[]>([]);

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
      .then((data: { competitions?: AlohaCompetition[] }) => {
        if (cancelled) return;
        setCompetition(
          (data.competitions ?? []).find((c) => c.slug === ALOHA_TEAM_SLUG) ??
            null
        );
      })
      .catch((err: Error) => {
        if (cancelled) return;
        console.error("[aloha-team] competitions load failed:", err);
        setLoadError(err.message ?? "알 수 없는 오류");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [retryCount, initialCompetition]);

  const maleCount = members.filter((m) => m.gender === "M").length;
  const femaleCount = members.filter((m) => m.gender === "F").length;
  const genderOk = maleCount === 2 && femaleCount === 2;
  const hasMinor = members.some((m) => isMinor(m.birth_date));

  function updateMember<K extends keyof Member>(
    index: number,
    key: K,
    value: Member[K]
  ) {
    setMembers((list) =>
      list.map((m, i) => (i === index ? { ...m, [key]: value } : m))
    );
    if (errorMember === index) setErrorMember(null);
  }

  function fail(message: string, memberIndex: number | null = null): false {
    setError(message);
    setErrorMember(memberIndex);
    if (memberIndex !== null) {
      memberRefs.current[memberIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
    return false;
  }

  /** 제출 전 클라 검증 — 서버도 같은 규칙으로 다시 검증한다 */
  function validate(): boolean {
    if (!teamName.trim()) {
      return fail("팀명을 입력해주세요.");
    }
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      const label = `팀원 ${i + 1}`;
      if (!m.name.trim()) return fail(`${label}의 성명을 입력해주세요.`, i);
      if (!m.gender) return fail(`${label}의 성별을 선택해주세요.`, i);
      if (!m.birth_date)
        return fail(`${label}의 생년월일을 선택해주세요.`, i);
      if (birthTooYoung(m.birth_date))
        return fail(`${label}: 초등학생 이상(2019년 이전 출생)만 참가할 수 있습니다.`, i);
      if (!isValidMobile(m.phone))
        return fail(`${label}의 연락처를 정확히 입력해주세요.`, i);
      if (isMinor(m.birth_date)) {
        if (!m.guardian_name.trim())
          return fail(`${label}(미성년)의 보호자 성명을 입력해주세요.`, i);
        if (!isValidMobile(m.guardian_phone))
          return fail(`${label}(미성년)의 보호자 연락처를 정확히 입력해주세요.`, i);
      }
    }
    if (!genderOk) {
      return fail(
        `혼성 4인 팀은 남 2명 · 여 2명이어야 합니다. (현재 남 ${maleCount} · 여 ${femaleCount})`
      );
    }
    if (
      !consents.privacy ||
      !consents.publicity ||
      !consents.portrait ||
      !consents.refund
    ) {
      return fail("필수 동의 항목에 모두 동의해주세요.");
    }
    if (hasMinor && !consents.guardian) {
      return fail("미성년 팀원의 보호자 동의 항목에 체크해주세요.");
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return; // 연타·중복 제출 방지
    setError(null);
    setErrorMember(null);
    if (!competition) return;
    if (!validate()) return;

    const divisionId = competition.divisions[0]?.id;
    if (!divisionId) {
      fail("대회 부문 정보를 찾을 수 없습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const res = await fetch(`${CERT_API}/api/public/team-entry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          division_id: divisionId,
          team_name: teamName.trim(),
          ...(affiliation.trim() ? { affiliation: affiliation.trim() } : {}),
          rep_index: repIndex,
          members: members.map((m) => ({
            name: m.name.trim(),
            gender: m.gender,
            birth_date: m.birth_date,
            phone: m.phone,
            ...(isMinor(m.birth_date)
              ? {
                  guardian_name: m.guardian_name.trim(),
                  guardian_phone: m.guardian_phone,
                }
              : {}),
          })),
          privacy_consent: true,
          publicity_consent: true,
          portrait_consent: true,
          refund_consent: true,
          ...(hasMinor ? { guardian_consent: true } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const idx =
          typeof data?.member_index === "number" &&
          data.member_index >= 0 &&
          data.member_index < TEAM_SIZE
            ? (data.member_index as number)
            : null;
        fail(
          data?.error ??
            (res.status === 429
              ? "요청이 많습니다. 잠시 후 다시 시도해주세요."
              : "접수에 실패했습니다."),
          idx
        );
        return;
      }

      const entries: { name: string; member_no?: number; is_rep?: boolean }[] =
        Array.isArray(data?.entries) ? data.entries : [];
      const list =
        entries.length > 0
          ? [...entries]
              .sort((a, b) => (a.member_no ?? 0) - (b.member_no ?? 0))
              .map((en) => ({ name: en.name, isRep: !!en.is_rep }))
          : members.map((m, i) => ({ name: m.name.trim(), isRep: i === repIndex }));
      setSuccess({
        teamName: (data?.team_name as string) ?? teamName.trim(),
        repName: members[repIndex].name.trim(),
        feeTotal:
          typeof data?.fee_total === "number"
            ? data.fee_total
            : ALOHA_TEAM.feeAmount,
        members: list,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      fail("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      submittingRef.current = false;
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

  // 접수창 밖이면 lineup 이 대회를 목록에서 빼거나 entry_open=false 로 내려준다
  if (!competition || competition.entry_open === false) {
    const closed = Date.now() > ALOHA_TEAM_ENTRY_WINDOW.closesAt;
    return (
      <>
        {brief}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center space-y-3">
          <h2 className="text-xl font-bold text-navy">접수 기간이 아닙니다</h2>
          <p className="text-sm text-navy/60">
            {closed
              ? "접수가 마감되었습니다. 참가 안내는 팀 대표자 연락처로 개별 발송됩니다."
              : `접수 기간: ${ALOHA_TEAM.entryPeriodLabel}`}
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
            팀 참가 신청이 접수되었습니다
          </h2>
          <p className="mt-3 text-sm sm:text-base text-navy/60">
            접수 확인 문자가 대표자에게 발송됩니다
          </p>
        </div>

        <div className="border-t border-dashed border-gray-200 px-6 sm:px-10 py-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-navy/40">
            신청 내역
          </p>
          <dl className="space-y-3 text-sm">
            <ReceiptRow label="팀명" value={success.teamName} />
            <ReceiptRow
              label="팀원"
              value={
                <ul className="space-y-1">
                  {success.members.map((m, i) => (
                    <li key={`${m.name}-${i}`}>
                      {m.name}
                      {m.isRep && (
                        <span className="ml-1.5 inline-flex items-center rounded-full bg-sunset/15 px-2 py-0.5 text-[11px] font-bold text-sunset">
                          대표자
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              }
            />
            <ReceiptRow
              label="일시·장소"
              value={`${ALOHA_TEAM.dateLabel} · ${ALOHA_TEAM.venue}`}
            />
          </dl>
        </div>

        <div className="border-t border-dashed border-gray-200 px-6 sm:px-10 py-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-navy/40">
            입금 안내
          </p>
          <DepositBox repName={success.repName} amount={success.feeTotal} />
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-800">
            신청 후 <strong>3일 이내</strong> 미입금 시 접수가 취소됩니다.
            입금 확인 후 참가 확정 문자를 보내드립니다.
          </p>
          <p className="mt-3 text-sm text-navy/60">
            팀원 교체·정보 수정은 접수 마감 전까지{" "}
            <Link
              href="/apply/aloha-team/edit"
              className="font-semibold text-purple underline underline-offset-2"
            >
              팀 정보 수정
            </Link>
            에서 대표자가 직접 할 수 있습니다.
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

  const division = competition.divisions[0];
  // 부문 정원·접수 수는 **선수(명) 단위** — 팀 수로 환산해 표시 (80명 = 20팀)
  const capacityTeams = division ? Math.floor(division.capacity / TEAM_SIZE) : 0;
  const remainingTeams = division
    ? Math.max(
        0,
        Math.floor((division.capacity - division.confirmed_count) / TEAM_SIZE)
      )
    : null;

  return (
    <>
      {brief}
      <form onSubmit={handleSubmit} noValidate className="space-y-9">
        {/* 팀 정보 */}
        <Section title="팀 정보">
          {remainingTeams !== null && division && division.capacity > 0 && (
            <p className="text-xs text-navy/50">
              잔여 {remainingTeams}팀 / {capacityTeams}팀
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="팀명" required>
              <input
                type="text"
                value={teamName}
                maxLength={30}
                onChange={(e) => setTeamName(e.target.value.slice(0, 30))}
                placeholder="예: 죽도 파도타기"
                className={inputCls}
              />
            </Field>
            <Field label="소속">
              <input
                type="text"
                value={affiliation}
                maxLength={40}
                onChange={(e) => setAffiliation(e.target.value.slice(0, 40))}
                placeholder="동호회·서핑샵 등 (선택)"
                className={inputCls}
              />
            </Field>
          </div>
        </Section>

        {/* 팀원 */}
        <Section title="팀원 정보">
          <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur">
            <span className="text-sm font-semibold text-navy">
              <GenderCount label="남" count={maleCount} />
              <span className="mx-2 text-navy/30">·</span>
              <GenderCount label="여" count={femaleCount} />
            </span>
            <span
              className={`text-xs font-medium ${genderOk ? "text-teal" : "text-navy/50"}`}
            >
              {genderOk ? "혼성 구성 완료" : "남 2명 · 여 2명으로 구성해주세요"}
            </span>
          </div>
          <p className="rounded-lg bg-sunset/10 px-3.5 py-2.5 text-sm leading-relaxed text-navy/80">
            <strong className="text-navy">대표자</strong> 연락처로 접수·확정
            문자가 발송되며, 입금자명은 대표자 이름으로 해주세요.
          </p>

          <div className="space-y-4">
            {members.map((m, i) => (
              <MemberCard
                key={i}
                index={i}
                member={m}
                isRep={repIndex === i}
                highlighted={errorMember === i}
                cardRef={(el) => {
                  memberRefs.current[i] = el;
                }}
                onRep={() => setRepIndex(i)}
                onChange={(key, value) => updateMember(i, key, value)}
              />
            ))}
          </div>
        </Section>

        {/* 동의 */}
        <Section title="약관 동의" required>
          <div className="space-y-2.5">
            <ConsentRow
              checked={consents.privacy}
              onChange={(v) => setConsents((c) => ({ ...c, privacy: v }))}
              label="개인정보 수집·이용에 동의합니다. (필수)"
              detail={
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    수집 항목: 성명, 성별, 생년월일, 연락처, 소속
                    (미성년자는 보호자 성명·연락처)
                  </li>
                  <li>이용 목적: 대회 운영, 참가자 연락, 보험 가입</li>
                  <li>보유 기간: 대회 종료 후 1년</li>
                </ul>
              }
            />
            <ConsentRow
              checked={consents.publicity}
              onChange={(v) => setConsents((c) => ({ ...c, publicity: v }))}
              label="대회 기록(성명·팀명·기록) 공개에 동의합니다. (필수)"
            />
            <ConsentRow
              checked={consents.portrait}
              onChange={(v) => setConsents((c) => ({ ...c, portrait: v }))}
              label="대회 중 촬영된 사진·영상의 대회 홍보 활용(초상권)에 동의합니다. (필수)"
            />
            <ConsentRow
              checked={consents.refund}
              onChange={(v) => setConsents((c) => ({ ...c, refund: v }))}
              label="선수 교체·환불 규정을 확인했으며 동의합니다. (필수)"
              detail={
                <ul className="list-disc space-y-1 pl-5">
                  {ALOHA_REFUND_POLICY.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              }
            />
            {hasMinor && (
              <ConsentRow
                checked={consents.guardian}
                onChange={(v) => setConsents((c) => ({ ...c, guardian: v }))}
                label="미성년 팀원의 보호자가 대회 참가 및 위 사항에 동의했습니다. (필수)"
              />
            )}
          </div>
        </Section>

        {error && (
          <div
            role="alert"
            className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        <div className="space-y-2 pt-2">
          {!genderOk && (
            <p className="text-center text-sm font-medium text-red-600 sm:text-right">
              남 2명 · 여 2명이 되어야 신청할 수 있습니다. (현재 남 {maleCount}{" "}
              · 여 {femaleCount})
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 font-medium hover:bg-gray-50"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={submitting || !genderOk}
              className="inline-flex items-center justify-center rounded-lg bg-purple px-8 py-3.5 text-base text-white font-bold hover:bg-purple/90 disabled:opacity-50"
            >
              {submitting ? "접수 중..." : "팀 참가 신청하기"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
