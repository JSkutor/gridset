import extractedExercises from '../../scratch/extracted_exercises.json' with { type: 'json' };

// Runtime exercise master catalog. The source of truth is scratch/extracted_exercises.json.
export const EXERCISE_DICTIONARY = extractedExercises.filter((exercise) => !exercise.NOTE);
