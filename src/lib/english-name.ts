/**
 * 영문명 이름/성 2칸 입력용 순수 함수.
 *
 * 저장 형식은 기존 단일 필드 그대로: "<이름> <성>" 대문자, 공백 1개 (예: "GILDONG HONG").
 * 자격증 카드에 이 순서로 인쇄된다.
 *
 * ⚠️ ysa-website / cert-manager 의 `src/lib/english-name.ts` 는 내용 동일하게 유지할 것.
 */

/** 대문자화 + 앞뒤 공백 제거 + 연속 공백 1개로. 그 외 문자는 지우지 않는다. */
export function normalizeEnPart(s: string): string {
  return s.toUpperCase().trim().replace(/\s+/g, " ");
}

/** 이름 + 성 → "GILDONG HONG". 한쪽만 있으면 그쪽만. */
export function joinEnglishName(given: string, family: string): string {
  return `${normalizeEnPart(given)} ${normalizeEnPart(family)}`.trim();
}

/**
 * "GILDONG HONG" → { given: "GILDONG", family: "HONG" }.
 * 마지막 단어 = 성, 나머지 = 이름. 단어가 1개면 이름에만 넣는다.
 * 공백·마침표·쉼표·밑줄을 단어 구분자로 본다.
 */
export function splitEnglishName(full: string): { given: string; family: string } {
  const words = normalizeEnPart(full.replace(/[.,_]+/g, " "))
    .split(" ")
    .filter(Boolean);
  if (words.length === 0) return { given: "", family: "" };
  if (words.length === 1) return { given: words[0], family: "" };
  return {
    given: words.slice(0, -1).join(" "),
    family: words[words.length - 1],
  };
}
