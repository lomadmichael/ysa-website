'use client';

import { useEffect, useRef } from 'react';

interface KakaoMapProps {
  /** 카카오맵 "지도퍼가기"에서 받은 key 값 */
  mapKey: string;
  /** 카카오맵 "지도퍼가기"에서 받은 timestamp 값 */
  timestamp: string;
  /** 지도 너비 (px, 기본 1200) */
  width?: string;
  /** 지도 높이 (px) */
  height?: string;
}

interface DaumLanderCtor {
  new (config: {
    timestamp: string;
    key: string;
    mapWidth: string;
    mapHeight: string;
  }): { render: () => void };
}

declare global {
  interface Window {
    daum?: {
      roughmap?: {
        Lander?: DaumLanderCtor;
      } & Record<string, unknown>;
    };
  }
}

const LOADER_SRC = 'https://ssl.daumcdn.net/dmaps/map_js_init/roughmapLoader.js';
const LANDER_SRC =
  'https://t1.kakaocdn.net/kakaomapweb/roughmap/place/prod/207038f2_1774248312945/roughmapLander.js';

/**
 * 카카오맵 "지도퍼가기" 임베드 (API 키 불필요)
 *
 * 카카오 공식 loader는 document.write()로 Lander를 주입해 SPA에서는 Lander가 로드되지 않지만,
 * 로더의 설정 부분(프로토콜 감지, URL 설정)은 정상 실행됩니다.
 * 그래서 loader를 먼저 로드한 후 Lander를 직접 로드하면 Mixed Content 문제 없이 동작합니다.
 */
export default function KakaoMap({
  mapKey,
  timestamp,
  width = '1200',
  height = '400',
}: KakaoMapProps) {
  const containerId = `daumRoughmapContainer${timestamp}`;
  const rendered = useRef(false);

  useEffect(() => {
    if (rendered.current) return;

    let cancelled = false;

    const tryRender = () => {
      if (cancelled || rendered.current) return;

      const container = document.getElementById(containerId);
      const Lander = window.daum?.roughmap?.Lander;

      if (container && Lander) {
        try {
          new Lander({
            timestamp,
            key: mapKey,
            mapWidth: width,
            mapHeight: height,
          }).render();
          rendered.current = true;
        } catch (e) {
          console.warn('[KakaoMap] render error:', e);
        }
      }
    };

    // 폴링: Lander 로드 대기
    const pollForLander = () => {
      let attempts = 0;
      const interval = setInterval(() => {
        if (cancelled || rendered.current || attempts > 100) {
          clearInterval(interval);
          return;
        }
        attempts++;
        if (window.daum?.roughmap?.Lander) {
          clearInterval(interval);
          tryRender();
        }
      }, 100);
    };

    // 스크립트 로드 헬퍼
    const loadScript = (src: string): Promise<void> =>
      new Promise((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
        if (existing) {
          if (existing.dataset.loaded === 'true') {
            resolve();
          } else {
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', () => reject());
          }
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.charset = 'UTF-8';
        script.async = true;
        script.onload = () => {
          script.dataset.loaded = 'true';
          resolve();
        };
        script.onerror = () => reject();
        document.head.appendChild(script);
      });

    // 1. Loader 먼저 로드 (프로토콜/URL 설정)
    // 2. Lander 직접 로드 (loader의 document.write는 SPA에서 실패)
    // 3. Lander가 로드되면 render 호출
    (async () => {
      try {
        await loadScript(LOADER_SRC);
      } catch {
        // 로더 실패해도 계속 진행 (Lander가 기본값으로 동작할 수 있음)
      }
      if (cancelled) return;

      try {
        await loadScript(LANDER_SRC);
      } catch {
        console.warn('[KakaoMap] Failed to load Lander script');
        return;
      }
      if (cancelled) return;

      // Lander가 window에 등록될 때까지 폴링
      pollForLander();
    })();

    return () => {
      cancelled = true;
    };
  }, [mapKey, timestamp, width, height, containerId]);

  return (
    <div className="w-full overflow-hidden flex justify-center bg-foam">
      <div
        id={containerId}
        className="root_daum_roughmap root_daum_roughmap_landing"
        style={{
          width: `${width}px`,
          maxWidth: '100%',
          minHeight: `${height}px`,
        }}
      />
    </div>
  );
}
