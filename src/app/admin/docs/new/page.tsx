'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type SourceType = 'file' | 'url';

function safeFilename(name: string): string {
  // 한글/공백/특수문자 → _, 확장자 유지
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  const cleanedBase = base.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_');
  return `${cleanedBase || 'file'}${ext}`;
}

export default function NewDocument() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [sourceType, setSourceType] = useState<SourceType>('file');
  const [file, setFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (sourceType === 'file' && !file) {
      alert('파일을 선택해 주세요.');
      return;
    }
    if (sourceType === 'url' && !externalUrl.trim()) {
      alert('외부 링크 URL을 입력해 주세요.');
      return;
    }

    setSubmitting(true);

    let file_url: string | null = null;
    let file_name: string | null = null;
    let file_size: number | null = null;
    let external_url: string | null = null;

    if (sourceType === 'file' && file) {
      const path = `${Date.now()}_${safeFilename(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        alert('파일 업로드 실패: ' + uploadError.message);
        setSubmitting(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
      file_url = urlData.publicUrl;
      file_name = file.name;
      file_size = file.size;
    } else {
      external_url = externalUrl.trim();
    }

    const { error } = await supabase.from('documents').insert({
      title,
      description: description || null,
      date,
      file_url,
      file_name,
      file_size,
      external_url,
    });

    if (error) {
      alert('저장 실패: ' + error.message);
      setSubmitting(false);
      return;
    }

    router.push('/admin/docs');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">새 규정·서식 등록</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-5 max-w-2xl">
        <label className="block">
          <span className="text-sm font-medium text-navy">제목</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="예: 양양군서핑협회 정관"
            className="mt-1 block w-full px-3 py-2 border border-foam rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-navy">설명</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="자료에 대한 간단한 설명 (선택)"
            className="mt-1 block w-full px-3 py-2 border border-foam rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-navy">발행일</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-foam rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
          />
        </label>

        {/* 소스 타입 토글 */}
        <div>
          <span className="text-sm font-medium text-navy block mb-2">자료 제공 방식</span>
          <div className="inline-flex rounded-lg border border-foam overflow-hidden">
            <button
              type="button"
              onClick={() => setSourceType('file')}
              className={`px-4 py-2 text-sm transition-colors ${
                sourceType === 'file' ? 'bg-ocean text-white' : 'bg-white text-navy/70 hover:bg-foam/50'
              }`}
            >
              파일 업로드
            </button>
            <button
              type="button"
              onClick={() => setSourceType('url')}
              className={`px-4 py-2 text-sm transition-colors ${
                sourceType === 'url' ? 'bg-ocean text-white' : 'bg-white text-navy/70 hover:bg-foam/50'
              }`}
            >
              외부 링크
            </button>
          </div>
        </div>

        {sourceType === 'file' ? (
          <label className="block">
            <span className="text-sm font-medium text-navy">파일 선택</span>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm text-navy file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-foam file:text-navy hover:file:bg-foam/70"
            />
            {file && (
              <span className="mt-1 block text-xs text-navy/60">
                선택됨: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </span>
            )}
            <span className="mt-1 block text-xs text-navy/50">
              PDF, HWP, DOCX, ZIP 등 모든 파일 형식 지원. Supabase Storage에 저장됩니다.
            </span>
          </label>
        ) : (
          <label className="block">
            <span className="text-sm font-medium text-navy">외부 링크 URL</span>
            <input
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1 block w-full px-3 py-2 border border-foam rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
            />
            <span className="mt-1 block text-xs text-navy/50">
              예: Google Drive 공유 링크, 타 사이트 문서 URL.
            </span>
          </label>
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
            onClick={() => router.push('/admin/docs')}
            className="bg-foam text-navy px-6 py-2 rounded-lg font-medium hover:bg-foam/70 transition-colors"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
