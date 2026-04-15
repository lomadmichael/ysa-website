'use client';

import { useEffect, useState, useCallback } from 'react';
import type { GalleryItem } from '@/lib/database.types';

interface Props {
  items: GalleryItem[];
}

/**
 * 갤러리 그리드 + 라이트박스. 썸네일 클릭 시 모달 열림.
 * 다중 미디어가 있는 항목은 좌/우 화살표로 슬라이드 가능.
 */
export default function GalleryLightbox({ items }: Props) {
  // 열려있는 항목 인덱스(items 배열 기준), null이면 닫힘
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  // 해당 항목의 media_urls 안에서 현재 보고있는 인덱스
  const [mediaIndex, setMediaIndex] = useState(0);

  const openItem = (i: number) => {
    setOpenIndex(i);
    setMediaIndex(0);
  };

  const close = useCallback(() => setOpenIndex(null), []);

  const current = openIndex !== null ? items[openIndex] : null;
  const mediaUrls = current?.media_urls ?? [];
  const hasMulti = mediaUrls.length > 1;

  const next = useCallback(() => {
    if (!hasMulti) return;
    setMediaIndex((i) => (i + 1) % mediaUrls.length);
  }, [hasMulti, mediaUrls.length]);

  const prev = useCallback(() => {
    if (!hasMulti) return;
    setMediaIndex((i) => (i - 1 + mediaUrls.length) % mediaUrls.length);
  }, [hasMulti, mediaUrls.length]);

  // 키보드: ESC 닫기, 좌우 화살표 슬라이드
  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openIndex, close, next, prev]);

  // 모달 열렸을 때 body 스크롤 잠금
  useEffect(() => {
    if (openIndex === null) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [openIndex]);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => openItem(i)}
            className="group text-left"
          >
            <div className="aspect-square rounded-lg overflow-hidden bg-foam mb-2 relative">
              {item.media_urls && item.media_urls.length > 0 ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.media_urls[0]}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {item.media_urls.length > 1 && (
                    <span className="absolute top-2 right-2 bg-navy/70 text-white text-xs px-2 py-0.5 rounded-full">
                      +{item.media_urls.length - 1}
                    </span>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-navy/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                  </svg>
                </div>
              )}
            </div>
            <h3 className="text-sm font-medium text-navy truncate group-hover:text-ocean transition-colors">
              {item.title}
            </h3>
            <p className="text-xs text-navy/40">
              {new Date(item.date).toLocaleDateString('ko-KR')}
            </p>
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      {current && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={current.title}
        >
          {/* 닫기 버튼 */}
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/80 hover:text-white p-2 z-10"
            aria-label="닫기"
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>

          {/* 좌측 화살표 */}
          {hasMulti && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 z-10"
              aria-label="이전"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}

          {/* 컨텐츠 영역 */}
          <div
            className="max-w-5xl max-h-full w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex-1 min-h-0 w-full flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrls[mediaIndex]}
                alt={current.title}
                className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
              />
            </div>

            {/* 캡션 */}
            <div className="mt-4 text-center text-white max-w-2xl">
              <h2 className="text-lg sm:text-xl font-medium">{current.title}</h2>
              <p className="text-xs sm:text-sm text-white/60 mt-1">
                {new Date(current.date).toLocaleDateString('ko-KR')}
                {hasMulti && (
                  <span className="ml-2">
                    · {mediaIndex + 1} / {mediaUrls.length}
                  </span>
                )}
                {current.category && <span className="ml-2">· {current.category}</span>}
              </p>
              {current.description && (
                <p className="text-sm text-white/75 mt-3 leading-relaxed">{current.description}</p>
              )}
            </div>
          </div>

          {/* 우측 화살표 */}
          {hasMulti && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 z-10"
              aria-label="다음"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}
        </div>
      )}
    </>
  );
}
