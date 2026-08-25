'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { requestOtp, verifyOtp, type OtpState } from './actions';
import { EVENT, INQUIRY_TEL } from '@/lib/festprog-config';

/**
 * 본인조회 OTP 게이트.
 *
 * 1단계 휴대폰 입력 → 2단계 인증번호 6자리 입력.
 * 재발송 버튼은 서버가 알려준 쿨다운(retryAfter)이 끝날 때까지 비활성이다.
 *
 * ★ 서버는 "해당 번호로 접수된 신청이 있는지"를 알려주지 않는다.
 *   신청이 없는 번호에도 동일한 안내가 나오며, 존재 여부는 인증 후에만 드러난다.
 */

const initialRequest: OtpState = { sent: false };
const initialVerify: OtpState = { sent: true };

const inputCls =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/40 focus:border-ocean';

/** 남은 초 → MM:SS */
function mmss(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function OtpGate() {
  const [reqState, requestAction, requesting] = useActionState(requestOtp, initialRequest);

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-foam bg-white p-6 shadow-sm sm:p-8">
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-ocean)' }}
        >
          Festival 2026
        </p>
        <h2 className="mt-2 text-xl font-bold text-navy">신청 조회 · 취소</h2>
        <p className="mt-2 text-sm leading-relaxed text-navy/60">
          {EVENT.shortName} 신청에 사용하신 휴대폰 번호로 본인 인증 후 신청 내용을 확인하고
          취소할 수 있습니다.
        </p>

        {!reqState.sent ? (
          // ── 1단계: 휴대폰 번호 ─────────────────────────────────────────────
          <form action={requestAction} className="mt-6 space-y-3">
            <label htmlFor="otp-phone" className="block text-sm font-medium text-navy">
              휴대폰 번호
            </label>
            <input
              id="otp-phone"
              type="tel"
              name="phone"
              required
              inputMode="tel"
              autoComplete="tel"
              placeholder="010-1234-5678"
              defaultValue={reqState.phone ?? ''}
              className={inputCls}
            />
            {reqState.message && (
              <p role="alert" className="text-sm text-sunset">
                {reqState.message}
              </p>
            )}
            <button
              type="submit"
              disabled={requesting}
              className="w-full rounded-lg bg-ocean px-5 py-3 text-sm font-bold text-white transition hover:bg-ocean/90 disabled:opacity-50"
            >
              {requesting ? '발송 중…' : '인증번호 받기'}
            </button>
            <p className="text-xs leading-relaxed text-navy/50">
              인증번호는 5분간 유효하며, 접수 시 입력하신 번호로만 발송됩니다.
            </p>
          </form>
        ) : (
          // ── 2단계: 인증번호 ────────────────────────────────────────────────
          <div className="mt-6 space-y-3">
            {/* 재발송하면 입력값과 이전 오류 메시지를 비우고 다시 시작한다 */}
            <VerifyForm
              key={reqState.nonce ?? 0}
              phone={reqState.phone ?? ''}
              notice={reqState.message}
            />

            {/* key 로 remount 시켜 카운트다운을 다시 시작한다 (서버가 응답마다 nonce 를 갱신) */}
            <ResendForm
              key={`resend-${reqState.nonce ?? 0}`}
              phone={reqState.phone ?? ''}
              seconds={reqState.retryAfter ?? 0}
              formAction={requestAction}
              pending={requesting}
            />
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-navy/50">
        아직 신청하지 않으셨나요?{' '}
        <Link
          href="/apply/festival-program"
          className="font-semibold text-navy underline underline-offset-2"
        >
          접수 페이지로
        </Link>
        {' · '}
        문의 {INQUIRY_TEL}
      </p>
    </div>
  );
}

/**
 * 재발송 버튼 + 쿨다운 카운트다운.
 *
 * 남은 초는 서버가 알려준 retryAfter 로 시작해 1초씩 줄인다.
 * 부모가 nonce 를 key 로 넘겨 remount 시키므로 이 컴포넌트 안에서는 초기화를 신경 쓰지 않는다.
 */
function ResendForm({
  phone,
  seconds,
  formAction,
  pending,
}: {
  phone: string;
  seconds: number;
  formAction: (formData: FormData) => void;
  pending: boolean;
}) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    const timer = setInterval(() => setLeft((v) => (v <= 0 ? 0 : v - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <form action={formAction} className="flex items-center justify-between gap-3">
      <input type="hidden" name="phone" value={phone} />
      <p className="text-xs text-navy/50">인증번호가 오지 않았나요?</p>
      <button
        type="submit"
        disabled={pending || left > 0}
        className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-navy transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {left > 0 ? `재발송 ${mmss(left)}` : '인증번호 재발송'}
      </button>
    </form>
  );
}

function VerifyForm({ phone, notice }: { phone: string; notice?: string }) {
  const [state, action, pending] = useActionState(verifyOtp, initialVerify);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="phone" value={phone} />
      <p className="text-sm text-navy/60">
        <span className="font-semibold text-navy">{phone}</span> 로 인증번호를 보냈습니다.
      </p>
      <label htmlFor="otp-code" className="block text-sm font-medium text-navy">
        인증번호 6자리
      </label>
      <input
        id="otp-code"
        type="text"
        name="code"
        required
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="000000"
        className={`${inputCls} text-center text-lg tracking-[0.4em]`}
      />
      {/* 발송 결과 안내(쿨다운 등)는 인증 실패 메시지가 있으면 그쪽을 우선한다. */}
      {state.message ? (
        <p role="alert" className="text-sm text-sunset">
          {state.message}
        </p>
      ) : (
        notice && <p className="text-sm text-navy/60">{notice}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-ocean px-5 py-3 text-sm font-bold text-white transition hover:bg-ocean/90 disabled:opacity-50"
      >
        {pending ? '확인 중…' : '확인'}
      </button>
    </form>
  );
}
