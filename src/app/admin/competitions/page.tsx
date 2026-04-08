'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { STATUS_LABEL } from '@/lib/database.types';
import type { Competition } from '@/lib/database.types';
import Link from 'next/link';

export default function AdminCompetitions() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompetitions = async () => {
    const { data } = await supabase
      .from('competitions')
      .select('*')
      .order('created_at', { ascending: false });
    setCompetitions(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    await supabase.from('competitions').delete().eq('id', id);
    fetchCompetitions();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">대회 관리</h1>
        <Link
          href="/admin/competitions/new"
          className="bg-ocean text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-ocean-light transition-colors"
        >
          새 대회 등록
        </Link>
      </div>

      {loading ? (
        <p className="text-navy/60">로딩 중...</p>
      ) : competitions.length === 0 ? (
        <p className="text-navy/60">등록된 대회가 없습니다.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-foam">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-navy">대회명</th>
                <th className="text-left px-4 py-3 font-medium text-navy">연도</th>
                <th className="text-left px-4 py-3 font-medium text-navy">상태</th>
                <th className="text-left px-4 py-3 font-medium text-navy">일정</th>
                <th className="text-center px-4 py-3 font-medium text-navy">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foam">
              {competitions.map((comp) => (
                <tr key={comp.id} className="hover:bg-sand/50">
                  <td className="px-4 py-3 text-navy">{comp.name}</td>
                  <td className="px-4 py-3 text-navy/70">{comp.year}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={comp.status} />
                  </td>
                  <td className="px-4 py-3 text-navy/70">{comp.schedule ?? '-'}</td>
                  <td className="px-4 py-3 text-center space-x-2">
                    <Link
                      href={`/admin/competitions/${comp.id}/edit`}
                      className="text-teal hover:underline"
                    >
                      수정
                    </Link>
                    <button
                      onClick={() => handleDelete(comp.id)}
                      className="text-red-500 hover:underline"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Competition['status'] }) {
  const colors: Record<string, string> = {
    recruiting: 'bg-teal/10 text-teal',
    ongoing: 'bg-sunset/10 text-sunset',
    closed: 'bg-navy/10 text-navy/60',
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
