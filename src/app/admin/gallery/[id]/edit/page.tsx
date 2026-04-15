'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { GalleryItem, GalleryUpdate } from '@/lib/database.types';
import { uploadFilesToBucket, deleteFromBucket } from '@/lib/storage-helpers';

export default function EditGallery({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [existingUrls, setExistingUrls] = useState<string[]>([]);
  const [removedUrls, setRemovedUrls] = useState<string[]>([]); // 저장 시 Storage에서 삭제할 것
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [extraUrlsText, setExtraUrlsText] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('gallery')
        .select('*')
        .eq('id', Number(id))
        .returns<GalleryItem[]>()
        .single();
      if (data) {
        setTitle(data.title);
        setDate(data.date);
        setCategory(data.category ?? '');
        setDescription(data.description ?? '');
        setExistingUrls(data.media_urls ?? []);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const removeExisting = (url: string) => {
    setExistingUrls((arr) => arr.filter((u) => u !== url));
    setRemovedUrls((arr) => [...arr, url]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const extraUrls = extraUrlsText
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean);

    setSubmitting(true);

    let uploadedUrls: string[] = [];
    if (newFiles.length > 0) {
      setProgress(`업로드 중... (0 / ${newFiles.length})`);
      const result = await uploadFilesToBucket('media', newFiles);
      if ('error' in result) {
        alert(`파일 업로드 실패: ${result.error}`);
        setSubmitting(false);
        setProgress('');
        return;
      }
      uploadedUrls = result.urls;
      setProgress('');
    }

    const finalUrls = [...existingUrls, ...uploadedUrls, ...extraUrls];

    if (finalUrls.length === 0) {
      alert('최소 1개 이상의 사진/URL이 있어야 합니다.');
      setSubmitting(false);
      return;
    }

    const updatePayload: GalleryUpdate = {
      title,
      date,
      category: category || null,
      description: description || null,
      media_urls: finalUrls,
    };

    const { error } = await supabase
      .from('gallery')
      .update(updatePayload)
      .eq('id', Number(id));

    if (error) {
      alert('수정 실패: ' + error.message);
      setSubmitting(false);
      return;
    }

    // DB 업데이트 성공 후 제거된 Storage 객체 삭제
    if (removedUrls.length > 0) {
      await deleteFromBucket('media', removedUrls);
    }

    router.push('/admin/gallery');
  };

  if (loading) return <p className="text-navy/60">로딩 중...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">갤러리 수정</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-5 max-w-2xl">
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
            <span className="text-sm font-medium text-navy">날짜</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-foam rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-navy">카테고리</span>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-foam rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-navy">설명</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-foam rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
          />
        </label>

        {/* 기존 사진 미리보기 + 삭제 */}
        {existingUrls.length > 0 && (
          <div>
            <span className="text-sm font-medium text-navy block mb-2">
              기존 사진 ({existingUrls.length}장)
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {existingUrls.map((url) => (
                <div key={url} className="relative group aspect-square rounded-lg overflow-hidden bg-foam">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExisting(url)}
                    className="absolute top-1 right-1 bg-red-500/90 hover:bg-red-600 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="삭제"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            {removedUrls.length > 0 && (
              <p className="mt-2 text-xs text-red-500">
                {removedUrls.length}장 제거 예정 (저장 시 Storage에서 삭제됨)
              </p>
            )}
          </div>
        )}

        <label className="block">
          <span className="text-sm font-medium text-navy">사진 추가 (다중 선택 가능)</span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setNewFiles(Array.from(e.target.files ?? []))}
            className="mt-1 block w-full text-sm text-navy file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-foam file:text-navy hover:file:bg-foam/70"
          />
          {newFiles.length > 0 && (
            <span className="mt-1 block text-xs text-navy/60">
              {newFiles.length}장 추가 예정 ({(newFiles.reduce((s, f) => s + f.size, 0) / (1024 * 1024)).toFixed(1)} MB)
            </span>
          )}
        </label>

        <details className="block">
          <summary className="text-sm font-medium text-navy cursor-pointer">
            외부 URL 추가 (선택)
          </summary>
          <textarea
            value={extraUrlsText}
            onChange={(e) => setExtraUrlsText(e.target.value)}
            rows={3}
            placeholder={'https://example.com/photo.jpg'}
            className="mt-2 block w-full px-3 py-2 border border-foam rounded-lg focus:outline-none focus:ring-2 focus:ring-teal font-mono text-sm"
          />
        </details>

        {progress && <p className="text-sm text-teal">{progress}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-ocean text-white px-6 py-2 rounded-lg font-medium hover:bg-ocean-light transition-colors disabled:opacity-50"
          >
            {submitting ? '저장 중...' : '수정'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/gallery')}
            className="bg-foam text-navy px-6 py-2 rounded-lg font-medium hover:bg-foam/70 transition-colors"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
