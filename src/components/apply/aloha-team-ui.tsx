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

/* ── 하위 컴포넌트 ─────────────────────────────────────────────────────────── */

// 16px(text-base) — iOS Safari 는 16px 미만 입력칸 포커스 시 화면을 확대한다
export const inputCls =
  "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple";
export function MemberCard({
  index,
  member: m,
  isRep,
  highlighted,
  cardRef,
  onRep,
  onChange,
}: {
  index: number;
  member: Member;
  isRep: boolean;
  highlighted: boolean;
  cardRef: (el: HTMLDivElement | null) => void;
  onRep: () => void;
  onChange: <K extends keyof Member>(key: K, value: Member[K]) => void;
}) {
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
            ? "border-purple/50"
            : "border-gray-200"
      }`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-navy">팀원 {index + 1}</h3>
        <label
          className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
            isRep
              ? "border-purple bg-purple text-white"
              : "border-gray-300 text-navy/60 hover:border-gray-400"
          }`}
        >
          <input
            type="radio"
            name="rep_index"
            checked={isRep}
            onChange={onRep}
            className="size-4 accent-white"
          />
          대표자
        </label>
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
                      ? "bg-purple text-white"
                      : "bg-white text-navy/60 hover:bg-gray-50"
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
              초등학생 이상(2019년 12월 31일 이전 출생)만 참가할 수 있습니다.
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
        <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-4 md:grid-cols-2">
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
    count === 2 ? "text-teal" : count > 2 ? "text-red-600" : "text-navy";
  return (
    <span className={cls}>
      {label} {count}/2
    </span>
  );
}

export function DepositBox({ repName, amount }: { repName: string; amount: number }) {
  const { bank } = ALOHA_TEAM;
  return (
    <dl className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
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
      <h2 className="text-lg font-semibold flex items-center gap-2">
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
      className={`rounded-lg border-2 transition ${
        checked ? "border-purple bg-purple/10" : "border-purple/40 bg-purple/5"
      }`}
    >
      <label className="flex cursor-pointer items-start gap-3 p-3.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-purple"
        />
        <span className="text-sm font-semibold leading-snug text-navy">
          {label}
        </span>
      </label>
      {detail && (
        <details className="border-t border-purple/15 px-3.5 py-2.5 text-xs text-gray-700">
          <summary className="cursor-pointer select-none font-medium text-navy/60">
            자세히 보기
          </summary>
          <div className="pt-2 leading-relaxed">{detail}</div>
        </details>
      )}
    </div>
  );
}
