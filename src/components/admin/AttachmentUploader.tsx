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
  /** 개별 파일 최대 용량(MB). 기본 50MB (Supabase 기본 버킷 한도) */
  maxSizeMB?: number;
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
  maxSizeMB = 50,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);

  const maxBytes = maxSizeMB * 1024 * 1024;

  const handleFiles = async (files: FileList | File[] | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    setError('');

    const oversized = fileArray.filter((f) => f.size > maxBytes);
    const allowed = fileArray.filter((f) => f.size <= maxBytes);

    if (oversized.length > 0) {
      const names = oversized.map((f) => `"${f.name}" (${formatSize(f.size)})`).join(', ');
      setError(`최대 ${maxSizeMB}MB까지 업로드 가능합니다. 제외된 파일: ${names}`);
    }

    if (allowed.length === 0) return;

    setUploading(true);
    try {
      const uploaded: NoticeAttachment[] = [];
      for (const file of allowed) {
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragActive) setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (uploading) return;
    const dropped = e.dataTransfer?.files;
    if (dropped && dropped.length > 0) {
      handleFiles(dropped);
    }
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

      {/* 드롭 존 */}
      <div
        onDragEnter={handleDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !uploading) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        aria-label="파일을 끌어다 놓거나 클릭해서 업로드"
        className={[
          'border-2 border-dashed rounded-lg px-4 py-6 text-center cursor-pointer transition-colors',
          dragActive
            ? 'border-ocean bg-ocean/5'
            : 'border-foam bg-white hover:border-teal hover:bg-foam/20',
          uploading ? 'opacity-50 cursor-not-allowed' : '',
        ].join(' ')}
      >
        <p className="text-sm text-navy">
          {dragActive ? '여기에 놓으세요' : '파일을 끌어다 놓거나 클릭해서 선택'}
        </p>
        <p className="mt-1 text-xs text-navy/50">
          PDF, HWP, DOCX, 이미지 등 모든 형식 · 개별 최대 {maxSizeMB}MB · 다중 업로드 지원
        </p>
      </div>

      {/* 숨겨진 input */}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        disabled={uploading}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {uploading && <p className="mt-2 text-xs text-ocean">업로드 중...</p>}
      {error && <p className="mt-2 text-xs text-red-500 break-words">{error}</p>}
    </div>
  );
}
