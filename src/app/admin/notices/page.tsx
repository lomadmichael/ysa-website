'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { NOTICE_CATEGORY_LABEL } from '@/lib/database.types';
import type { Notice, NoticeAttachment } from '@/lib/database.types';
import { deleteFromBucket } from '@/lib/storage-helpers';
import Link from 'next/link';

export default function AdminNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotices = async () => {
    const { data } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false });
    setNotices(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까? 첨부파일도 함께 삭제됩니다.')) return;

    const { data: row } = await supabase
      .from('notices')
      .select('attachments')
      .eq('id', id)
      .returns<{ attachments: NoticeAttachment[] | null }[]>()
      .single();

    const urls = Array.isArray(row?.attachments)
      ? row.attachments.map((a) => a.url).filter(Boolean)
      : [];

    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (error) {
      alert('삭제 실패: ' + error.message);
      return;
    }

    if (urls.length > 0) {
      await deleteFromBucket('documents', urls);
    }
    fetchNotices();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">공지사항 관리</h1>
        <Link
          href="/admin/notices/new"
          className="bg-ocean text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-ocean-light transition-colors"
        >
          새 공지 작성
        </Link>
      </div>

      {loading ? (
        <p className="text-navy/60">로딩 중...</p>
      ) : notices.length === 0 ? (
        <p className="text-navy/60">등록된 공지사항이 없습니다.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-foam">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-navy">제목</th>
                <th className="text-left px-4 py-3 font-medium text-navy">카테고리</th>
                <th className="text-center px-4 py-3 font-medium text-navy">고정</th>
                <th className="text-left px-4 py-3 font-medium text-navy">작성일</th>
                <th className="text-center px-4 py-3 font-medium text-navy">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foam">
              {notices.map((notice) => (
                <tr key={notice.id} className="hover:bg-sand/50">
                  <td className="px-4 py-3 text-navy">{notice.title}</td>
                  <td className="px-4 py-3 text-navy/70">
                    {NOTICE_CATEGORY_LABEL[notice.category]}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {notice.pinned ? (
                      <span className="text-sunset font-bold">Y</span>
                    ) : (
                      <span className="text-navy/30">N</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-navy/70">
                    {new Date(notice.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-center space-x-2">
                    <Link
                      href={`/admin/notices/${notice.id}/edit`}
                      className="text-teal hover:underline"
                    >
                      수정
                    </Link>
                    <button
                      onClick={() => handleDelete(notice.id)}
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
