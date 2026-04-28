'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { uploadToBucket } from '@/lib/storage-helpers';

type AutofillPayload = {
  title?: string | null;
  source?: string | null;
  description?: string | null;
};

type Props = {
  url: string;
  onUrlChange: (v: string) => void;
  thumbnailUrl: string | null;
  onThumbnailChange: (v: string | null) => void;
  /** OG 자동채움 시 부모에서 제목·출처·설명 적용. 콜백에서 사용자가 비우는지 결정 */
  onAutofill?: (data: AutofillPayload) => void;
};

export default function PressMetaFields({
  url,
  onUrlChange,
  thumbnailUrl,
  onThumbnailChange,
  onAutofill,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fetching, setFetching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ kind: 'info' | 'error' | 'ok'; text: string } | null>(null);

  const fetchOg = async () => {
    if (!url.trim()) {
      setMessage({ kind: 'error', text: 'URL을 먼저 입력해주세요.' });
      return;
    }
    if (!/^https?:\/\//i.test(url.trim())) {
      setMessage({ kind: 'error', text: 'http:// 또는 https://로 시작하는 URL이 필요합니다.' });
      return;
    }
    setMessage(null);
    setFetching(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setMessage({ kind: 'error', text: '로그인 세션이 만료되었습니다. 다시 로그인해주세요.' });
        return;
      }
      const res = await fetch('/api/admin/fetch-og', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ url: url.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessage({
          kind: 'error',
          text: `가져오기 실패: ${err.error ?? res.statusText}`,
        });
        return;
      }
      const data = await res.json();
      if (data.thumbnailUrl) onThumbnailChange(data.thumbnailUrl);
      if (onAutofill) {
        onAutofill({
          title: data.title,
          source: data.source,
          description: data.description,
        });
      }
      const filled: string[] = [];
      if (data.title) filled.push('제목');
      if (data.source) filled.push('출처');
      if (data.thumbnailUrl) filled.push('썸네일');
      setMessage({
        kind: 'ok',
        text: filled.length > 0
          ? `자동 채움 완료: ${filled.join(', ')}`
          : 'OG 메타를 찾지 못했습니다. 수동으로 입력해주세요.',
      });
    } catch (err) {
      setMessage({
        kind: 'error',
        text: `오류: ${err instanceof Error ? err.message : 'unknown'}`,
      });
    } finally {
      setFetching(false);
    }
  };

  const handleManualUpload = async (file: File | null) => {
    if (!file) return;
    setMessage(null);
    setUploading(true);
    try {
      const result = await uploadToBucket('media', file);
      if ('error' in result) {
        setMessage({ kind: 'error', text: `업로드 실패: ${result.error}` });
        return;
      }
      onThumbnailChange(result.url);
      setMessage({ kind: 'ok', text: '이미지 업로드 완료' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeThumbnail = () => {
    onThumbnailChange(null);
    setMessage({ kind: 'info', text: '썸네일을 제거했습니다. (기존 Storage 파일은 그대로 남습니다)' });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block">
          <span className="text-sm font-medium text-navy">원문 기사 URL</span>
          <div className="mt-1 flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="https://..."
              className="flex-1 px-3 py-2 border border-foam rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
            />
            <button
              type="button"
              onClick={fetchOg}
              disabled={fetching || !url.trim()}
              className="shrink-0 px-4 py-2 rounded-lg bg-teal text-white text-sm font-medium hover:bg-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {fetching ? '가져오는 중…' : '🔍 정보 가져오기'}
            </button>
          </div>
          <span className="mt-1 block text-xs text-navy/50">
            URL을 붙여넣고 버튼을 누르면 제목·출처·대표이미지가 자동 채워집니다.
          </span>
        </label>
      </div>

      <div>
        <span className="text-sm font-medium text-navy block mb-2">대표 이미지 (썸네일)</span>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          {/* 미리보기 */}
          <div className="relative w-40 h-28 rounded-lg overflow-hidden bg-foam shrink-0 border border-foam">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt="썸네일 미리보기"
                fill
                sizes="160px"
                className="object-cover"
                unoptimized={!thumbnailUrl.includes('.supabase.co')}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-navy/40">
                썸네일 없음
              </div>
            )}
          </div>

          {/* 액션 */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-1.5 rounded-lg bg-foam text-navy text-xs font-medium hover:bg-foam/70 transition-colors disabled:opacity-50"
              >
                {uploading ? '업로드 중…' : '직접 업로드'}
              </button>
              {thumbnailUrl && (
                <button
                  type="button"
                  onClick={removeThumbnail}
                  className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors"
                >
                  이미지 제거
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleManualUpload(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <p className="text-xs text-navy/50 leading-relaxed">
              자동 추출이 실패하거나 다른 이미지로 바꾸고 싶을 때 직접 업로드하세요.
              <br />
              JPG/PNG/WebP, 권장 16:9, 최대 10MB.
            </p>
          </div>
        </div>
      </div>

      {message && (
        <p
          className={`text-xs ${
            message.kind === 'error'
              ? 'text-red-500'
              : message.kind === 'ok'
                ? 'text-teal'
                : 'text-navy/60'
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
