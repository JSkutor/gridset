// exerciseDictionary.ts에 의존하지 않는 순수 유틸리티.
// 이 파일은 메인 번들에 포함된다.
// exerciseDictionary.ts(17k줄)와 dummyGenerator.ts는 이 파일과 분리된 lazy 청크에 있다.

export const generateUUID = () => crypto.randomUUID();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function rotateLeft(value: number, bits: number) {
  return (value << bits) | (value >>> (32 - bits));
}

function sha1Bytes(input: string) {
  const message = [...new TextEncoder().encode(input)];
  const bitLength = message.length * 8;
  message.push(0x80);

  while ((message.length % 64) !== 56) {
    message.push(0);
  }

  for (let shift = 56; shift >= 0; shift -= 8) {
    message.push((bitLength / (2 ** shift)) & 0xff);
  }

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  for (let offset = 0; offset < message.length; offset += 64) {
    const words = new Array(80).fill(0);

    for (let i = 0; i < 16; i += 1) {
      const index = offset + i * 4;
      words[i] = (
        (message[index] << 24) |
        (message[index + 1] << 16) |
        (message[index + 2] << 8) |
        message[index + 3]
      ) >>> 0;
    }

    for (let i = 16; i < 80; i += 1) {
      words[i] = rotateLeft(words[i - 3] ^ words[i - 8] ^ words[i - 14] ^ words[i - 16], 1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let i = 0; i < 80; i += 1) {
      let f;
      let k;

      if (i < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }

      const temp = (rotateLeft(a, 5) + f + e + k + words[i]) >>> 0;
      e = d;
      d = c;
      c = rotateLeft(b, 30) >>> 0;
      b = a;
      a = temp;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }

  return [h0, h1, h2, h3, h4].flatMap((word) => [
    (word >>> 24) & 0xff,
    (word >>> 16) & 0xff,
    (word >>> 8) & 0xff,
    word & 0xff,
  ]);
}

function uuidFromExerciseSeed(seed: string) {
  const bytes = sha1Bytes(`gridset-exercise:${seed}`).slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const getExerciseCatalogId = (id: string) =>
  UUID_REGEX.test(id) ? id : uuidFromExerciseSeed(id);

export const EXERCISE_UNIT_OVERRIDES_BY_NAME: Record<string, string> = {
  '푸시업': 'reps',
  '데드버그': 'reps',
  '힙 브릿지': 'reps',
  '사이드 플랭크': 'sec',
  '밴드 풀 어파트': 'reps',
  '마운틴 클라이머': 'reps',
  '인버티드 로우': 'reps',
  '사이드 레그 레이즈': 'reps',
};

export const EXERCISE_UNIT_OVERRIDES = new Map(
  Object.entries(EXERCISE_UNIT_OVERRIDES_BY_NAME),
);

export const getFallbackExerciseUnit = (name: string) =>
  EXERCISE_UNIT_OVERRIDES.get(name) || 'kg';
