import { test, describe } from 'vitest';
import assert from 'node:assert/strict';
import { getExerciseSuggestions } from './exerciseSearch.js';

const fixtures = [
  {
    id: 'bench',
    name: '벤치프레스',
    englishName: 'Bench Press',
    primaryMuscle: '대흉근',
    equipment: '바벨',
    synonyms: ['벤치', 'bench'],
  },
  {
    id: 'pullup',
    name: '풀업',
    englishName: 'Pull Up',
    primaryMuscle: '광배근',
    equipment: '맨몸',
    synonyms: ['턱걸이', 'pull-up'],
  },
  {
    id: 'pushup',
    name: '푸시업',
    englishName: 'Push Up',
    primaryMuscle: '대흉근',
    equipment: '맨몸',
    synonyms: ['팔굽혀펴기'],
  },
  {
    id: 'overhead-press',
    name: '오버헤드 프레스',
    englishName: 'Overhead Press',
    primaryMuscle: '삼각근',
    equipment: '바벨',
    synonyms: ['ohp'],
  },
];

describe('exerciseSearch: Exercise Search & Suggestions', () => {
  test('ranks exact Korean names first', () => {
    const suggestions = getExerciseSuggestions('풀업', fixtures);

    assert.equal(suggestions[0].id, 'pullup');
  });

  test('supports chosung search', () => {
    const suggestions = getExerciseSuggestions('ㅂㅊ', fixtures);

    assert.deepEqual(suggestions.map((exercise) => exercise.id), ['bench']);
  });

  test('supports synonyms and English aliases', () => {
    assert.equal(getExerciseSuggestions('턱걸이', fixtures)[0].id, 'pullup');
    assert.equal(getExerciseSuggestions('ohp', fixtures)[0].id, 'overhead-press');
  });

  test('respects the result limit', () => {
    const suggestions = getExerciseSuggestions('p', fixtures, 2);

    assert.equal(suggestions.length, 2);
  });

  test('returns no results for empty queries', () => {
    assert.deepEqual(getExerciseSuggestions('   ', fixtures), []);
  });

  test('supports Supabase snake_case exercise rows', () => {
    const suggestions = getExerciseSuggestions('cable', [
      {
        id: 'cable-row',
        name: '케이블 로우',
        english_name: 'Cable Row',
        primary_muscle: '광배근',
        equipment: '케이블',
        synonyms: [],
      },
    ]);

    assert.equal(suggestions[0].id, 'cable-row');
  });
});
