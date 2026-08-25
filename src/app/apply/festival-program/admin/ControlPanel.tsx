'use client';

import { useActionState } from 'react';
import { setCapacityAction, setOpenAction, type AdminActionState } from './actions';
import { PROGRAMS, programLabel } from '@/lib/festprog-config';
import type { FestprogAvailability } from '@/lib/festprog-db';

/**
 * 오픈/마감 토글 + 온라인 정원 조절.
 *
 * ★ 정원을 올리면 대기자가 즉시 승급되고 확정 문자가 나간다(되돌릴 수 없다).
 *   그래서 버튼 문구에 그 사실을 적어 둔다.
 */

const INITIAL: AdminActionState = {};

export default function ControlPanel({
  availability,
}: {
  availability: FestprogAvailability;
}) {
  const [openState, openAction, openPending] = useActionState(setOpenAction, INITIAL);
  const [capState, capAction, capPending] = useActionState(setCapacityAction, INITIAL);
  const open = availability.open;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* ── 오픈 / 마감 ────────────────────────────────────────────────── */}
      <form action={openAction} className="rounded-xl border border-foam bg-white p-5">
        <input type="hidden" name="open" value={open ? 'false' : 'true'} />
        <p className="text-sm font-bold text-navy">온라인 사전신청</p>
        <p className="mt-1.5 flex items-center gap-2 text-sm">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              open ? 'bg-ocean' : 'bg-navy/25'
            }`}
            aria-hidden="true"
          />
          <span className={open ? 'font-bold text-ocean' : 'font-bold text-navy/50'}>
            {open ? '접수중' : '마감'}
          </span>
        </p>
        <p className="mt-2 text-xs leading-relaxed text-navy/50">
          마감해도 이미 접수된 대기자의 자동 확정은 계속 동작합니다.
        </p>
        {openState.error && (
          <p role="alert" className="mt-2 text-xs text-sunset">
            {openState.error}
          </p>
        )}
        <button
          type="submit"
          disabled={openPending}
          className={`mt-4 h-11 w-full rounded-md text-sm font-bold text-white transition disabled:opacity-50 ${
            open ? 'bg-navy hover:bg-navy/90' : 'bg-ocean hover:bg-ocean/90'
          }`}
        >
          {openPending ? '처리 중…' : open ? '접수 마감하기' : '접수 열기'}
        </button>
      </form>

      {/* ── 온라인 정원 ────────────────────────────────────────────────── */}
      <form action={capAction} className="rounded-xl border border-foam bg-white p-5">
        <p className="text-sm font-bold text-navy">온라인 정원</p>
        <p className="mt-1.5 text-xs leading-relaxed text-navy/50">
          현장 접수분을 제외한 온라인 좌석 수입니다. 늘리면 대기자가 순번대로 즉시 확정되고 확정
          문자가 발송됩니다.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {PROGRAMS.map((p) => (
            <label key={p.key} className="block">
              <span className="mb-1 block text-xs font-medium text-navy/60">
                {programLabel(p.key)}
              </span>
              <input
                type="number"
                name={p.key}
                min={0}
                max={1000}
                required
                defaultValue={availability[p.key].capacity}
                className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-navy outline-none focus:border-ocean"
              />
            </label>
          ))}
        </div>
        {capState.error && (
          <p role="alert" className="mt-2 text-xs text-sunset">
            {capState.error}
          </p>
        )}
        <button
          type="submit"
          disabled={capPending}
          className="mt-4 h-11 w-full rounded-md bg-ocean text-sm font-bold text-white transition hover:bg-ocean/90 disabled:opacity-50"
        >
          {capPending ? '변경 중…' : '정원 저장 (대기자 자동 승급)'}
        </button>
      </form>
    </div>
  );
}
