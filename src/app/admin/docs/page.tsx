'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { DocumentItem } from '@/lib/database.types';

function formatSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminDocs() {
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    const { data } = await supabase
      .from('documents')
      .select('*')
      .order('date', { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (item: DocumentItem) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    // Storage 파일도 함께 삭제
    if (item.file_url) {
      const path = extractStoragePath(item.file_url);
      if (path) {
        await supabase.storage.from('documents').remove([path]);
      }
    }

    await supabase.from('documents').delete().eq('id', item.id);
    fetchItems();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">규정·서식 관리</h1>
        <Link
          href="/admin/docs/new"
          className="bg-ocean text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-ocean-light transition-colors"
        >
          새 자료 등록
        </Link>
      </div>

      {loading ? (
        <p className="text-navy/60">로딩 중...</p>
      ) : items.length === 0 ? (
        <p className="text-navy/60">등록된 규정·서식이 없습니다.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-foam">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-navy">제목</th>
                <th className="text-left px-4 py-3 font-medium text-navy">유형</th>
                <th className="text-left px-4 py-3 font-medium text-navy">파일/링크</th>
                <th className="text-left px-4 py-3 font-medium text-navy">발행일</th>
                <th className="text-center px-4 py-3 font-medium text-navy">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foam">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-sand/50">
                  <td className="px-4 py-3 text-navy">{item.title}</td>
                  <td className="px-4 py-3 text-navy/70">
                    {item.file_url ? (
                      <span className="inline-block px-2 py-0.5 rounded-sm bg-ocean/10 text-ocean text-xs">
                        파일
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-sm bg-teal/10 text-teal text-xs">
                        외부 링크
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-navy/70">
                    {item.file_url ? (
                      <a
                        href={item.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal hover:underline text-xs"
                      >
                        {item.file_name || '파일'} {item.file_size ? `· ${formatSize(item.file_size)}` : ''}
                      </a>
                    ) : item.external_url ? (
                      <a
                        href={item.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal hover:underline text-xs break-all"
                      >
                        {item.external_url.length > 40
                          ? item.external_url.slice(0, 40) + '…'
                          : item.external_url}
                      </a>
                    ) : (
                      <span className="text-navy/30 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-navy/70">
                    {new Date(item.date).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-center space-x-2">
                    <Link
                      href={`/admin/docs/${item.id}/edit`}
                      className="text-teal hover:underline"
                    >
                      수정
                    </Link>
                    <button
                      onClick={() => handleDelete(item)}
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

/** public URL에서 bucket 경로(키) 추출. 삭제 시 사용. */
function extractStoragePath(publicUrl: string): string | null {
  const marker = '/storage/v1/object/public/documents/';
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}
