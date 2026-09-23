"use client";

/**
 * 알로하 팀 챌린지 — 접수폼(AlohaTeamEntryForm)과 팀 정보 수정(AlohaTeamEditForm)이
 * 함께 쓰는 팀원 카드·입력 헬퍼·레이아웃 조각.
 */

import BirthDatePicker from "./BirthDatePicker";
import CopyButton from "./CopyButton";
import { ALOHA_MAX_BIRTH_DATE, ALOHA_MINOR_AFTER, ALOHA_TEAM } from "./aloha-team";

export interface Member {
  name: string;
  gender: "" | "M" | "F";
  birth_date: string;
  /** 숫자만 저장 — 화면에는 하이픈을 붙여 보여준다 */
  phone: string;
  guardian_name: string;
  guardian_phone: string;
}

export const emptyMember = (): Member => ({
  name: "",
  gender: "",
  birth_date: "",
  phone: "",
  guardian_name: "",
  guardian_phone: "",
});

export const digits = (v: string) => v.replace(/[^0-9]/g, "").slice(0, 11);

/** 입력 중에도 하이픈을 붙여 보여준다 (010-1234-5678) */
export function formatPhoneLive(d: string): string {
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length === 10)
    return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

export const isValidMobile = (d: string) => /^01[016789][0-9]{7,8}$/.test(d);
export const isMinor = (birth: string) => !!birth && birth > ALOHA_MINOR_AFTER;
export const birthTooYoung = (birth: string) =>
  !!birth && birth > ALOHA_MAX_BIRTH_DATE;

export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

/** 카드·검증 메시지 라벨 — 첫 칸은 항상 대표자, 나머지는 팀원 1~3 */
export const memberLabel = (index: number) =>
  index === 0 ? "대표자" : `팀원 ${index}`;

/* ── 포스터 팔레트 ─────────────────────────────────────────────────────────
 * 대회 포스터(대회포스터.jpg) 배경에서 샘플링한 주황 #EC6C01 + 검정 + 흰색,
 * 섹션 배경용 따뜻한 오프화이트 #FFF4E8.
 * 주황 위 작은 흰 글씨는 대비가 약해(≈3:1) 쓰지 않는다 — 주황 위 글씨는 검정.
 * Tailwind 가 스캔할 수 있도록 클래스 문자열은 리터럴로 둔다.
 */
export const btnPrimary =
  "inline-flex items-center justify-center rounded-full bg-black px-8 py-3.5 text-base font-bold text-white transition hover:bg-black/85 disabled:opacity-40";
export const btnSecondary =
  "inline-flex items-center justify-center rounded-full border-2 border-black bg-white px-6 py-3 text-base font-bold text-black transition hover:bg-[#FFF4E8] disabled:opacity-40";
export const btnPrimarySm =
  "inline-flex items-center justify-center rounded-full bg-black px-6 py-2.5 text-sm font-bold text-white transition hover:bg-black/85 disabled:opacity-40";
export const btnSecondarySm =
  "inline-flex items-center justify-center rounded-full border-2 border-black bg-white px-5 py-2 text-sm font-bold text-black transition hover:bg-[#FFF4E8] disabled:opacity-40";
export const linkCls =
  "font-semibold text-black underline decoration-[#EC6C01] decoration-2 underline-offset-[3px] hover:decoration-black";

/* ── 하위 컴포넌트 ─────────────────────────────────────────────────────────── */

// 16px(text-base) — iOS Safari 는 16px 미만 입력칸 포커스 시 화면을 확대한다
export const inputCls =
  "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#EC6C01]/50 focus:border-black";
export function MemberCard({
  index,
  member: m,
  highlighted,
  cardRef,
  onChange,
}: {
  /** 0 = 대표자 (고정), 1~3 = 팀원 */
  index: number;
  member: Member;
  highlighted: boolean;
  cardRef: (el: HTMLDivElement | null) => void;
  onChange: <K extends keyof Member>(key: K, value: Member[K]) => void;
}) {
  const isRep = index === 0;
  const tooYoung = birthTooYoung(m.birth_date);
  const minor = isMinor(m.birth_date);
  const phoneBad = m.phone.length >= 10 && !isValidMobile(m.phone);

  return (
    <div
      ref={cardRef}
      className={`scroll-mt-20 rounded-2xl border bg-white p-4 sm:p-5 transition ${
        highlighted
          ? "border-red-400 ring-2 ring-red-200"
          : isRep
            ? "border-2 border-black"
            : "border-gray-200"
      }`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
        {isRep ? (
          <h3 className="inline-flex items-center rounded-full bg-black px-3.5 py-1 text-sm font-bold text-white">
            대표자
          </h3>
        ) : (
          <h3 className="text-base font-bold text-black">
            {memberLabel(index)}
          </h3>
        )}
        {isRep && (
          <span className="text-xs font-medium text-black/60">
            접수·확정 문자 수신 · 입금자명 기준
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="성명" required>
          <input
            type="text"
            value={m.name}
            maxLength={20}
            autoComplete="off"
            onChange={(e) => onChange("name", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="성별" required>
          <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-gray-300">
            {(["M", "F"] as const).map((g) => {
              const on = m.gender === g;
              return (
                <button
                  key={g}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange("gender", g)}
                  className={`py-2.5 text-base font-semibold transition ${
                    on
                      ? "bg-black text-white"
                      : "bg-white text-black/55 hover:bg-[#FFF4E8]"
                  } ${g === "F" ? "border-l border-gray-300" : ""}`}
                >
                  {g === "M" ? "남" : "여"}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="생년월일" required>
          {/* 공용 BirthDatePicker 는 text-sm 이라 iOS 확대를 막기 위해 16px 로 덮어쓴다 */}
          <div className="[&_select]:h-11 [&_select]:text-base">
            <BirthDatePicker
              value={m.birth_date}
              onChange={(v) => onChange("birth_date", v)}
            />
          </div>
          {tooYoung && (
            <p className="mt-1 text-xs font-medium text-red-600">
              생년월일을 다시 확인해주세요.
            </p>
          )}
          {minor && !tooYoung && (
            <p className="mt-1 text-xs text-navy/50">
              미성년 팀원 — 아래 보호자 정보를 입력해주세요.
            </p>
          )}
        </Field>
        <Field label="연락처" required>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="off"
            placeholder="010-1234-5678"
            value={formatPhoneLive(m.phone)}
            onChange={(e) => onChange("phone", digits(e.target.value))}
            className={inputCls}
          />
          {phoneBad && (
            <p className="mt-1 text-xs font-medium text-red-600">
              휴대폰 번호 형식을 확인해주세요.
            </p>
          )}
        </Field>
      </div>

      {minor && (
        <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl bg-[#FFF4E8] p-4 md:grid-cols-2">
          <Field label="보호자 성명" required>
            <input
              type="text"
              value={m.guardian_name}
              maxLength={20}
              autoComplete="off"
              onChange={(e) => onChange("guardian_name", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="보호자 연락처" required>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="off"
              placeholder="010-1234-5678"
              value={formatPhoneLive(m.guardian_phone)}
              onChange={(e) =>
                onChange("guardian_phone", digits(e.target.value))
              }
              className={inputCls}
            />
          </Field>
        </div>
      )}
    </div>
  );
}

export function GenderCount({ label, count }: { label: string; count: number }) {
  const cls =
    count === 2
      ? "bg-black text-white"
      : count > 2
        ? "bg-red-600 text-white"
        : "bg-white text-black ring-1 ring-inset ring-black/25";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 tabular-nums ${cls}`}
    >
      {label} {count}/2
    </span>
  );
}

/** 팀원 정보 상단 고정 바 — 남 x/2 · 여 y/2 */
export function GenderBar({ male, female }: { male: number; female: number }) {
  const ok = male === 2 && female === 2;
  return (
    <div className="sticky top-[76px] z-10 -mx-1 flex flex-wrap items-center justify-between gap-2 rounded-full border-2 border-black bg-white/95 py-1.5 pl-2 pr-4 backdrop-blur">
      <span className="flex items-center gap-1.5 text-sm font-bold">
        <GenderCount label="남" count={male} />
        <GenderCount label="여" count={female} />
      </span>
      <span
        className={`flex items-center gap-1.5 text-xs font-semibold ${ok ? "text-black" : "text-black/55"}`}
      >
        {ok && (
          <span aria-hidden="true" className="size-2 rounded-full bg-[#EC6C01]" />
        )}
        {ok ? "혼성 구성 완료" : "남 2명 · 여 2명으로 구성해주세요"}
      </span>
    </div>
  );
}

/** 포스터 톤 안내 한 줄 (주황 왼쪽 선 + 오프화이트) */
export function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-r-lg border-l-4 border-[#EC6C01] bg-[#FFF4E8] px-3.5 py-2.5 text-sm leading-relaxed text-black/80">
      {children}
    </p>
  );
}

export function DepositBox({ repName, amount }: { repName: string; amount: number }) {
  const { bank } = ALOHA_TEAM;
  return (
    <dl className="space-y-3 rounded-xl border border-black/10 bg-[#FFF4E8] p-4 text-sm">
      <ReceiptRow label="참가비" value={<strong>{won(amount)}</strong>} />
      <ReceiptRow label="은행" value={bank.name} />
      <div className="flex items-center justify-between gap-4">
        <dt className="shrink-0 text-navy/50">계좌번호</dt>
        <dd className="flex items-center gap-2 font-medium text-navy">
          <span className="tabular-nums">{bank.account}</span>
          <CopyButton value={bank.account} />
        </dd>
      </div>
      <ReceiptRow label="예금주" value={bank.holder} />
      <ReceiptRow
        label="입금자명"
        value={
          repName ? (
            <>
              <strong>{repName}</strong> (대표자 이름)
            </>
          ) : (
            "대표자 이름"
          )
        }
      />
    </dl>
  );
}

export function Section({
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
      <h2 className="flex items-center gap-2 text-lg font-bold text-black">
        <span aria-hidden="true" className="h-5 w-1.5 rounded-full bg-[#EC6C01]" />
        {title}
        {required && <span className="text-red-500 text-sm">*</span>}
      </h2>
      {children}
    </section>
  );
}

export function Field({
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
      <span className="block text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </div>
  );
}

export function ReceiptRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-navy/50">{label}</dt>
      <dd className="text-right font-medium text-navy">{value}</dd>
    </div>
  );
}

export function ConsentRow({
  checked,
  onChange,
  label,
  detail,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  detail?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border-2 transition ${
        checked ? "border-black bg-[#FFF4E8]" : "border-black/15 bg-white"
      }`}
    >
      <label className="flex cursor-pointer items-start gap-3 p-3.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-black"
        />
        <span className="text-sm font-semibold leading-snug text-black">
          {label}
        </span>
      </label>
      {detail && (
        <details className="border-t border-black/10 px-3.5 py-2.5 text-xs text-gray-700">
          <summary className="cursor-pointer select-none font-medium text-black/60">
            자세히 보기
          </summary>
          <div className="pt-2 leading-relaxed">{detail}</div>
        </details>
      )}
    </div>
  );
}

/** 히어로 「참가 신청하기」 — JS 가 있으면 부드럽게, 없으면 앵커로 이동 */
export function ScrollToFormLink({
  targetId,
  className,
  children,
}: {
  targetId: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={`#${targetId}`}
      className={className}
      onClick={(e) => {
        const el = document.getElementById(targetId);
        if (!el) return;
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", `#${targetId}`);
      }}
    >
      {children}
    </a>
  );
}
