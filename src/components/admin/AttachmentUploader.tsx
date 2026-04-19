'use client';

import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { NoticeAttachment } from '@/lib/database.types';

type Props = {
  value: NoticeAttachment[];
  onChange: (next: NoticeAttachment[]) => void;
  /** Storage 버킷 이름. 기본: 'documents' */
  bucket?: string;
  /** Storage 객체 경로 앞에 붙일 접두사(끝 슬래시 포함). 예: 'notices/' */
  pathPrefix?: string;
  /** 파일 선택 input의 accept 속성. 생략 시 모든 파일 허용 */
  accept?: string;
};

function safeFilename(name: string): string {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  const cleanedBase = base.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_');
  return `${cleanedBase || 'file'}${ext}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentUploader({
  value,
  onChange,
  bucket = 'documents',
  pathPrefix = '',
  accept,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    setUploading(true);

    try {
      const uploaded: NoticeAttachment[] = [];
      for (const file of Array.from(files)) {
        const path = `${pathPrefix}${Date.now()}_${safeFilename(file.name)}`;
        const { error: upErr } = await supabase.storage
          .from(bucket)
          .upload(path, file, { cacheControl: '3600', upsert: false });
        if (upErr) {
          setError(`"${file.name}" 업로드 실패: ${upErr.message}`);
          break;
        }
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
        uploaded.push({
          url: urlData.publicUrl,
          name: file.name,
          size: file.size,
        });
      }
      if (uploaded.length > 0) onChange([...value, ...uploaded]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-navy">첨부파일</span>
        <span className="text-xs text-navy/50">{value.length}개</span>
      </div>

      {/* 파일 목록 */}
      {value.length > 0 && (
        <ul className="mb-3 space-y-2">
          {value.map((att, idx) => (
            <li
              key={`${att.url}-${idx}`}
              className="flex items-center gap-3 px-3 py-2 border border-foam rounded-lg bg-foam/30"
            >
              <span className="text-lg" aria-hidden>📄</span>
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-0 truncate text-sm text-navy hover:text-ocean hover:underline"
                title={att.name}
              >
                {att.name}
              </a>
              <span className="text-xs text-navy/50 shrink-0">{formatSize(att.size)}</span>
              <button
                type="button"
                onClick={() => removeAt(idx)}
                className="text-xs text-red-500 hover:text-red-700 shrink-0 px-2 py-1 rounded hover:bg-red-50"
                aria-label={`${att.name} 첨부 제거`}
              >
                제거
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 업로드 input */}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        disabled={uploading}
        onChange={(e) => handleFiles(e.target.files)}
        className="block w-full text-sm text-navy file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-foam file:text-navy hover:file:bg-foam/70 disabled:opacity-50"
      />

      <p className="mt-1 text-xs text-navy/50">
        여러 파일을 한 번에 선택할 수 있습니다. PDF, HWP, DOCX, 이미지 등 모든 형식 지원.
      </p>

      {uploading && <p className="mt-2 text-xs text-ocean">업로드 중...</p>}
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
