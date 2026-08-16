"use client";

import type { LandSurfRegistration } from "@/lib/landsurf";

/**
 * 접수 명단 표 + CSV 내려받기.
 * CSV 는 서버 라우트를 따로 두지 않고 브라우저에서 만든다 (명단이 수십 건 규모라 충분).
 */
export default function RosterTable({ rows }: { rows: LandSurfRegistration[] }) {
  function downloadCsv() {
    const header = ["번호", "이름", "연락처", "기수", "동반가족", "접수일시"];
    const body = rows.map((r, i) => [
      String(i + 1),
      r.name,
      r.phone,
      r.cohort,
      String(r.companions ?? 0),
      new Date(r.created_at).toLocaleString("ko-KR"),
    ]);
    const csv = [header, ...body]
      .map((cols) =>
        cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
      )
      .join("\r\n");
    // 엑셀이 한글을 깨뜨리지 않도록 BOM 을 붙인다
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `랜드서핑성과공유회_명단_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-gray-200 bg-gray-50 p-10 text-center text-sm text-navy/50">
        아직 접수된 신청이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={downloadCsv}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/90"
        >
          CSV 내려받기
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gray-50 text-navy/60">
            <tr>
              {["#", "이름", "연락처", "기수", "동반가족", "접수일시"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td className="px-4 py-3 text-navy/40">{i + 1}</td>
                <td className="px-4 py-3 font-semibold text-navy">{r.name}</td>
                <td className="px-4 py-3 font-mono text-navy/80">{r.phone}</td>
                <td className="px-4 py-3">{r.cohort}</td>
                <td className="px-4 py-3">
                  {r.companions > 0 ? `${r.companions}명` : "-"}
                </td>
                <td className="px-4 py-3 text-navy/55">
                  {new Date(r.created_at).toLocaleString("ko-KR", {
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
