import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import AdminLogin from './AdminLogin';
import ControlPanel from './ControlPanel';
import RosterTable from './RosterTable';
import { ADMIN_COOKIE, verifyAdmin } from './auth';
import { adminLogout } from './actions';
import {
  adminList,
  getAvailability,
  type FestprogAdminRow,
  type FestprogAvailability,
} from '@/lib/festprog-db';
import { EVENT, PROGRAMS, onsiteSeats, programLabel } from '@/lib/festprog-config';

/**
 * 2026 양양서핑페스티벌 현장 프로그램 접수 관리자.
 *
 * 개인정보를 다루는 화면이라 캐시하지 않고 검색엔진에도 노출하지 않는다.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '페스티벌 현장 프로그램 접수 관리',
  robots: { index: false, follow: false },
};

const FALLBACK: FestprogAvailability = {
  open: false,
  barre: { capacity: PROGRAMS[0].onlineSeats, confirmed: 0, waitlist: 0 },
  hyrox: { capacity: PROGRAMS[1].onlineSeats, confirmed: 0, waitlist: 0 },
};

export default async function FestivalProgramAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; cancelled?: string }>;
}) {
  const jar = await cookies();
  if (!verifyAdmin(jar.get(ADMIN_COOKIE)?.value)) {
    return <AdminLogin />;
  }

  const sp = await searchParams;
  const includeCancelled = sp.cancelled === '1';

  let availability = FALLBACK;
  let rows: FestprogAdminRow[] = [];
  let loadError = '';
  try {
    [availability, rows] = await Promise.all([
      getAvailability(),
      adminList(includeCancelled),
    ]);
  } catch (e) {
    console.error('[festprog] admin load failed:', e);
    loadError = '명단을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.';
  }

  const csvHref = includeCancelled
    ? '/apply/festival-program/admin/export?cancelled=1'
    : '/apply/festival-program/admin/export';

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">현장 프로그램 접수 관리</h1>
          <p className="mt-1 text-sm text-navy/55">
            {EVENT.name} · {EVENT.dateLabel} {EVENT.place}
          </p>
        </div>
        <form action={adminLogout}>
          <button
            type="submit"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-navy transition hover:bg-gray-50"
          >
            로그아웃
          </button>
        </form>
      </div>

      {sp.m && (
        <p
          role="status"
          className="mb-6 rounded-lg border border-ocean/30 bg-ocean/5 px-4 py-3 text-sm leading-relaxed text-navy"
        >
          {sp.m}
        </p>
      )}
      {loadError && (
        <p
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {loadError}
        </p>
      )}

      {/* ── 현황 ────────────────────────────────────────────────────────── */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        {PROGRAMS.map((p) => {
          const a = availability[p.key];
          const remaining = Math.max(0, a.capacity - a.confirmed);
          return (
            <div key={p.key} className="rounded-xl border border-foam bg-white p-5">
              <p className="flex items-center gap-2 text-sm font-bold text-navy">
                <span aria-hidden="true">{p.emoji}</span>
                {programLabel(p.key)}
                <span className="font-normal text-navy/45">
                  {EVENT.dateLabel} {p.time}
                </span>
              </p>
              <p className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-navy">{a.confirmed}</span>
                <span className="text-sm text-navy/50">/ {a.capacity}명 확정</span>
              </p>
              <p className="mt-1.5 text-sm text-navy/60">
                잔여 <strong className="text-navy">{remaining}</strong>자리 · 대기{' '}
                <strong className={a.waitlist > 0 ? 'text-sunset' : 'text-navy'}>
                  {a.waitlist}
                </strong>
                명
              </p>
              <p className="mt-2 border-t border-foam pt-2 text-xs leading-relaxed text-navy/45">
                공시 정원 {p.totalSeats}명 = 온라인 {p.onlineSeats}명 + 현장{' '}
                {onsiteSeats(p.key)}명(당일 선착순)
              </p>
            </div>
          );
        })}
      </div>

      {/* ── 오픈/정원 조작 ──────────────────────────────────────────────── */}
      <div className="mb-8">
        <ControlPanel availability={availability} />
      </div>

      {/* ── 명단 ────────────────────────────────────────────────────────── */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-navy">
          신청 명단 <span className="text-sm font-normal text-navy/50">{rows.length}건</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href={
              includeCancelled
                ? '/apply/festival-program/admin'
                : '/apply/festival-program/admin?cancelled=1'
            }
            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-navy transition hover:bg-gray-50"
          >
            {includeCancelled ? '취소건 숨기기' : '취소건 포함'}
          </Link>
          <a
            href={csvHref}
            className="rounded-lg bg-navy px-3 py-2 text-xs font-bold text-white transition hover:bg-navy/90"
          >
            CSV 내려받기
          </a>
        </div>
      </div>

      <RosterTable rows={rows} />

      <p className="mt-6 text-xs leading-relaxed text-navy/45">
        ※ 온라인 정원을 줄여도 이미 확정된 신청은 취소되지 않습니다(초과 상태로 남습니다).
        줄이려면 강제취소를 먼저 하세요. · 현장 접수분은 이 시스템 밖에서 관리합니다.
      </p>
    </div>
  );
}
