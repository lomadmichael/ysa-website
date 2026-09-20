'use client';

import { useState, useTransition } from 'react';
import { drawPrize, toggleOpen } from './actions';
import type { Prize, WinnerRow, PickResult } from '@/lib/livedraw-db';

function fmt(iso: string) {
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, '0')}:${String(
    d.getUTCMinutes(),
  ).padStart(2, '0')}`;
}

export default function AdminPanel({
  isOpen,
  entryCount,
  prizes,
  winners,
}: {
  isOpen: boolean;
  entryCount: number;
  prizes: Prize[];
  winners: WinnerRow[];
}) {
  const [pending, start] = useTransition();
  const [last, setLast] = useState<PickResult | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  return (
    <main className="min-h-screen bg-sand py-8">
      <div className="mx-auto max-w-[900px] px-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-ocean">라이브 경품 관리</h1>
          <a
            href="/live/draw"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-ocean px-4 py-2 text-sm font-bold text-white"
          >
            추첨 화면 열기 ↗
          </a>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-navy/12 bg-white p-5">
            <p className="text-sm text-navy/60">총 응모</p>
            <p className="mt-1 text-3xl font-extrabold text-ocean">{entryCount.toLocaleString()}명</p>
          </div>
          <div className="rounded-xl border border-navy/12 bg-white p-5">
            <p className="text-sm text-navy/60">응모 상태</p>
            <div className="mt-2 flex items-center gap-3">
              <span className={`text-lg font-extrabold ${isOpen ? 'text-teal' : 'text-navy/50'}`}>
                {isOpen ? '접수 중' : '마감'}
              </span>
              <button
                onClick={() => start(() => void toggleOpen(!isOpen))}
                disabled={pending}
                className="rounded-lg border border-navy/20 px-3 py-1.5 text-sm font-bold text-navy disabled:opacity-50"
              >
                {isOpen ? '마감하기' : '다시 열기'}
              </button>
            </div>
          </div>
        </div>

        <h2 className="mt-10 text-lg font-bold text-ocean">경품 추첨</h2>
        <p className="mt-1 text-sm text-navy/60">
          추첨은 서버에서 무작위로 뽑습니다. 이미 당첨된 분은 다시 뽑히지 않습니다.
        </p>
        <ul className="mt-4 space-y-3">
          {prizes.map((p) => {
            const left = p.qty - p.won;
            const n = counts[p.code] ?? 1;
            return (
              <li
                key={p.code}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-navy/12 bg-white px-5 py-4"
              >
                <div className="min-w-[200px] flex-1">
                  <p className="text-sm font-semibold text-teal">
                    {p.sponsor} · {p.grp}그룹
                  </p>
                  <p className="font-bold text-navy">{p.title}</p>
                </div>
                <span className="rounded-lg bg-foam px-3 py-1 text-sm font-bold text-ocean">
                  {p.won} / {p.qty}
                </span>
                <input
                  type="number"
                  min={1}
                  max={Math.max(left, 1)}
                  value={n}
                  onChange={(e) =>
                    setCounts((c) => ({ ...c, [p.code]: Math.max(1, Number(e.target.value) || 1) }))
                  }
                  className="w-16 rounded-lg border border-navy/20 px-2 py-1.5 text-center"
                />
                <button
                  disabled={pending || left <= 0 || entryCount === 0}
                  onClick={() =>
                    start(async () => {
                      const r = await drawPrize(p.code, n);
                      setLast(r);
                    })
                  }
                  className="rounded-lg bg-sunset px-4 py-2 text-sm font-extrabold text-white disabled:opacity-40"
                >
                  {left <= 0 ? '완료' : '추첨'}
                </button>
              </li>
            );
          })}
        </ul>

        {last && (
          <div className="mt-5 rounded-xl border-2 border-teal bg-teal/5 p-5">
            {last.ok ? (
              <>
                <p className="font-bold text-ocean">
                  {last.sponsor} · {last.prize} 추첨 완료 (응모 {last.total_entries}명)
                </p>
                <ul className="mt-2 space-y-1 text-navy">
                  {last.winners?.map((w) => (
                    <li key={w.phone}>
                      {w.name} · {w.masked_phone}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="font-bold text-sunset">
                추첨하지 못했습니다 ({last.code === 'no_candidates' ? '남은 응모자 없음' : last.code})
              </p>
            )}
          </div>
        )}

        <h2 className="mt-10 text-lg font-bold text-ocean">당첨자 ({winners.length}명)</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-navy/12 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-foam text-left text-navy">
              <tr>
                <th className="px-4 py-3">경품</th>
                <th className="px-4 py-3">이름</th>
                <th className="px-4 py-3">연락처</th>
                <th className="px-4 py-3">추첨 시각</th>
              </tr>
            </thead>
            <tbody>
              {winners.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-navy/50">
                    아직 추첨하지 않았습니다.
                  </td>
                </tr>
              )}
              {winners.map((w) => (
                <tr key={w.phone + w.prize_code} className="border-t border-navy/8">
                  <td className="px-4 py-3">
                    <span className="text-navy/60">{w.sponsor}</span> {w.prize_title}
                  </td>
                  <td className="px-4 py-3 font-semibold">{w.name}</td>
                  <td className="px-4 py-3 tabular-nums">{w.phone}</td>
                  <td className="px-4 py-3 text-navy/60">{fmt(w.drawn_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-navy/50">
          당첨 안내 문자는 이 화면에서 보내지 않습니다. 명단을 확인한 뒤 발송 스크립트로 보냅니다.
        </p>
      </div>
    </main>
  );
}
