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

  // Strip is_unilateral for comparison since JSON is intentionally not updated
  const cleanDict = EXERCISE_DICTIONARY.map(stripRuntimeFields);
  const cleanExtracted = extractedExercises.map(stripRuntimeFields);

  assert.deepEqual(cleanDict, cleanExtracted);
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
