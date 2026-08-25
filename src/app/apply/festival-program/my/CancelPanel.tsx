'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { cancelMyRegistration, type MyFormState } from './actions';
import {
  EVENT,
  INQUIRY_TEL,
  genderLabel,
  programLabel,
  programSchedule,
  statusLabel,
} from '@/lib/festprog-config';
import { formatPhone } from '@/lib/festprog-validate';
import type { FestprogRegistration } from '@/lib/festprog-db';

/**
 * 내 신청 카드 + 취소 폼.
 *
 * ★ 수정 기능은 없다. 종목·이름을 바꾸려면 취소 후 재신청한다.
 *   취소는 되돌릴 수 없으므로 확인 체크박스를 반드시 거치게 한다
 *   (서버 액션도 confirm 값을 다시 검사한다).
 */

const INITIAL: MyFormState = { status: 'idle' };

export default function CancelPanel({
  registration,
}: {
  registration: FestprogRegistration;
}) {
  const [state, action, pending] = useActionState(cancelMyRegistration, INITIAL);
  const confirmed = registration.status === 'confirmed';

  // 취소 완료 후에는 카드를 지우고 결과만 보여준다(페이지가 곧 갱신된다).
  if (state.status === 'success') {
    return (
      <div className="rounded-2xl border border-foam bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-bold text-navy">신청이 취소되었습니다</h2>
        <p className="mt-3 text-sm leading-relaxed text-navy/60">{state.message}</p>
        <Link
          href="/apply/festival-program"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-ocean px-5 py-2.5 text-sm font-bold text-white transition hover:bg-ocean/90"
        >
          다시 신청하기
        </Link>
        <p className="mt-4 text-xs text-navy/50">문의 {INQUIRY_TEL}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── 신청 내역 ─────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-foam bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-foam px-6 py-4">
          <h2 className="text-lg font-bold text-navy">
            {programLabel(registration.program)}
          </h2>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              confirmed ? 'bg-ocean/10 text-ocean' : 'bg-sunset/10 text-sunset'
            }`}
          >
            {statusLabel(registration.status)}
            {!confirmed && typeof registration.wait_ahead === 'number'
              ? ` · ${registration.wait_ahead + 1}번`
              : ''}
          </span>
        </div>

        <dl className="divide-y divide-foam px-6 text-sm">
          <Row label="일시 · 장소" value={programSchedule(registration.program)} />
          <Row label="성명" value={registration.name} />
          <Row label="휴대폰" value={formatPhone(registration.phone)} />
          <Row label="성별" value={genderLabel(registration.gender)} />
          <Row label="참가비" value={EVENT.fee} />
        </dl>

        <div className="border-t border-foam bg-foam/20 px-6 py-4 text-sm leading-relaxed text-navy/65">
          {confirmed ? (
            <>참가가 확정되었습니다. 당일 시작 15분 전까지 죽도해변 해양종합레포츠센터 앞 프로그램 부스로 와 주세요.</>
          ) : (
            <>
              현재 대기 상태입니다. 취소가 발생하면 접수 순서대로 자동 확정되며, 확정되면 문자로
              안내드립니다.
            </>
          )}
        </div>
      </div>

      {/* ── 안내 ──────────────────────────────────────────────────────────── */}
      <p className="rounded-xl border border-foam bg-white px-5 py-4 text-sm leading-relaxed text-navy/65">
        신청 내용 변경은 지원하지 않습니다. 종목이나 정보를 바꾸시려면 아래에서 취소한 뒤 다시
        신청해 주세요. (재신청 시 대기 순번은 새로 부여됩니다)
      </p>

      {/* ── 취소 ──────────────────────────────────────────────────────────── */}
      <form
        action={action}
        className="rounded-2xl border border-red-200 bg-red-50/60 p-5 sm:p-6"
      >
        <input type="hidden" name="registration_id" value={registration.id} />
        <h3 className="text-[15px] font-bold text-navy">신청 취소</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-navy/65">
          취소하면 자리가 즉시 대기자에게 넘어갑니다. 되돌릴 수 없습니다.
        </p>

        <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-navy/80">
          <input
            type="checkbox"
            name="confirm"
            required
            className="mt-0.5 h-4 w-4 shrink-0 accent-red-600"
          />
          위 내용을 확인했으며 신청을 취소합니다.
        </label>

        {state.status === 'error' && state.message && (
          <p role="alert" className="mt-3 text-sm text-red-800">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-4 w-full rounded-lg bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {pending ? '취소 처리 중…' : '신청 취소하기'}
        </button>
      </form>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 py-3">
      <dt className="w-24 shrink-0 font-medium text-navy/50">{label}</dt>
      <dd className="text-navy">{value}</dd>
    </div>
  );
}
