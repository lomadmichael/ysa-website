'use client';

import { useEffect, useRef } from 'react';

interface KakaoMapProps {
  /** 카카오맵 "지도퍼가기"에서 받은 key 값 */
  mapKey: string;
  /** 카카오맵 "지도퍼가기"에서 받은 timestamp 값 */
  timestamp: string;
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

// 카카오 Lander 스크립트 직접 URL (loader가 document.write로 주입하는 스크립트와 동일)
const LANDER_SRC =
  'https://t1.kakaocdn.net/kakaomapweb/roughmap/place/prod/207038f2_1774248312945/roughmapLander.js';

/**
 * 카카오맵 "지도퍼가기" 임베드 (API 키 불필요)
 *
 * 카카오 공식 loader는 document.write()로 Lander를 주입해 SPA에서는 동작하지 않습니다.
 * 이 컴포넌트는 Lander 스크립트를 직접 로드해서 우회합니다.
 */
export default function KakaoMap({
  mapKey,
  timestamp,
  height = '400',
}: KakaoMapProps) {
  const containerId = `daumRoughmapContainer${timestamp}`;
  const rendered = useRef(false);

  useEffect(() => {
    if (rendered.current) return;

    let cancelled = false;
    let attempts = 0;

    // roughmap 기본 객체 초기화 (Lander 스크립트가 참조함)
    // 데이터 JSON 로드 경로: https://t1.kakaocdn.net/roughmap/{key}.json
    if (typeof window.daum === 'undefined') {
      window.daum = {};
    }
    if (typeof window.daum.roughmap === 'undefined') {
      window.daum.roughmap = {
        phase: 'prod',
        cdn: '207038f2_1774248312945',
        URL_KEY_DATA_LOAD_PRE: 'https://t1.kakaocdn.net/roughmap/',
        url_protocal: 'https:',
        url_cdn_domain: 't1.kakaocdn.net',
      };
    }

    const tryRender = () => {
      if (cancelled || rendered.current) return;

      const container = document.getElementById(containerId);
      const Lander = window.daum?.roughmap?.Lander;

      if (container && Lander) {
        try {
          new Lander({
            timestamp,
            key: mapKey,
            mapWidth: '640',
            mapHeight: height,
          }).render();
          rendered.current = true;
          return;
        } catch (e) {
          console.warn('[KakaoMap] render error:', e);
        }
      }

      if (++attempts < 100) {
        setTimeout(tryRender, 100);
      } else {
        console.warn('[KakaoMap] Lander failed to load after 10s');
      }
    };

    // Lander 스크립트 직접 로드
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${LANDER_SRC}"]`,
    );

    if (!existing) {
      const script = document.createElement('script');
      script.src = LANDER_SRC;
      script.charset = 'UTF-8';
      script.async = true;
      script.onload = tryRender;
      document.head.appendChild(script);
    } else {
      // 이미 로드된 경우 바로 시도
      tryRender();
    }

    return () => {
      cancelled = true;
    };
  }, [mapKey, timestamp, height, containerId]);

  return (
    <div
      id={containerId}
      className="root_daum_roughmap root_daum_roughmap_landing"
      style={{ width: '100%', minHeight: `${height}px` }}
    />
  );
}
