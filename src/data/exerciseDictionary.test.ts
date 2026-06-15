// @ts-nocheck
// @vitest-environment node
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { EXERCISE_DICTIONARY } from './exerciseDictionary.js';
import { MUSCLE_GROUPS } from './muscleGroups.js';

function stripRuntimeFields(exercise) {
  const result = { ...exercise };
  delete result.is_unilateral;
  return result;
}

test('exercise dictionary stays in sync with extracted exercise data', () => {
  const jsonPath = path.resolve(import.meta.dirname, '../../scratch/extracted_exercises.json');
  let extractedExercises = JSON.parse(
    fs.readFileSync(jsonPath, 'utf8'),
  );

  // Filter out warning note in JSON
  extractedExercises = extractedExercises.filter(item => !item.NOTE);

  // Strip runtime-only fields before comparison.
  const cleanDict = EXERCISE_DICTIONARY.map(stripRuntimeFields);
  const cleanExtracted = extractedExercises.map(stripRuntimeFields);

  assert.equal(
    cleanDict.length,
    cleanExtracted.length,
    `exercise count mismatch: dictionary=${cleanDict.length}, extracted=${cleanExtracted.length}`,
  );

  const dictIds = cleanDict.map((exercise) => exercise.id);
  const extractedIds = cleanExtracted.map((exercise) => exercise.id);
  const dictIdSet = new Set(dictIds);
  const extractedIdSet = new Set(extractedIds);
  const onlyInDictionary = dictIds.filter((id) => !extractedIdSet.has(id));
  const onlyInExtracted = extractedIds.filter((id) => !dictIdSet.has(id));
  const orderMismatches = dictIds
    .map((id, index) => (id === extractedIds[index] ? null : {
      index,
      dictionary: id,
      extracted: extractedIds[index],
    }))
    .filter(Boolean)
    .slice(0, 10);

  assert.deepEqual({ onlyInDictionary, onlyInExtracted, orderMismatches }, {
    onlyInDictionary: [],
    onlyInExtracted: [],
    orderMismatches: [],
  });

  cleanDict.forEach((exercise, index) => {
    assert.deepEqual(exercise, cleanExtracted[index], `exercise mismatch at index ${index}: ${exercise.id}`);
  });
});

test('exercise dictionary uses normalized muscle labels', () => {
  const allowedMuscles = new Set(MUSCLE_GROUPS);
  const invalidLabels = [];
  const duplicatedPrimaryMuscles = [];

  EXERCISE_DICTIONARY.forEach((exercise) => {
    if (!allowedMuscles.has(exercise.primaryMuscle)) {
      invalidLabels.push(`${exercise.id}: primary=${exercise.primaryMuscle}`);
    }

    exercise.secondaryMuscles.forEach((muscle) => {
      if (!allowedMuscles.has(muscle)) {
        invalidLabels.push(`${exercise.id}: secondary=${muscle}`);
      }
    });

    if (exercise.secondaryMuscles.includes(exercise.primaryMuscle)) {
      duplicatedPrimaryMuscles.push(exercise.id);
    }
  });

  assert.deepEqual(invalidLabels, []);
  assert.deepEqual(duplicatedPrimaryMuscles, []);
});
