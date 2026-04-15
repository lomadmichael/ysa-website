'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { FaqItem } from '@/lib/database.types';

export default function AdminFaq() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    const { data } = await supabase
      .from('faq')
      .select('*')
      .order('sort_order', { ascending: true });
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    await supabase.from('faq').delete().eq('id', id);
    fetchItems();
  };

  const handleMove = async (item: FaqItem, direction: -1 | 1) => {
    const idx = items.findIndex((x) => x.id === item.id);
    const swapWith = items[idx + direction];
    if (!swapWith) return;
    // 두 행의 sort_order를 교환
    await Promise.all([
      supabase.from('faq').update({ sort_order: swapWith.sort_order }).eq('id', item.id),
      supabase.from('faq').update({ sort_order: item.sort_order }).eq('id', swapWith.id),
    ]);
    fetchItems();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">FAQ 관리</h1>
        <Link
          href="/admin/faq/new"
          className="bg-ocean text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-ocean-light transition-colors"
        >
          새 FAQ 등록
        </Link>
      </div>

      {loading ? (
        <p className="text-navy/60">로딩 중...</p>
      ) : items.length === 0 ? (
        <p className="text-navy/60">등록된 FAQ가 없습니다.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-foam">
              <tr>
                <th className="text-left px-3 py-3 font-medium text-navy w-16">순서</th>
                <th className="text-left px-4 py-3 font-medium text-navy">질문</th>
                <th className="text-left px-4 py-3 font-medium text-navy w-28">카테고리</th>
                <th className="text-center px-4 py-3 font-medium text-navy w-32">정렬</th>
                <th className="text-center px-4 py-3 font-medium text-navy w-28">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foam">
              {items.map((item, i) => (
                <tr key={item.id} className="hover:bg-sand/50">
                  <td className="px-3 py-3 text-navy/60 text-xs font-mono">
                    {item.sort_order}
                  </td>
                  <td className="px-4 py-3 text-navy">
                    <p className="line-clamp-2">{item.question}</p>
                  </td>
                  <td className="px-4 py-3 text-navy/70">{item.category || '-'}</td>
                  <td className="px-4 py-3 text-center space-x-1">
                    <button
                      onClick={() => handleMove(item, -1)}
                      disabled={i === 0}
                      className="text-navy/60 hover:text-ocean disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="위로"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleMove(item, 1)}
                      disabled={i === items.length - 1}
                      className="text-navy/60 hover:text-ocean disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="아래로"
                    >
                      ▼
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center space-x-2">
                    <Link
                      href={`/admin/faq/${item.id}/edit`}
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
