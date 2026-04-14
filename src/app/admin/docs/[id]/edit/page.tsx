'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { DocumentItem, DocumentUpdate } from '@/lib/database.types';

type SourceType = 'file' | 'url';

function safeFilename(name: string): string {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  const cleanedBase = base.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_');
  return `${cleanedBase || 'file'}${ext}`;
}

/** public URL에서 bucket 경로(키) 추출. */
function extractStoragePath(publicUrl: string): string | null {
  const marker = '/storage/v1/object/public/documents/';
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}

export default function EditDocument({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('file');

  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
  const [existingFileName, setExistingFileName] = useState<string | null>(null);
  const [replaceFile, setReplaceFile] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);

  const [externalUrl, setExternalUrl] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('id', Number(id))
        .returns<DocumentItem[]>()
        .single();
      if (data) {
        setTitle(data.title);
        setDescription(data.description ?? '');
        setDate(data.date);
        setExistingFileUrl(data.file_url);
        setExistingFileName(data.file_name);
        setExternalUrl(data.external_url ?? '');
        setSourceType(data.file_url ? 'file' : 'url');
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (sourceType === 'url' && !externalUrl.trim()) {
      alert('외부 링크 URL을 입력해 주세요.');
      return;
    }

    setSubmitting(true);

    let file_url = existingFileUrl;
    let file_name = existingFileName;
    let file_size: number | null | undefined = undefined; // undefined = 변경 없음
    let external_url: string | null = null;

    if (sourceType === 'file') {
      // 파일 유지, 교체, 또는 신규
      if (replaceFile && newFile) {
        // 기존 파일 삭제
        if (existingFileUrl) {
          const oldPath = extractStoragePath(existingFileUrl);
          if (oldPath) {
            await supabase.storage.from('documents').remove([oldPath]);
          }
        }
        // 신규 업로드
        const path = `${Date.now()}_${safeFilename(newFile.name)}`;
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(path, newFile, { cacheControl: '3600', upsert: false });
        if (uploadError) {
          alert('파일 업로드 실패: ' + uploadError.message);
          setSubmitting(false);
          return;
        }
        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
        file_url = urlData.publicUrl;
        file_name = newFile.name;
        file_size = newFile.size;
      } else if (!existingFileUrl && !newFile) {
        alert('파일이 없습니다. 파일을 업로드하거나 외부 링크 방식을 선택해 주세요.');
        setSubmitting(false);
        return;
      } else if (!existingFileUrl && newFile) {
        // url 방식이었다가 file로 전환되는 경우
        const path = `${Date.now()}_${safeFilename(newFile.name)}`;
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(path, newFile, { cacheControl: '3600', upsert: false });
        if (uploadError) {
          alert('파일 업로드 실패: ' + uploadError.message);
          setSubmitting(false);
          return;
        }
        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
        file_url = urlData.publicUrl;
        file_name = newFile.name;
        file_size = newFile.size;
      }
      external_url = null;
    } else {
      // url 방식으로 전환/유지: 기존 파일이 있으면 Storage에서 삭제
      if (existingFileUrl) {
        const oldPath = extractStoragePath(existingFileUrl);
        if (oldPath) {
          await supabase.storage.from('documents').remove([oldPath]);
        }
        file_url = null;
        file_name = null;
        file_size = null;
      }
      external_url = externalUrl.trim();
    }

    const updatePayload: DocumentUpdate = {
      title,
      description: description || null,
      date,
      file_url,
      file_name,
      external_url,
    };
    if (file_size !== undefined) {
      updatePayload.file_size = file_size;
    }

    const { error } = await supabase
      .from('documents')
      .update(updatePayload)
      .eq('id', Number(id));

    if (error) {
      alert('저장 실패: ' + error.message);
      setSubmitting(false);
      return;
    }

    router.push('/admin/docs');
  };

  if (loading) {
    return <p className="text-navy/60">로딩 중...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">규정·서식 수정</h1>
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
          <span className="text-sm font-medium text-navy">발행일</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-foam rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
          />
        </label>

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
          <div className="space-y-2">
            {existingFileUrl && !replaceFile && (
              <div className="bg-foam/50 px-3 py-2 rounded-lg flex items-center justify-between">
                <a
                  href={existingFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-teal hover:underline truncate"
                >
                  {existingFileName || '현재 파일'}
                </a>
                <button
                  type="button"
                  onClick={() => setReplaceFile(true)}
                  className="text-xs text-red-500 hover:underline ml-3 shrink-0"
                >
                  파일 교체
                </button>
              </div>
            )}
            {(replaceFile || !existingFileUrl) && (
              <label className="block">
                <span className="text-sm font-medium text-navy">
                  {replaceFile ? '새 파일 선택' : '파일 선택'}
                </span>
                <input
                  type="file"
                  onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
                  className="mt-1 block w-full text-sm text-navy file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-foam file:text-navy hover:file:bg-foam/70"
                />
                {newFile && (
                  <span className="mt-1 block text-xs text-navy/60">
                    선택됨: {newFile.name} ({(newFile.size / 1024).toFixed(1)} KB)
                  </span>
                )}
                {replaceFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setReplaceFile(false);
                      setNewFile(null);
                    }}
                    className="mt-2 text-xs text-navy/60 hover:underline"
                  >
                    교체 취소
                  </button>
                )}
              </label>
            )}
          </div>
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
            {existingFileUrl && (
              <span className="mt-1 block text-xs text-red-500">
                외부 링크로 전환 시 기존에 업로드된 파일은 삭제됩니다.
              </span>
            )}
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
