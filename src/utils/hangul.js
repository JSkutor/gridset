const CHO_SUNG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

const JUNG_SUNG = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'
];

const JONG_SUNG = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

/**
 * 한글 문자열을 초성, 중성, 종성 단위로 풀어줍니다.
 * 예: "풀업" -> "ㅍㅜㄹㅇㅓㅂ"
 */
export function disassembleHangul(str) {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const offset = code - 0xAC00;
      const cho = Math.floor(offset / (21 * 28));
      const jung = Math.floor((offset % (21 * 28)) / 28);
      const jong = offset % 28;
      result += CHO_SUNG[cho] + JUNG_SUNG[jung] + JONG_SUNG[jong];
    } else {
      result += str[i];
    }
  }
  return result;
}

/**
 * 문자열에서 한글 초성만 추출합니다.
 * 예: "풀업" -> "ㅍㅇ", "벤치프레스" -> "ㅂㅊㅍㄹㅅ"
 */
export function extractChosung(str) {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const offset = code - 0xAC00;
      const cho = Math.floor(offset / (21 * 28));
      result += CHO_SUNG[cho];
    } else if (CHO_SUNG.includes(str[i])) {
      result += str[i];
    } else {
      result += str[i];
    }
  }
  return result;
}

/**
 * 문자열이 오직 한글 초성(자음)으로만 이루어졌는지 확인합니다.
 * 예: "ㅍㅇ" -> true, "풀" -> false
 */
export function isChosungOnly(str) {
  const chosungSet = new Set(CHO_SUNG);
  const clean = str.replace(/\s/g, '');
  if (!clean) return false;
  return [...clean].every(char => chosungSet.has(char));
}

/**
 * 대상 텍스트(target)에 검색어(query)가 초성 혹은 자소 분리 수준에서 매칭되는지 확인합니다.
 * 대소문자 및 공백은 무시합니다.
 */
export function matchHangul(target, query) {
  const cleanTarget = target.toLowerCase().replace(/\s/g, '');
  const cleanQuery = query.toLowerCase().replace(/\s/g, '');

  if (!cleanQuery) return true;

  // 1. 검색어가 초성(자음)으로만 이루어진 경우 -> 초성 검색 수행
  if (isChosungOnly(cleanQuery)) {
    const targetChosung = extractChosung(cleanTarget);
    return targetChosung.includes(cleanQuery);
  }

  // 2. 그렇지 않은 경우 -> 자소 분리 정밀 매칭 수행 (입력 중간 조합 매칭)
  const targetDisassembled = disassembleHangul(cleanTarget);
  const queryDisassembled = disassembleHangul(cleanQuery);
  return targetDisassembled.includes(queryDisassembled);
}
