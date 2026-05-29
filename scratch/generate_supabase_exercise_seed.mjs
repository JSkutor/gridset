import crypto from 'node:crypto';
import fs from 'node:fs';
import { DEFAULT_EXERCISES, DEFAULT_EXERCISE_IDS } from '../src/data/dummyGenerator.js';
import { EXERCISE_DICTIONARY } from '../src/data/exerciseDictionary.js';

function uuidFromSeed(seed) {
  const bytes = [
    ...crypto.createHash('sha1').update(`gridset-exercise:${seed}`).digest().subarray(0, 16),
  ];
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function sqlString(value) {
  if (value === null || value === undefined) return 'null';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlArray(values = []) {
  return `ARRAY[${values.map(sqlString).join(', ')}]::text[]`;
}

const masterByName = new Map();

DEFAULT_EXERCISES.forEach((exercise) => {
  masterByName.set(exercise.name.toLowerCase(), {
    id: exercise.id,
    name: exercise.name,
    englishName: exercise.englishName || null,
    primaryMuscle: exercise.primary_muscle,
    secondaryMuscles: exercise.secondaryMuscles || [],
    equipment: exercise.equipment || '기타',
    category: exercise.category || 'strength',
    unit: exercise.unit || 'kg',
    is_unilateral: exercise.is_unilateral ?? false,
    synonyms: exercise.synonyms || [],
  });
});

EXERCISE_DICTIONARY.forEach((exercise) => {
  const existing = masterByName.get(exercise.name.toLowerCase());
  masterByName.set(exercise.name.toLowerCase(), {
    id: existing?.id || DEFAULT_EXERCISE_IDS[exercise.name] || uuidFromSeed(exercise.id),
    name: exercise.name,
    englishName: exercise.englishName,
    primaryMuscle: exercise.primaryMuscle,
    secondaryMuscles: exercise.secondaryMuscles || [],
    equipment: exercise.equipment || '기타',
    category: exercise.category || 'strength',
    unit: exercise.unit || 'kg',
    is_unilateral: exercise.is_unilateral ?? false,
    synonyms: exercise.synonyms || [],
  });
});

const masterExercises = [...masterByName.values()]
  .sort((a, b) => a.name.localeCompare(b.name, 'ko'));

const rows = masterExercises.map((exercise) => (
  `  (${sqlString(exercise.id)}, ${sqlString(exercise.name)}, ${sqlString(exercise.englishName)}, ${sqlString(exercise.primaryMuscle)}, ${sqlArray(exercise.secondaryMuscles)}, ${sqlString(exercise.equipment || '기타')}, ${sqlString(exercise.category || 'strength')}, ${sqlString(exercise.unit || 'kg')}, ${exercise.is_unilateral ? 'true' : 'false'}, ${sqlArray(exercise.synonyms)}, null)`
)).join(',\n');

const seedSql = `-- Run this once in the Supabase SQL Editor after the tables exist.
-- These public exercise rows are the canonical exercise master used by the app.

INSERT INTO public.exercises (
  id,
  name,
  english_name,
  primary_muscle,
  secondary_muscles,
  equipment,
  category,
  unit,
  is_unilateral,
  synonyms,
  user_id
) VALUES
${rows}
ON CONFLICT (id) DO UPDATE SET
  name = excluded.name,
  english_name = excluded.english_name,
  primary_muscle = excluded.primary_muscle,
  secondary_muscles = excluded.secondary_muscles,
  equipment = excluded.equipment,
  category = excluded.category,
  unit = excluded.unit,
  is_unilateral = excluded.is_unilateral,
  synonyms = excluded.synonyms,
  user_id = null,
  updated_at = timezone('utc'::text, now());
`;

fs.writeFileSync('scratch/supabase_seed_default_exercises.sql', seedSql);

const schemaPath = 'scratch/supabase_schema.sql';
const schema = fs.readFileSync(schemaPath, 'utf8');
let start = schema.indexOf('-- ----------------------------------------------------\n-- Public Exercise Master');
if (start === -1) {
  start = schema.indexOf('-- ----------------------------------------------------\n-- Public Default Exercises');
}
const end = schema.indexOf('-- ----------------------------------------------------\n-- API Grants');
if (start === -1 || end === -1 || end <= start) {
  throw new Error('Could not find seed section in schema');
}

const schemaSeed = `-- ----------------------------------------------------
-- Public Exercise Master
-- ----------------------------------------------------
-- These rows are shared by every user and are referenced by templates and workout logs.
${seedSql}
`;

fs.writeFileSync(schemaPath, schema.slice(0, start) + schemaSeed + schema.slice(end));
console.log(`generated rows: ${masterExercises.length}`);
