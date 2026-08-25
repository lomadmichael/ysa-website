'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import {
  submitFestivalProgram,
  type FestProgFormState,
} from '@/app/apply/festival-program/actions';
import {
  EVENT,
  GENDERS,
  INQUIRY_TEL,
  PROGRAMS,
  onsiteSeats,
  programLabel,
  programSchedule,
} from '@/lib/festprog-config';
import type { FestprogAvailability, ProgramAvailability } from '@/lib/festprog-db';
import type { ProgramKey } from '@/lib/festprog-validate';

/**
 * 해변 바레 / 해변 하이록스 온라인 사전신청 폼.
 *
 * 신청 1건 = 참가자 1명 = 프로그램 1종목.
 * 정원이 차면 폼을 막지 않고 "대기 등록"으로 문구만 바꾼다 —
 * 취소가 나면 대기 순번대로 자동 확정되기 때문이다.
 */

const INITIAL: FestProgFormState = { status: 'idle' };

const inputCls =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-[15px] text-navy focus:outline-none focus:ring-2 focus:ring-ocean/40 focus:border-ocean';

/** 프로그램별 잔여 좌석 (음수 방지) */
function remainingOf(a: ProgramAvailability): number {
  return Math.max(0, a.capacity - a.confirmed);
}

export default function FestivalProgramForm({
  availability,
}: {
  availability: FestprogAvailability;
}) {
  const [state, action, pending] = useActionState(submitFestivalProgram, INITIAL);
  const [program, setProgram] = useState<ProgramKey | ''>('');

  // ── 접수 완료 화면 ─────────────────────────────────────────────────────────
  if (state.status === 'success' && state.result) {
    const r = state.result;
    const confirmed = r.status === 'confirmed';
    return (
      <div className="rounded-2xl border border-foam bg-white p-7 text-center shadow-sm md:p-9">
        <span
          className={`inline-flex h-14 w-14 items-center justify-center rounded-full text-2xl ${
            confirmed ? 'bg-ocean/10' : 'bg-sunset/10'
          }`}
          aria-hidden="true"
        >
          {confirmed ? '✅' : '⏳'}
        </span>
        <h2 className="mt-4 text-xl font-bold text-navy">
          {confirmed ? '참가가 확정되었습니다' : '대기자로 등록되었습니다'}
        </h2>
        <p className="mt-3 text-[15px] font-semibold text-navy">
          {programLabel(r.program)} · {r.name}님
        </p>
        <p className="mt-1 text-sm text-navy/60">{programSchedule(r.program)}</p>

        <p className="mt-5 text-sm leading-relaxed text-navy/70">
          {confirmed ? (
            <>
              접수 확인 문자를 보내드렸습니다.
              <br />
              당일 시작 15분 전까지 죽도해변 프로그램 부스로 와 주세요.
            </>
          ) : (
            <>
              현재 정원이 모두 찼습니다.
              {typeof r.wait_ahead === 'number' && (
                <>
                  {' '}
                  대기 순번은 <strong className="text-navy">{r.wait_ahead + 1}번</strong>입니다.
                </>
              )}
              <br />
              취소가 발생하면 순서대로 자동 확정되며, 확정 시 문자로 안내드립니다.
            </>
          )}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/apply/festival-program/my"
            className="rounded-lg bg-ocean px-5 py-2.5 text-sm font-bold text-white transition hover:bg-ocean/90"
          >
            신청 조회 · 취소
          </Link>
          <Link
            href="/festival"
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-gray-50"
          >
            페스티벌 안내로
          </Link>
        </div>
        <p className="mt-5 text-xs text-navy/50">문의 {INQUIRY_TEL}</p>
      </div>
    );
  }

  // ── 접수 폼 ────────────────────────────────────────────────────────────────
  const closed = !availability.open;
  const selected = program ? availability[program] : null;
  const willWaitlist = selected != null && remainingOf(selected) === 0;

  return (
    <form action={action} className="space-y-7">
      {closed && (
        <div className="rounded-xl border border-sunset/30 bg-sunset/5 p-5">
          <p className="text-[15px] font-bold text-navy">지금은 온라인 사전신청 기간이 아닙니다</p>
          <p className="mt-2 text-sm leading-relaxed text-navy/70">
            온라인 사전신청은 8월 26일(수) 오전 10시에 오픈합니다. 온라인 신청 기간이 끝난 뒤
            잔여 자리는 {EVENT.dateLabel} 현장에서 선착순으로 접수합니다 — 프로그램 시작 30분
            전부터 죽도해변 프로그램 부스에서 신청해 주세요.
          </p>
          <p className="mt-2 text-sm text-navy/60">문의 {INQUIRY_TEL}</p>
        </div>
      )}

      {/* ── 1) 프로그램 선택 ─────────────────────────────────────────────── */}
      <fieldset disabled={closed} className="disabled:opacity-50">
        <legend className="mb-1 text-sm font-bold text-navy">
          참여할 프로그램 <span className="text-sunset">*</span>
        </legend>
        <p className="mb-3 text-xs text-navy/50">
          한 분당 한 종목만 신청할 수 있습니다. 두 프로그램은 시간이 이어져 있어 중복 참여가
          어렵습니다.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {PROGRAMS.map((p) => {
            const a = availability[p.key];
            const remaining = remainingOf(a);
            const full = remaining === 0;
            const active = program === p.key;
            return (
              <label
                key={p.key}
                className={`relative cursor-pointer rounded-2xl border p-5 transition ${
                  active
                    ? 'border-ocean bg-ocean/5 ring-2 ring-ocean/20'
                    : 'border-foam bg-white hover:border-ocean/40'
                }`}
              >
                <input
                  type="radio"
                  name="program"
                  value={p.key}
                  required
                  checked={active}
                  onChange={() => setProgram(p.key)}
                  className="sr-only"
                />
                <span className="flex items-start justify-between gap-3">
                  <span className="text-2xl" aria-hidden="true">
                    {p.emoji}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      full ? 'bg-sunset/10 text-sunset' : 'bg-ocean/10 text-ocean'
                    }`}
                  >
                    {full ? `대기 접수 (대기 ${a.waitlist}명)` : `잔여 ${remaining}자리`}
                  </span>
                </span>
                <span className="mt-3 block text-[15px] font-bold text-navy">{p.label}</span>
                <span className="mt-0.5 block text-sm text-ocean">
                  {EVENT.dateLabel} {p.time}
                </span>
                <span className="mt-1.5 block text-sm leading-relaxed text-navy/55">
                  {p.desc}
                </span>
                <span className="mt-3 block border-t border-foam pt-3 text-xs leading-relaxed text-navy/50">
                  정원 {p.totalSeats}명 = 온라인 {p.onlineSeats}명 + 현장 {onsiteSeats(p.key)}
                  명(당일 선착순)
                </span>
              </label>
            );
          })}
        </div>

        {willWaitlist && (
          <p className="mt-3 rounded-lg bg-sunset/5 px-4 py-3 text-sm leading-relaxed text-navy/70">
            <strong className="text-navy">{programLabel(program)}</strong>는 온라인 정원이 모두
            찼습니다. 지금 신청하시면 <strong className="text-navy">대기자</strong>로 등록되며,
            취소가 발생하면 접수 순서대로 자동 확정됩니다.
          </p>
        )}
      </fieldset>

      {/* ── 2) 신청자 정보 ───────────────────────────────────────────────── */}
      <fieldset disabled={closed} className="space-y-4 disabled:opacity-50">
        <legend className="mb-1 text-sm font-bold text-navy">신청자 정보</legend>

        <div>
          <label htmlFor="fp-name" className="mb-1.5 block text-sm font-medium text-navy">
            성명 <span className="text-sunset">*</span>
          </label>
          <input
            id="fp-name"
            type="text"
            name="name"
            required
            maxLength={40}
            autoComplete="name"
            placeholder="홍길동"
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="fp-phone" className="mb-1.5 block text-sm font-medium text-navy">
            휴대폰 번호 <span className="text-sunset">*</span>
          </label>
          <input
            id="fp-phone"
            type="tel"
            name="phone"
            required
            inputMode="tel"
            autoComplete="tel"
            placeholder="010-1234-5678"
            className={inputCls}
          />
          <p className="mt-1.5 text-xs text-navy/50">
            접수 확인·대기 확정 문자를 받고, 신청 조회·취소에도 사용됩니다.
          </p>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-navy">
            성별 <span className="text-sunset">*</span>
          </span>
          <div className="flex gap-2">
            {GENDERS.map((g) => (
              <label
                key={g.key}
                className="flex-1 cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-navy transition has-[:checked]:border-ocean has-[:checked]:bg-ocean/5 has-[:checked]:text-ocean"
              >
                <input type="radio" name="gender" value={g.key} required className="sr-only" />
                {g.label}
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      {/* ── 3) 동의 ──────────────────────────────────────────────────────── */}
      <fieldset disabled={closed} className="disabled:opacity-50">
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-foam bg-white p-4">
          <input
            type="checkbox"
            name="consent_privacy"
            required
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-ocean)]"
          />
          <span className="text-sm leading-relaxed text-navy/75">
            <strong className="font-semibold text-navy">
              개인정보 수집·이용에 동의합니다. <span className="text-sunset">(필수)</span>
            </strong>
            <br />
            수집 항목: 성명 · 휴대폰 번호 · 성별 / 목적: 프로그램 운영 및 안내 문자 발송 /
            보유 기간: 행사 종료 후 3개월 이내 파기. 현장에서 촬영된 사진·영상은 협회 홍보 자료로
            활용될 수 있습니다.
          </span>
        </label>
      </fieldset>

      {state.status === 'error' && state.message && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800"
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || closed}
        className="w-full rounded-xl bg-ocean px-6 py-4 text-[15px] font-bold text-white transition hover:bg-ocean/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {closed
          ? '온라인 사전신청 마감'
          : pending
            ? '접수 중…'
            : willWaitlist
              ? '대기자로 신청하기'
              : '신청하기'}
      </button>

      <p className="text-center text-xs leading-relaxed text-navy/50">
        참가비 {EVENT.fee} · 신청 후{' '}
        <Link
          href="/apply/festival-program/my"
          className="font-semibold text-navy underline underline-offset-2"
        >
          신청 조회
        </Link>
        에서 본인 확인 후 취소할 수 있습니다. · 문의 {INQUIRY_TEL}
      </p>
    </form>
  );
}
