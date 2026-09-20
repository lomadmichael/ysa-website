'use client';

import { useCallback, useRef, useState } from 'react';
import { drawPrize } from '../admin/actions';
import type { Prize, PickResult } from '@/lib/livedraw-db';

/**
 * 유튜브 생중계에 그대로 띄우는 추첨 화면.
 *
 * 당첨자는 서버(SECURITY DEFINER RPC)가 정한다. 이 화면의 롤링은 연출일 뿐이고
 * 결과를 바꾸지 못한다 — 브라우저에서 뽑으면 조작 의혹이 생기기 때문.
 */

type Phase = 'idle' | 'rolling' | 'result';

const ROLL_MS = 3200;

function randomMasked() {
  const a = Math.floor(Math.random() * 9000 + 1000);
  return `010-****-${a}`;
}

export default function DrawStage({
  prizes,
  entryCount,
}: {
  prizes: Prize[];
  entryCount: number;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [sel, setSel] = useState(prizes[0]?.code ?? '');
  const [count, setCount] = useState(1);
  const [roll, setRoll] = useState('010-****-0000');
  const [result, setResult] = useState<PickResult | null>(null);
  const [err, setErr] = useState('');
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const prize = prizes.find((p) => p.code === sel);

  const run = useCallback(async () => {
    if (!prize || phase === 'rolling') return;
    setErr('');
    setResult(null);
    setPhase('rolling');
    timer.current = setInterval(() => setRoll(randomMasked()), 70);

    const started = Date.now();
    const r = await drawPrize(prize.code, count);
    const wait = Math.max(0, ROLL_MS - (Date.now() - started));
    setTimeout(() => {
      if (timer.current) clearInterval(timer.current);
      if (!r.ok) {
        setErr(
          r.code === 'no_candidates'
            ? '아직 응모자가 없습니다'
            : r.code === 'sold_out'
              ? '이 경품은 추첨이 끝났습니다'
              : '추첨에 실패했습니다',
        );
        setPhase('idle');
        return;
      }
      setResult(r);
      setPhase('result');
    }, wait);
  }, [prize, count, phase]);

  return (
    <main className="fixed inset-0 z-[60] flex flex-col overflow-auto bg-[#4a1a2a] text-[#f6efe1]">
      {/* 상단 바 — 송출 중에는 마우스를 화면 밖에 두면 보이지 않게 얇게 */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[#e3b25c]/25 px-6 py-3 text-sm opacity-40 transition hover:opacity-100">
        <select
          value={sel}
          onChange={(e) => setSel(e.target.value)}
          className="rounded-lg bg-black/25 px-3 py-2 text-[#f6efe1] outline-none"
        >
          {prizes.map((p) => (
            <option key={p.code} value={p.code} className="text-black">
              [{p.grp}] {p.sponsor} · {p.title} ({p.won}/{p.qty})
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          value={count}
          onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
          className="w-16 rounded-lg bg-black/25 px-2 py-2 text-center outline-none"
        />
        <button
          onClick={run}
          disabled={phase === 'rolling'}
          className="rounded-lg bg-[#e3b25c] px-5 py-2 font-extrabold text-[#4a1a2a] disabled:opacity-50"
        >
          {phase === 'rolling' ? '추첨 중…' : '추첨 시작'}
        </button>
        <button
          onClick={() => {
            setResult(null);
            setPhase('idle');
            setErr('');
          }}
          className="rounded-lg border border-[#e3b25c]/40 px-4 py-2"
        >
          초기화
        </button>
        <span className="ml-auto text-[#e3b25c]">응모 {entryCount.toLocaleString()}명</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-8 py-10 text-center">
        <p className="text-[22px] font-semibold tracking-[0.22em] text-[#e3b25c]">
          2026 대한서핑협회장배 코리아 오픈 · 롱보드
        </p>

        {prize && (
          <>
            <h1 className="mt-6 text-[96px] font-black leading-none tracking-tight">
              경품 추첨
            </h1>
            <p className="mt-6 text-[40px] font-extrabold text-[#e3b25c]">
              {prize.sponsor}
            </p>
            <p className="mt-2 text-[30px] font-bold opacity-85">{prize.title}</p>
          </>
        )}

        <div className="mt-12 flex min-h-[240px] w-full max-w-[1100px] flex-col items-center justify-center rounded-3xl border-[3px] border-[#e3b25c]/60 px-10 py-10">
          {phase === 'idle' && !err && (
            <p className="text-[34px] font-bold opacity-55">
              응모 {entryCount.toLocaleString()}명 중에서 추첨합니다
            </p>
          )}
          {err && <p className="text-[34px] font-bold text-[#f0a0b0]">{err}</p>}
          {phase === 'rolling' && (
            <p className="whitespace-nowrap font-mono text-[84px] font-black tabular-nums text-[#e3b25c]">
              {roll}
            </p>
          )}
          {phase === 'result' && result?.winners && (
            <>
              <p className="text-[24px] font-bold tracking-[0.2em] text-[#e3b25c]">당첨</p>
              <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
                {result.winners.map((w) => (
                  <li key={w.phone} className="whitespace-nowrap text-[56px] font-black leading-tight">
                    {w.masked_name}
                    <span className="ml-4 whitespace-nowrap font-mono text-[40px] tabular-nums text-[#e3b25c]">
                      {w.masked_phone}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-[22px] opacity-70">
                당첨되신 분께는 문자로 안내드립니다
              </p>
            </>
          )}
        </div>

        <p className="mt-10 text-[22px] font-semibold text-[#e3b25c]/85">
          응모는 ysakorea.com/live 에서
        </p>
      </div>
    </main>
  );
}
