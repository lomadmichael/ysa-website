'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { uploadFilesToBucket } from '@/lib/storage-helpers';

export default function NewGallery() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [extraUrlsText, setExtraUrlsText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const extraUrls = extraUrlsText
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean);

    if (files.length === 0 && extraUrls.length === 0) {
      alert('최소 1개 이상의 파일 또는 외부 URL이 필요합니다.');
      return;
    }

    setSubmitting(true);

    let uploadedUrls: string[] = [];
    if (files.length > 0) {
      setProgress(`업로드 중... (0 / ${files.length})`);
      const result = await uploadFilesToBucket('media', files);
      if ('error' in result) {
        alert(`파일 업로드 실패 (${result.uploadedUrls.length}/${files.length} 완료): ${result.error}`);
        setSubmitting(false);
        setProgress('');
        return;
      }
      uploadedUrls = result.urls;
      setProgress('');
    }

    const mediaUrls = [...uploadedUrls, ...extraUrls];

    const { error } = await supabase.from('gallery').insert({
      title,
      date,
      category: category || null,
      description: description || null,
      media_urls: mediaUrls,
    });

    if (error) {
      alert('저장 실패: ' + error.message);
      setSubmitting(false);
      return;
    }

    router.push('/admin/gallery');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">새 갤러리 등록</h1>
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
              placeholder="예: 대회, 교육, 행사"
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

        <label className="block">
          <span className="text-sm font-medium text-navy">사진 업로드 (다중 선택 가능)</span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            className="mt-1 block w-full text-sm text-navy file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-foam file:text-navy hover:file:bg-foam/70"
          />
          {files.length > 0 && (
            <span className="mt-1 block text-xs text-navy/60">
              선택됨: {files.length}장 ({(files.reduce((s, f) => s + f.size, 0) / (1024 * 1024)).toFixed(1)} MB)
            </span>
          )}
          <span className="mt-1 block text-xs text-navy/50">
            Supabase Storage <code>media</code> 버킷에 업로드됩니다. 첫 번째 사진이 썸네일로 사용됩니다.
          </span>
        </label>

        <details className="block">
          <summary className="text-sm font-medium text-navy cursor-pointer">
            외부 URL 추가 (선택)
          </summary>
          <textarea
            value={extraUrlsText}
            onChange={(e) => setExtraUrlsText(e.target.value)}
            rows={3}
            placeholder={'https://example.com/photo1.jpg\nhttps://example.com/photo2.jpg'}
            className="mt-2 block w-full px-3 py-2 border border-foam rounded-lg focus:outline-none focus:ring-2 focus:ring-teal font-mono text-sm"
          />
          <span className="mt-1 block text-xs text-navy/50">
            업로드된 사진 뒤에 추가됩니다. 한 줄에 하나씩.
          </span>
        </details>

        {progress && (
          <p className="text-sm text-teal">{progress}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-ocean text-white px-6 py-2 rounded-lg font-medium hover:bg-ocean-light transition-colors disabled:opacity-50"
          >
            {submitting ? '저장 중...' : '저장'}
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
