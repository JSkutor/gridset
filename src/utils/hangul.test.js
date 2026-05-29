import { test, describe } from 'vitest';
import assert from 'node:assert/strict';
import { disassembleHangul, extractChosung, isChosungOnly, matchHangul } from './hangul.js';

describe('hangul: Hangul Jamo Disassembly & Matching', () => {
  test('disassembleHangul expands Korean syllables into jamo', () => {
    assert.equal(disassembleHangul('풀업'), 'ㅍㅜㄹㅇㅓㅂ');
    assert.equal(disassembleHangul('OHP'), 'OHP');
  });

  test('extractChosung keeps searchable initial consonants', () => {
    assert.equal(extractChosung('벤치프레스'), 'ㅂㅊㅍㄹㅅ');
    assert.equal(extractChosung('풀업'), 'ㅍㅇ');
  });

  test('isChosungOnly detects initial-consonant queries', () => {
    assert.equal(isChosungOnly('ㅍㅇ'), true);
    assert.equal(isChosungOnly('풀'), false);
    assert.equal(isChosungOnly(''), false);
  });

  test('matchHangul supports chosung and partial-composition search', () => {
    assert.equal(matchHangul('벤치프레스', 'ㅂㅊ'), true);
    assert.equal(matchHangul('풀업', '푸'), true);
    assert.equal(matchHangul('Overhead Press', 'over'), true);
    assert.equal(matchHangul('스쿼트', '벤치'), false);
  });
});
