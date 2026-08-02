// 다음(카카오) 전역 window.daum 타입 — 사용처가 둘이라 공용 선언으로 통합.
// (declare global 은 파일별로 다르게 선언하면 TS2717 충돌)
// - roughmap: src/components/shared/KakaoMap.tsx (약도 위젯)
// - Postcode: src/components/apply/CompEntryForm.tsx (주소 검색)

interface DaumLanderCtor {
  new (config: {
    timestamp: string;
    key: string;
    mapWidth: string;
    mapHeight: string;
  }): { render: () => void };
}

interface DaumPostcodeData {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
}

interface DaumPostcodeCtor {
  new (opts: {
    oncomplete: (data: DaumPostcodeData) => void;
    width?: string | number;
    height?: string | number;
  }): { embed: (el: HTMLElement) => void };
}

declare global {
  interface Window {
    daum?: {
      roughmap?: {
        Lander?: DaumLanderCtor;
      } & Record<string, unknown>;
      Postcode?: DaumPostcodeCtor;
    };
  }
}

export {};
