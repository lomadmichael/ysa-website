'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { GalleryItem } from '@/lib/database.types';
import Link from 'next/link';

export default function AdminGallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    const { data } = await supabase
      .from('gallery')
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
    await supabase.from('gallery').delete().eq('id', id);
    fetchItems();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">갤러리 관리</h1>
        <Link
          href="/admin/gallery/new"
          className="bg-ocean text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-ocean-light transition-colors"
        >
          새 갤러리 등록
        </Link>
      </div>

      {loading ? (
        <p className="text-navy/60">로딩 중...</p>
      ) : items.length === 0 ? (
        <p className="text-navy/60">등록된 갤러리가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              {item.media_urls.length > 0 && (
                <div className="aspect-video bg-foam overflow-hidden">
                  <img
                    src={item.media_urls[0]}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-navy text-sm">{item.title}</h3>
                <p className="text-xs text-navy/50 mt-1">
                  {new Date(item.date).toLocaleDateString('ko-KR')} | {item.media_urls.length}장
                </p>
                {item.category && (
                  <span className="inline-block mt-2 text-xs bg-foam text-navy/70 px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                )}
                <div className="mt-3 flex gap-2 text-sm">
                  <Link
                    href={`/admin/gallery/${item.id}/edit`}
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
