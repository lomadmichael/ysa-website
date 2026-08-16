import type { Metadata } from "next";
import { cookies } from "next/headers";
import { listLandSurf } from "@/lib/landsurf";
import { LANDSURF_COHORTS } from "@/lib/landsurf-2026";
import AdminLogin from "./AdminLogin";
import RosterTable from "./RosterTable";
import { ADMIN_COOKIE, verifyAdmin } from "./auth";
import { logoutAction } from "./actions";

export const metadata: Metadata = {
  title: "랜드서핑 성과공유회 관리자",
  robots: { index: false, follow: false },
};

// 명단은 항상 최신이어야 한다
export const dynamic = "force-dynamic";

export default async function LandSurfAdminPage() {
  const jar = await cookies();
  if (!verifyAdmin(jar.get(ADMIN_COOKIE)?.value)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <AdminLogin />
      </div>
    );
  }

  const rows = await listLandSurf();
  const companions = rows.reduce((sum, r) => sum + (r.companions ?? 0), 0);
  const byCohort = LANDSURF_COHORTS.map((c) => ({
    cohort: c,
    count: rows.filter((r) => r.cohort === c).length,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy">랜드서핑 성과공유회 접수 명단</h1>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-navy hover:bg-gray-50"
          >
            로그아웃
          </button>
        </form>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="신청 인원" value={`${rows.length}명`} accent />
        {byCohort.map((b) => (
          <Stat key={b.cohort} label={b.cohort} value={`${b.count}명`} />
        ))}
        <Stat label="동반 가족" value={`${companions}명`} />
      </div>
      <p className="mb-6 text-sm text-navy/60">
        당일 예상 인원은 신청자 {rows.length}명 + 동반 가족 {companions}명 ={" "}
        <strong className="text-navy">{rows.length + companions}명</strong> 입니다.
      </p>

      <RosterTable rows={rows} />
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        accent ? "border-teal/30 bg-teal/5" : "border-gray-200 bg-white"
      }`}
    >
      <p className="text-xs font-semibold text-navy/50">{label}</p>
      <p className="mt-1 text-xl font-bold text-navy">{value}</p>
    </div>
  );
}
