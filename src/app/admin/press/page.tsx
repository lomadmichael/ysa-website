'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { PressItem } from '@/lib/database.types';

export default function AdminPress() {
  const [items, setItems] = useState<PressItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    const { data } = await supabase
      .from('press')
      .select('*')
      .order('date', { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    await supabase.from('press').delete().eq('id', id);
    fetchItems();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">보도자료 관리</h1>
        <Link
          href="/admin/press/new"
          className="bg-ocean text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-ocean-light transition-colors"
        >
          새 보도자료 등록
        </Link>
      </div>

      {loading ? (
        <p className="text-navy/60">로딩 중...</p>
      ) : items.length === 0 ? (
        <p className="text-navy/60">등록된 보도자료가 없습니다.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-foam">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-navy">제목</th>
                <th className="text-left px-4 py-3 font-medium text-navy">출처</th>
                <th className="text-left px-4 py-3 font-medium text-navy">발행일</th>
                <th className="text-center px-4 py-3 font-medium text-navy">링크</th>
                <th className="text-center px-4 py-3 font-medium text-navy">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foam">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-sand/50">
                  <td className="px-4 py-3 text-navy">{item.title}</td>
                  <td className="px-4 py-3 text-navy/70">{item.source || '-'}</td>
                  <td className="px-4 py-3 text-navy/70">
                    {new Date(item.date).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal hover:underline text-xs"
                      >
                        열기 ↗
                      </a>
                    ) : (
                      <span className="text-navy/30 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center space-x-2">
                    <Link
                      href={`/admin/press/${item.id}/edit`}
                      className="text-teal hover:underline"
                    >
                      수정
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id)}
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
