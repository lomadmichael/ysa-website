"use client";

import {
  checkEnglishNameOrder,
  moveFirstWordToEnd,
} from "@/lib/english-name-order";

/**
 * 영문명 입력란 아래 도움말 + 성/이름 순서 경고.
 * 경고는 표시만 하고 제출은 막지 않는다.
 */
export default function EnglishNameHint({
  nameKo,
  nameEn,
  onChange,
}: {
  nameKo: string;
  nameEn: string;
  onChange: (value: string) => void;
}) {
  const result = checkEnglishNameOrder(nameKo, nameEn);

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-navy/50">
        이름 먼저, 성은 마지막에 적어 주세요. 예) GILDONG HONG — 자격증 카드에
        그대로 인쇄됩니다.
      </p>
      {result === "surname_first" && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800"
        >
          <span>
            성이 앞에 온 것 같아요. 자격증에는 「SUNGAE KIM」처럼 성이 뒤로 가야
            합니다.
          </span>
          <button
            type="button"
            onClick={() => onChange(moveFirstWordToEnd(nameEn))}
            className="rounded-md border border-amber-300 bg-white px-2 py-0.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors"
          >
            순서 바꾸기
          </button>
        </div>
      )}
      {result === "no_space" && (
        <p
          role="status"
          className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800"
        >
          이름과 성 사이를 띄어 주세요. 예) HYUKSUN YOU
        </p>
      )}
    </div>
  );
}
