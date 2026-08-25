'use client';

import { useActionState, useState } from 'react';
import { adminForceCancel, type AdminActionState } from './actions';
import { genderLabel, programLabel, statusLabel } from '@/lib/festprog-config';
import { formatPhone } from '@/lib/festprog-validate';
import type { FestprogAdminRow } from '@/lib/festprog-db';

/**
 * 신청 명단 + 강제취소.
 *
 * ★ 강제취소는 좌석을 반납하므로 대기자 자동 승급 + 승급 문자가 함께 일어난다.
 *   실수로 누르지 못하도록 "취소" 버튼 → 사유 입력 행 펼침 → 실행 2단계로 둔다.
 */

const INITIAL: AdminActionState = {};

const STATUS_CLASS: Record<string, string> = {
  confirmed: 'bg-ocean/10 text-ocean',
  waitlist: 'bg-sunset/10 text-sunset',
  cancelled: 'bg-navy/10 text-navy/50',
};

/** ISO(UTC) → 한국시간 'MM-DD HH:mm' */
function kstShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso ?? '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  const at = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${at('month')}-${at('day')} ${at('hour')}:${at('minute')}`;
}

export default function RosterTable({ rows }: { rows: FestprogAdminRow[] }) {
  const [state, action] = useActionState(adminForceCancel, INITIAL);
  const [openId, setOpenId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-foam bg-white px-5 py-8 text-center text-sm text-navy/50">
        아직 접수된 신청이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {state.error && (
        <p role="alert" className="text-sm text-sunset">
          {state.error}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-foam bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-foam/40 text-left text-xs text-navy/60">
            <tr>
              <th className="px-3 py-2.5 font-semibold">접수</th>
              <th className="px-3 py-2.5 font-semibold">프로그램</th>
              <th className="px-3 py-2.5 font-semibold">상태</th>
              <th className="px-3 py-2.5 font-semibold">성명</th>
              <th className="px-3 py-2.5 font-semibold">성별</th>
              <th className="px-3 py-2.5 font-semibold">연락처</th>
              <th className="px-3 py-2.5 font-semibold">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-foam">
            {rows.map((r) => {
              const cancelled = r.status === 'cancelled';
              return (
                <Row key={r.id} row={r}>
                  <td className="whitespace-nowrap px-3 py-2.5 text-navy/60">
                    {kstShort(r.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-medium text-navy">
                    {programLabel(r.program)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        STATUS_CLASS[r.status] ?? ''
                      }`}
                    >
                      {statusLabel(r.status)}
                      {r.status === 'waitlist' && typeof r.wait_ahead === 'number'
                        ? ` ${r.wait_ahead + 1}번`
                        : ''}
                    </span>
                    {cancelled && r.cancelled_by && (
                      <span className="ml-1.5 text-xs text-navy/40">
                        ({r.cancelled_by === 'admin' ? '관리자' : '본인'})
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-navy">{r.name}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-navy/70">
                    {genderLabel(r.gender)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-navy/70">
                    {formatPhone(r.phone)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {cancelled ? (
                      <span className="text-xs text-navy/35">-</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setOpenId(openId === r.id ? null : r.id)}
                        className="rounded border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-50"
                      >
                        {openId === r.id ? '닫기' : '강제취소'}
                      </button>
                    )}
                  </td>
                </Row>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 강제취소 사유 입력 — 테이블 밖에 두어 레이아웃이 깨지지 않게 한다 */}
      {openId && (
        <form
          action={action}
          className="rounded-xl border border-red-200 bg-red-50/60 p-4"
          onSubmit={() => setOpenId(null)}
        >
          <input type="hidden" name="registration_id" value={openId} />
          <p className="text-sm font-bold text-navy">
            {rows.find((r) => r.id === openId)?.name}님의 신청을 강제취소합니다
          </p>
          <p className="mt-1 text-xs leading-relaxed text-navy/60">
            취소 즉시 좌석이 대기자에게 넘어가며, 당사자와 승급자 모두에게 문자가 발송됩니다.
            되돌릴 수 없습니다.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              type="text"
              name="reason"
              maxLength={100}
              placeholder="취소 사유 (문자에 포함됩니다. 비워도 됩니다)"
              className="h-10 min-w-[240px] flex-1 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-red-400"
            />
            <button
              type="submit"
              className="h-10 shrink-0 rounded-md bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-700"
            >
              강제취소 실행
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/** 취소된 행은 흐리게 */
function Row({
  row,
  children,
}: {
  row: FestprogAdminRow;
  children: React.ReactNode;
}) {
  return <tr className={row.status === 'cancelled' ? 'opacity-50' : ''}>{children}</tr>;
}
