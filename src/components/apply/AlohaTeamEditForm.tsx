"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ALOHA_EDIT_DEADLINE_LABEL,
  ALOHA_TEAM,
  ALOHA_TEAM_SLUG,
  TEAM_SIZE,
} from "./aloha-team";
import {
  ConsentRow,
  DepositBox,
  Field,
  GenderBar,
  Hint,
  MemberCard,
  ReceiptRow,
  Section,
  birthTooYoung,
  btnPrimary,
  btnSecondary,
  btnSecondarySm,
  digits,
  formatPhoneLive,
  inputCls,
  isMinor,
  isValidMobile,
  linkCls,
  memberLabel,
  type Member,
} from "./aloha-team-ui";

const CERT_API =
  process.env.NEXT_PUBLIC_CERT_API_BASE ?? "https://golineup.kr";

/** 새로고침해도 30분 세션을 유지하기 위한 보관 키 (탭 단위 sessionStorage) */
const SESSION_KEY = "ysa:aloha-team-edit";
const RESEND_COOLDOWN = 60;
const EXPIRED_MESSAGE = "인증이 만료되었습니다. 다시 인증해주세요.";

interface TeamMember {
  entry_id: string;
  member_no: number;
  is_rep: boolean;
  name: string;
  gender: "M" | "F";
  birth_date: string;
  phone: string;
  guardian_name: string | null;
  guardian_phone: string | null;
}

interface TeamData {
  team_id: string;
  team_name: string;
  affiliation: string | null;
  competition_name: string;
  entry_closes_at: string | null;
  editable: boolean;
  paid: boolean;
  members: TeamMember[];
}

interface Session {
  token: string;
  expires_at: string;
}

type EditMember = Member & { entry_id: string };

type Step = "restoring" | "phone" | "code" | "team";

/* ── 세션 보관 (실패해도 메모리 state 로 동작) ───────────────────────────── */

function loadSession(): Session | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (!s?.token || !s.expires_at) return null;
    if (Date.parse(s.expires_at) <= Date.now()) return null;
    return s;
  } catch {
    return null;
  }
}

function saveSession(s: Session | null) {
  try {
    if (s) window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* 사생활 보호 모드 등 — 무시 */
  }
}

async function callApi(
  path: string,
  init: RequestInit & { token?: string } = {}
): Promise<{ status: number; data: Record<string, unknown> }> {
  const { token, headers, ...rest } = init;
  const res = await fetch(`${CERT_API}${path}`, {
    ...rest,
    headers: {
      ...(rest.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: res.status, data };
}

const errText = (data: Record<string, unknown>, fallback: string) =>
  typeof data.error === "string" && data.error ? data.error : fallback;

/**
 * 화면 순서 — 대표자(is_rep)가 항상 첫 칸, 나머지는 member_no 순으로 팀원 1~3.
 * 대표자 자체를 바꾸려면 첫 칸(대표자)의 이름·연락처를 새 사람으로 고친다.
 */
function orderedMembers(team: TeamData): TeamMember[] {
  return [...team.members].sort(
    (a, b) =>
      Number(b.is_rep) - Number(a.is_rep) || a.member_no - b.member_no
  );
}

function toEditMembers(team: TeamData): EditMember[] {
  return orderedMembers(team).map((m) => ({
    entry_id: m.entry_id,
    name: m.name ?? "",
    gender: m.gender ?? "",
    birth_date: m.birth_date ?? "",
    phone: digits(m.phone ?? ""),
    guardian_name: m.guardian_name ?? "",
    guardian_phone: digits(m.guardian_phone ?? ""),
  }));
}

const repOf = (team: TeamData) => team.members.find((m) => m.is_rep) ?? null;

/**
 * 알로하 팀 챌린지 — 팀 대표자가 자기 팀 정보를 직접 수정하는 화면.
 *
 * 1) 대표자 휴대폰 인증번호 발송 → 2) 6자리 확인 → 3) 팀 조회·수정.
 * 토큰은 메모리 state 가 원본이고, 새로고침 대비로 sessionStorage 에도 둔다.
 */
export default function AlohaTeamEditForm() {
  const [step, setStep] = useState<Step>("restoring");
  const [session, setSession] = useState<Session | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // step 1·2
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [authBusy, setAuthBusy] = useState(false);
  const authBusyRef = useRef(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // step 3
  const [team, setTeam] = useState<TeamData | null>(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [members, setMembers] = useState<EditMember[]>([]);
  const [guardianConsent, setGuardianConsent] = useState(false);

  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [errorMember, setErrorMember] = useState<number | null>(null);
  const [saved, setSaved] = useState<string[] | null>(null);
  // 저장 완료 화면 — 저장 후 폼 위로만 스크롤되면 반영 여부가 불명확하다는 형님 피드백(9/23)
  const [done, setDone] = useState<{ changes: string[]; notes: string[] } | null>(
    null
  );
  const memberRefs = useRef<(HTMLDivElement | null)[]>([]);

  /** 서버 응답으로 화면·폼 상태를 통째로 맞춘다 */
  const applyTeam = useCallback((t: TeamData) => {
    setTeam(t);
    setTeamName(t.team_name ?? "");
    setAffiliation(t.affiliation ?? "");
    setMembers(toEditMembers(t));
    setGuardianConsent(false);
    setError(null);
    setErrorMember(null);
  }, []);

  /** 인증 만료·무효 → 1단계로 */
  const expire = useCallback((message: string = EXPIRED_MESSAGE) => {
    saveSession(null);
    setSession(null);
    setTeam(null);
    setCode("");
    setNotice(message);
    setStep("phone");
  }, []);

  const loadTeam = useCallback(
    async (s: Session) => {
      setTeamLoading(true);
      setTeamError(null);
      try {
        const { status, data } = await callApi("/api/public/team-edit/team", {
          token: s.token,
        });
        if (status === 401) return expire();
        if (status === 410) {
          return expire(
            errText(data, "취소된 팀은 정보를 수정할 수 없습니다.")
          );
        }
        if (status < 200 || status >= 300) {
          setTeamError(errText(data, "팀 정보를 불러오지 못했습니다."));
          return;
        }
        applyTeam(data as unknown as TeamData);
      } catch {
        setTeamError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        setTeamLoading(false);
      }
    },
    [applyTeam, expire]
  );

  // 새로고침 시 30분 세션 복원
  useEffect(() => {
    const s = loadSession();
    if (s) {
      setSession(s);
      setStep("team");
      void loadTeam(s);
    } else {
      setStep("phone");
    }
  }, [loadTeam]);

  // 재발송 카운트다운
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  /* ── 1·2단계: 인증 ─────────────────────────────────────────────────────── */

  async function sendCode() {
    if (authBusyRef.current || cooldown > 0) return;
    setAuthError(null);
    setNotice(null);
    if (!isValidMobile(phone)) {
      setAuthError("휴대폰 번호를 정확히 입력해주세요.");
      return;
    }
    authBusyRef.current = true;
    setAuthBusy(true);
    try {
      const { status, data } = await callApi(
        "/api/public/team-edit/send-code",
        {
          method: "POST",
          body: JSON.stringify({ competition_slug: ALOHA_TEAM_SLUG, phone }),
        }
      );
      if (status < 200 || status >= 300) {
        setAuthError(
          errText(
            data,
            status === 404
              ? "이 번호로 신청한 팀 대표자를 찾을 수 없습니다."
              : status === 429
                ? "요청이 많습니다. 잠시 후 다시 시도해주세요."
                : "인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요."
          )
        );
        return;
      }
      setCooldown(RESEND_COOLDOWN);
      setCode("");
      setStep("code");
    } catch {
      setAuthError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      authBusyRef.current = false;
      setAuthBusy(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (authBusyRef.current) return;
    setAuthError(null);
    if (!/^[0-9]{6}$/.test(code)) {
      setAuthError("인증번호 6자리를 입력해주세요.");
      return;
    }
    authBusyRef.current = true;
    setAuthBusy(true);
    try {
      const { status, data } = await callApi("/api/public/team-edit/verify", {
        method: "POST",
        body: JSON.stringify({
          competition_slug: ALOHA_TEAM_SLUG,
          phone,
          code,
        }),
      });
      if (
        status < 200 ||
        status >= 300 ||
        typeof data.token !== "string" ||
        !data.token
      ) {
        setAuthError(errText(data, "인증번호가 올바르지 않습니다."));
        return;
      }
      const s: Session = {
        token: data.token,
        expires_at:
          typeof data.expires_at === "string"
            ? data.expires_at
            : new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };
      saveSession(s);
      setSession(s);
      setSaved(null);
      setStep("team");
      await loadTeam(s);
    } catch {
      setAuthError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      authBusyRef.current = false;
      setAuthBusy(false);
    }
  }

  /* ── 3단계: 수정 ───────────────────────────────────────────────────────── */

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
    setSaved(null);
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

  function validate(): boolean {
    if (!teamName.trim()) return fail("팀명을 입력해주세요.");
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      const label = memberLabel(i);
      if (!m.name.trim()) return fail(`${label}의 성명을 입력해주세요.`, i);
      if (!m.gender) return fail(`${label}의 성별을 선택해주세요.`, i);
      if (!m.birth_date) return fail(`${label}의 생년월일을 선택해주세요.`, i);
      if (birthTooYoung(m.birth_date))
        return fail(
          `${label}: 생년월일을 다시 확인해주세요.`,
          i
        );
      if (!isValidMobile(m.phone))
        return fail(`${label}의 연락처를 정확히 입력해주세요.`, i);
      if (isMinor(m.birth_date)) {
        if (!m.guardian_name.trim())
          return fail(`${label}(미성년)의 보호자 성명을 입력해주세요.`, i);
        if (!isValidMobile(m.guardian_phone))
          return fail(
            `${label}(미성년)의 보호자 연락처를 정확히 입력해주세요.`,
            i
          );
      }
    }
    if (!genderOk) {
      return fail(
        `혼성 4인 팀은 남 2명 · 여 2명이어야 합니다. (현재 남 ${maleCount} · 여 ${femaleCount})`
      );
    }
    if (hasMinor && !guardianConsent) {
      return fail("미성년 팀원의 보호자 동의 항목에 체크해주세요.");
    }
    return true;
  }

  /** 확인창·저장 결과에 쓰는 변경 요약 (원본 대비) */
  function summarizeChanges(t: TeamData): string[] {
    const lines: string[] = [];
    if (teamName.trim() !== (t.team_name ?? "")) {
      lines.push(`팀명: ${t.team_name} → ${teamName.trim()}`);
    }
    if (affiliation.trim() !== (t.affiliation ?? "")) {
      lines.push(
        `소속: ${t.affiliation || "(없음)"} → ${affiliation.trim() || "(없음)"}`
      );
    }
    const orig = orderedMembers(t);
    members.forEach((m, i) => {
      const o = orig.find((x) => x.entry_id === m.entry_id);
      if (!o) return;
      const label = memberLabel(i);
      const name = m.name.trim();
      if (name !== o.name) {
        lines.push(`${label}: ${o.name} → ${name}`);
        return;
      }
      const fields: string[] = [];
      if (m.gender !== o.gender) fields.push("성별");
      if (m.birth_date !== o.birth_date) fields.push("생년월일");
      if (m.phone !== digits(o.phone ?? "")) fields.push("연락처");
      const minor = isMinor(m.birth_date);
      if (
        minor &&
        (m.guardian_name.trim() !== (o.guardian_name ?? "") ||
          m.guardian_phone !== digits(o.guardian_phone ?? ""))
      ) {
        fields.push("보호자 정보");
      }
      if (fields.length) lines.push(`${label}(${name}): ${fields.join("·")} 변경`);
    });
    return lines;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (savingRef.current || !team || !session) return;
    setError(null);
    setErrorMember(null);
    setSaved(null);
    if (!validate()) return;

    const changes = summarizeChanges(team);
    if (changes.length === 0) {
      fail("변경된 내용이 없습니다.");
      return;
    }
    if (
      !window.confirm(
        `다음 내용으로 저장할까요?\n\n${changes.map((l) => `· ${l}`).join("\n")}`
      )
    ) {
      return;
    }

    const prevRep = repOf(team);
    // 대표자는 첫 칸 고정 — 대표자 entry 는 그대로 두고 그 칸의 사람 정보만 바뀐다
    const nextRep = members[0];

    savingRef.current = true;
    setSaving(true);
    try {
      const { status, data } = await callApi("/api/public/team-edit/team", {
        method: "PUT",
        token: session.token,
        body: JSON.stringify({
          team_name: teamName.trim(),
          ...(affiliation.trim() ? { affiliation: affiliation.trim() } : {}),
          rep_entry_id: nextRep.entry_id,
          members: members.map((m) => ({
            entry_id: m.entry_id,
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
          ...(hasMinor ? { guardian_consent: true } : {}),
        }),
      });
      if (status === 401) return expire();
      if (status < 200 || status >= 300) {
        const idx =
          typeof data.member_index === "number" &&
          data.member_index >= 0 &&
          data.member_index < TEAM_SIZE
            ? data.member_index
            : null;
        fail(
          errText(
            data,
            status === 403
              ? "접수가 마감되어 팀 정보를 수정할 수 없습니다."
              : status === 409
                ? "다른 곳에서 먼저 변경되었습니다. 새로고침 후 다시 시도해주세요."
                : "저장에 실패했습니다."
          ),
          idx
        );
        return;
      }

      const notes: string[] = [];
      if (prevRep && digits(prevRep.phone ?? "") !== nextRep.phone) {
        notes.push(
          "대표자 연락처가 변경되었습니다. 다음 인증부터는 새 연락처로 인증해주세요."
        );
      }
      applyTeam(data as unknown as TeamData);
      setDone({ changes, notes });
    } catch {
      fail("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  // 완료 화면이 뜨면 그 카드로 스크롤 — 페이지 맨 위로 가면 모바일에선 주황 히어로만 보인다
  useEffect(() => {
    if (!done) return;
    // 긴 폼 → 짧은 완료 화면으로 높이가 급변하므로 smooth 대신 즉시 이동 (헤더 높이만큼 여백)
    const el = document.getElementById("aloha-edit-done");
    if (el) {
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - 96,
        behavior: "instant",
      });
    }
  }, [done]);

  function logout() {
    setDone(null);
    saveSession(null);
    setSession(null);
    setTeam(null);
    setSaved(null);
    setCode("");
    setNotice(null);
    setStep("phone");
  }

  /* ── 렌더 ─────────────────────────────────────────────────────────────── */

  if (step === "restoring") return <Skeleton />;

  if (step === "phone" || step === "code") {
    return (
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <h2 className="text-xl font-bold text-black">대표자 인증</h2>
          <p className="mt-1.5 text-sm text-black/60">
            접수 때 입력한 대표자 연락처로 인증합니다.
          </p>
        </div>

        {notice && (
          <div
            role="alert"
            className="rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900"
          >
            {notice}
          </div>
        )}

        <div className="space-y-2">
          <Field label="대표자 휴대폰 번호" required>
            <div className="flex gap-2">
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="010-1234-5678"
                value={formatPhoneLive(phone)}
                disabled={step === "code"}
                onChange={(e) => setPhone(digits(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void sendCode();
                  }
                }}
                className={`${inputCls} disabled:bg-gray-50 disabled:text-black/60`}
              />
              <button
                type="button"
                onClick={() => void sendCode()}
                disabled={authBusy || cooldown > 0}
                className="shrink-0 rounded-full bg-black px-4 text-sm font-bold text-white transition hover:bg-black/85 disabled:opacity-40"
              >
                {cooldown > 0
                  ? `재발송 ${cooldown}초`
                  : step === "code"
                    ? "재발송"
                    : authBusy
                      ? "발송 중..."
                      : "인증번호 받기"}
              </button>
            </div>
          </Field>
          {step === "code" && (
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
                setAuthError(null);
              }}
              className="text-xs font-medium text-black/55 underline underline-offset-2"
            >
              번호 다시 입력
            </button>
          )}
        </div>

        {step === "code" && (
          <form onSubmit={verifyCode} noValidate className="space-y-3">
            <Field label="인증번호 6자리" required>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                value={code}
                autoFocus
                onChange={(e) =>
                  setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
                }
                className={`${inputCls} tracking-[0.3em] tabular-nums`}
              />
            </Field>
            <p className="text-xs text-black/55">
              문자로 받은 인증번호를 5분 안에 입력해주세요.
            </p>
            <button
              type="submit"
              disabled={authBusy || code.length !== 6}
              className={`${btnPrimary} w-full`}
            >
              {authBusy ? "확인 중..." : "확인"}
            </button>
          </form>
        )}

        {authError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-800"
          >
            {authError}
          </div>
        )}

        <p className="text-xs leading-relaxed text-black/55">
          아직 신청하지 않았다면{" "}
          <Link href="/apply/aloha-team" className={linkCls}>
            참가 신청
          </Link>
          부터 해주세요.
        </p>
      </div>
    );
  }

  // step === "team"
  if (teamLoading && !team) return <Skeleton />;

  if (!team) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center space-y-4">
        <p className="text-sm text-red-800">
          {teamError ?? "팀 정보를 불러오지 못했습니다."}
        </p>
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => session && void loadTeam(session)}
            className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700"
          >
            다시 시도
          </button>
          <button
            type="button"
            onClick={logout}
            className={btnSecondarySm}
          >
            처음으로
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div id="aloha-edit-done" className="mx-auto max-w-xl scroll-mt-24 space-y-6">
        <div className="rounded-2xl border-2 border-black bg-[#FFF4E8] p-6 text-center sm:p-8">
          <div
            aria-hidden="true"
            className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#EC6C01] text-2xl font-black text-black"
          >
            ✓
          </div>
          <h2 className="mt-4 text-2xl font-bold text-black">
            팀 정보 수정이 완료되었습니다
          </h2>
          <p className="mt-2 text-sm text-black/65">
            {team.competition_name || ALOHA_TEAM.title} · {team.team_name}
          </p>
        </div>

        <div role="status" className="rounded-2xl border border-black/15 bg-white p-5">
          <p className="mb-2 text-sm font-bold text-black">변경된 내용</p>
          <ul className="space-y-1 text-sm text-black/80">
            {done.changes.map((c) => (
              <li key={c}>· {c}</li>
            ))}
          </ul>
          {done.notes.map((n) => (
            <p
              key={n}
              className="mt-3 rounded-lg bg-[#FFF4E8] p-3 text-sm font-medium text-black"
            >
              {n}
            </p>
          ))}
        </div>

        <div className="rounded-2xl border border-black/15 bg-white p-5">
          <p className="mb-3 text-sm font-bold text-black">현재 팀 명단</p>
          <dl className="space-y-2 text-sm">
            {orderedMembers(team).map((m, i) => (
              <ReceiptRow
                key={m.entry_id}
                label={i === 0 ? "대표자" : memberLabel(i)}
                value={`${m.name} (${m.gender === "M" ? "남" : "여"}) · ${formatPhoneLive(
                  digits(m.phone ?? "")
                )}`}
              />
            ))}
          </dl>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              setDone(null);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`${btnPrimary} w-full sm:flex-1`}
          >
            다시 수정하기
          </button>
          <Link
            href="/apply/aloha-team"
            className="inline-flex w-full items-center justify-center rounded-full border-2 border-black bg-white px-5 py-3 text-sm font-bold text-black sm:flex-1"
          >
            대회 안내로
          </Link>
        </div>
        <p className="text-center text-xs text-black/55">
          팀 정보는 {ALOHA_EDIT_DEADLINE_LABEL}까지 다시 수정할 수 있습니다.
        </p>
      </div>
    );
  }

  const rep = repOf(team);
  const header = (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-black bg-[#FFF4E8] p-5 sm:p-6">
        <p className="text-xs font-semibold text-black/55">
          {team.competition_name || ALOHA_TEAM.title}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-bold text-black">{team.team_name}</h2>
          {team.paid ? (
            <span className="inline-flex items-center rounded-full bg-black px-2.5 py-0.5 text-xs font-bold text-white">
              입금 완료
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border-2 border-black bg-[#EC6C01] px-2.5 py-0.5 text-xs font-bold text-black">
              입금 대기
            </span>
          )}
        </div>
        {team.affiliation && (
          <p className="mt-1 text-sm text-black/60">{team.affiliation}</p>
        )}
        <p className="mt-3 text-sm text-black/70">
          팀 정보는 {ALOHA_EDIT_DEADLINE_LABEL}까지 수정할 수 있습니다.
        </p>
      </div>

      {!team.paid && (
        <div className="rounded-2xl border-2 border-[#EC6C01] bg-white p-4 sm:p-5">
          <p className="mb-3 text-sm font-semibold text-black">
            참가비 입금이 아직 확인되지 않았습니다. 입금자명은{" "}
            <strong>대표자 이름</strong>으로 해주세요.
          </p>
          <DepositBox repName={rep?.name ?? ""} amount={ALOHA_TEAM.feeAmount} />
        </div>
      )}

      {saved && (
        <div
          role="status"
          className="rounded-xl border-2 border-black bg-white p-4 text-sm text-black"
        >
          <p className="flex items-center gap-2 font-bold">
            <span aria-hidden="true" className="size-2.5 rounded-full bg-[#EC6C01]" />
            저장되었습니다
          </p>
          {saved.map((n) => (
            <p key={n} className="mt-1 text-black/80">
              {n}
            </p>
          ))}
        </div>
      )}
    </div>
  );

  if (!team.editable) {
    return (
      <div className="space-y-6">
        {header}
        <div className="rounded-xl border border-black/15 bg-gray-50 p-4 text-sm font-medium text-black">
          접수가 마감되어 팀 정보를 수정할 수 없습니다.
        </div>
        <Section title="팀원 정보">
          <div className="space-y-3">
            {orderedMembers(team).map((m, i) => (
              <div
                key={m.entry_id}
                className={`rounded-2xl bg-white p-4 sm:p-5 ${
                  i === 0 ? "border-2 border-black" : "border border-gray-200"
                }`}
              >
                <div className="mb-3">
                  {i === 0 ? (
                    <h3 className="inline-flex items-center rounded-full bg-black px-3.5 py-1 text-sm font-bold text-white">
                      대표자
                    </h3>
                  ) : (
                    <h3 className="text-base font-bold text-black">
                      {memberLabel(i)}
                    </h3>
                  )}
                </div>
                <dl className="space-y-2 text-sm">
                  <ReceiptRow label="성명" value={m.name} />
                  <ReceiptRow
                    label="성별"
                    value={m.gender === "M" ? "남" : "여"}
                  />
                  <ReceiptRow label="생년월일" value={m.birth_date} />
                  <ReceiptRow
                    label="연락처"
                    value={formatPhoneLive(digits(m.phone ?? ""))}
                  />
                  {m.guardian_name && (
                    <ReceiptRow
                      label="보호자"
                      value={`${m.guardian_name} · ${formatPhoneLive(
                        digits(m.guardian_phone ?? "")
                      )}`}
                    />
                  )}
                </dl>
              </div>
            ))}
          </div>
        </Section>
        <FooterLinks onLogout={logout} />
      </div>
    );
  }

  return (
    <div className="space-y-9">
      {header}
      <form onSubmit={handleSave} noValidate className="space-y-9">
        <Section title="팀 정보">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="팀명" required>
              <input
                type="text"
                value={teamName}
                maxLength={30}
                onChange={(e) => {
                  setTeamName(e.target.value.slice(0, 30));
                  setSaved(null);
                }}
                className={inputCls}
              />
            </Field>
            <Field label="소속">
              <input
                type="text"
                value={affiliation}
                maxLength={40}
                onChange={(e) => {
                  setAffiliation(e.target.value.slice(0, 40));
                  setSaved(null);
                }}
                placeholder="동호회·서핑샵 등 (선택)"
                className={inputCls}
              />
            </Field>
          </div>
        </Section>

        <Section title="팀원 정보">
          <GenderBar male={maleCount} female={femaleCount} />
          <Hint>
            선수를 교체하려면 해당 칸의 정보를 새 선수로 바꿔 입력하세요.
            대표자는 <strong className="text-black">첫 번째 칸</strong>이며,
            접수·확정 문자와 인증은 대표자 연락처로 갑니다.
          </Hint>

          <div className="space-y-4">
            {members.map((m, i) => (
              <MemberCard
                key={m.entry_id}
                index={i}
                member={m}
                highlighted={errorMember === i}
                cardRef={(el) => {
                  memberRefs.current[i] = el;
                }}
                onChange={(key, value) => updateMember(i, key, value)}
              />
            ))}
          </div>
        </Section>

        {hasMinor && (
          <Section title="보호자 동의" required>
            <ConsentRow
              checked={guardianConsent}
              onChange={setGuardianConsent}
              label="미성년 팀원의 보호자가 대회 참가 및 변경 사항에 동의했습니다. (필수)"
            />
          </Section>
        )}

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
              남 2명 · 여 2명이 되어야 저장할 수 있습니다. (현재 남 {maleCount}{" "}
              · 여 {femaleCount})
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={() => {
                applyTeam(team);
                setSaved(null);
              }}
              disabled={saving}
              className={btnSecondary}
            >
              되돌리기
            </button>
            <button
              type="submit"
              disabled={saving || !genderOk}
              className={btnPrimary}
            >
              {saving ? "저장 중..." : "변경 내용 저장"}
            </button>
          </div>
        </div>
      </form>
      <FooterLinks onLogout={logout} />
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
      ))}
    </div>
  );
}

function FooterLinks({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-black/10 pt-5 text-sm">
      <Link
        href="/apply/aloha-team"
        className="font-medium text-black/60 hover:text-black"
      >
        ← 대회 안내
      </Link>
      <button
        type="button"
        onClick={onLogout}
        className="font-medium text-black/60 underline underline-offset-2 hover:text-black"
      >
        인증 종료
      </button>
    </div>
  );
}
