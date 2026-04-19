'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { NOTICE_CATEGORY_LABEL } from '@/lib/database.types';
import type { NoticeCategory, Notice, NoticeAttachment } from '@/lib/database.types';
import TiptapEditor from '@/components/admin/TiptapEditor';
import AttachmentUploader from '@/components/admin/AttachmentUploader';
import { deleteFromBucket } from '@/lib/storage-helpers';

export default function EditNotice({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<NoticeCategory>('association');
  const [pinned, setPinned] = useState(false);
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<NoticeAttachment[]>([]);
  const [originalAttachments, setOriginalAttachments] = useState<NoticeAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('notices')
        .select('*')
        .eq('id', Number(id))
        .returns<Notice[]>()
        .single();
      if (data) {
        setTitle(data.title);
        setCategory(data.category);
        setPinned(data.pinned);
        setContent(data.content);
        // 기존 공지는 null일 수 있음 (마이그레이션 전 데이터) → 안전 폴백
        const initial = Array.isArray(data.attachments) ? data.attachments : [];
        setAttachments(initial);
        setOriginalAttachments(initial);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase
      .from('notices')
      .update({ title, category, pinned, content, attachments })
      .eq('id', Number(id));

    if (error) {
      alert('수정 실패: ' + error.message);
      setSubmitting(false);
      return;
    }

    // 폼에서 제거된 첨부는 Storage에서도 삭제
    const remaining = new Set(attachments.map((a) => a.url));
    const removedUrls = originalAttachments
      .map((a) => a.url)
      .filter((url) => url && !remaining.has(url));
    if (removedUrls.length > 0) {
      await deleteFromBucket('documents', removedUrls);
    }

    router.push('/admin/notices');
  };

  if (loading) return <p className="text-navy/60">로딩 중...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">공지 수정</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-navy">제목</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-foam rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-navy">카테고리</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as NoticeCategory)}
              className="mt-1 block w-full px-3 py-2 border border-foam rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
            >
              {(Object.entries(NOTICE_CATEGORY_LABEL) as [NoticeCategory, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="flex items-center gap-2 self-end pb-2">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="w-4 h-4 accent-teal"
            />
            <span className="text-sm font-medium text-navy">상단 고정</span>
          </label>
        </div>

        <div>
          <span className="text-sm font-medium text-navy block mb-1">내용</span>
          <TiptapEditor content={content} onChange={setContent} />
        </div>

        <AttachmentUploader
          value={attachments}
          onChange={setAttachments}
          pathPrefix="notices/"
        />

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="bg-ocean text-white px-6 py-2 rounded-lg font-medium hover:bg-ocean-light transition-colors disabled:opacity-50"
          >
            {submitting ? '저장 중...' : '수정'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/notices')}
            className="bg-foam text-navy px-6 py-2 rounded-lg font-medium hover:bg-foam/70 transition-colors"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
