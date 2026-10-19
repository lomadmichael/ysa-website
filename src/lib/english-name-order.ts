/**
 * 영문명 순서 판별 (순수 함수).
 *
 * 자격증 카드에는 "이름 먼저, 성은 마지막"(예: SUNGAE KIM)으로 인쇄된다.
 * 신청자가 "성 먼저"(예: KIM SUNG AE)로 적었는지 한글 이름의 성과 대조해 추정한다.
 * 결과는 화면 경고용일 뿐, 제출을 막는 데 쓰지 않는다(외국인·예외 이름 존재).
 *
 * ⚠️ cert-manager `src/lib/english-name-order.ts` 와 내용 동일하게 유지할 것.
 */

/** 한글 성 → 흔한 로마자 표기 후보 (소문자) */
export const SURNAME_ROMANIZATIONS: Readonly<Record<string, readonly string[]>> = {
  김: ["kim", "gim"],
  이: ["lee", "yi", "rhee", "ri", "lie"],
  박: ["park", "pak", "bak"],
  최: ["choi", "choe"],
  정: ["jung", "jeong", "chung", "jeung"],
  강: ["kang", "gang"],
  조: ["cho", "jo", "joe"],
  윤: ["yoon", "yun"],
  장: ["jang", "chang"],
  임: ["lim", "im"],
  한: ["han"],
  오: ["oh", "o"],
  서: ["seo", "suh"],
  신: ["shin", "sin"],
  권: ["kwon", "gwon"],
  황: ["hwang"],
  안: ["ahn", "an"],
  송: ["song"],
  전: ["jeon", "jun", "chun"],
  홍: ["hong"],
  유: ["yoo", "yu", "you", "ryu"],
  고: ["ko", "go"],
  문: ["moon", "mun"],
  양: ["yang"],
  손: ["son", "sohn"],
  배: ["bae"],
  백: ["baek", "paik", "back"],
  허: ["heo", "huh"],
  남: ["nam"],
  노: ["noh", "no", "roh"],
  하: ["ha"],
  곽: ["kwak"],
  성: ["sung", "seong"],
  차: ["cha"],
  주: ["joo", "ju"],
  우: ["woo", "wu"],
  구: ["koo", "gu", "ku"],
  민: ["min"],
  진: ["jin"],
  나: ["na"],
  지: ["ji", "jee"],
  엄: ["um", "eom"],
  채: ["chae"],
  원: ["won"],
  천: ["cheon", "chun"],
  방: ["bang"],
  공: ["kong", "gong"],
  현: ["hyun", "hyeon"],
  함: ["ham"],
  변: ["byun", "byeon"],
  염: ["yeom"],
  여: ["yeo"],
  추: ["choo", "chu"],
  도: ["do", "doh"],
  소: ["so"],
  석: ["seok"],
  선: ["sun", "seon"],
  설: ["seol", "sul"],
  마: ["ma"],
  길: ["gil", "kil"],
  표: ["pyo"],
  명: ["myung", "myeong"],
  기: ["ki", "gi"],
  반: ["ban"],
  왕: ["wang"],
  금: ["geum", "keum"],
  옥: ["ok"],
  육: ["yook", "yuk"],
  인: ["in"],
  맹: ["maeng"],
  제: ["je"],
  모: ["mo"],
  탁: ["tak"],
  국: ["kook", "guk"],
  심: ["sim", "shim"],
  용: ["yong"],
};

/** 단어 구분자: 공백·마침표·쉼표·밑줄·하이픈 */
const SEPARATORS = /[\s.,_-]+/;

/** 띄어쓰기 없는 한 단어를 "이름+성 붙여 씀"으로 볼 최소 길이 (입력 도중 깜빡임 방지) */
const NO_SPACE_MIN_LENGTH = 4;

export type EnglishNameOrderResult = "ok" | "surname_first" | "no_space";

function splitWords(nameEn: string): string[] {
  return nameEn.split(SEPARATORS).filter(Boolean);
}

/**
 * 영문명 순서 판별.
 * - surname_first: 한글 성의 로마자 후보가 첫 단어와 같고 마지막 단어와는 다름
 * - no_space: 단어가 하나뿐(띄어쓰기 없음)
 * - ok: 그 외(빈값·판별 불가 포함)
 */
export function checkEnglishNameOrder(
  nameKo: string,
  nameEn: string,
): EnglishNameOrderResult {
  const words = splitWords(nameEn.trim());
  if (words.length === 0) return "ok";
  if (words.length === 1) {
    return words[0].length >= NO_SPACE_MIN_LENGTH ? "no_space" : "ok";
  }

  const surname = nameKo.trim().charAt(0);
  const candidates = SURNAME_ROMANIZATIONS[surname];
  if (!candidates) return "ok";

  const first = words[0].toLowerCase();
  const last = words[words.length - 1].toLowerCase();
  if (candidates.includes(first) && !candidates.includes(last)) {
    return "surname_first";
  }
  return "ok";
}

/**
 * 첫 단어를 맨 뒤로 옮긴다. 대소문자는 그대로 둔다.
 * "KIM SUNG AE" → "SUNG AE KIM", "Lee jieseung" → "jieseung Lee"
 */
export function moveFirstWordToEnd(nameEn: string): string {
  const trimmed = nameEn.trim();
  const m = trimmed.match(/^([^\s.,_-]+)[\s.,_-]+([\s\S]*)$/);
  if (!m || !m[2].trim()) return trimmed;
  return `${m[2].trim()} ${m[1]}`;
}
