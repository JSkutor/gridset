import { EXERCISE_DICTIONARY } from '../data/exerciseDictionary.js';
import { disassembleHangul, extractChosung, isChosungOnly, matchHangul } from './hangul.js';

type SearchableExercise = {
  id: string;
  name: string;
  englishName?: string | null;
  english_name?: string | null;
  synonyms?: readonly string[] | null;
};

const DEFAULT_EXERCISES = EXERCISE_DICTIONARY as readonly SearchableExercise[];

export function getExerciseSuggestions<T extends SearchableExercise>(
  query: string,
  exercises: readonly T[] = DEFAULT_EXERCISES as unknown as readonly T[],
  limit = 8,
): T[] {
  if (!query.trim()) return [];

  const q = query.trim().toLowerCase();
  const qChosung = isChosungOnly(q) ? q : '';
  const qDisassembled = disassembleHangul(q);

  return exercises
    .filter((exercise) => {
      const englishName = exercise.englishName || exercise.english_name || '';
      if (matchHangul(exercise.name, query)) return true;
      if (englishName && matchHangul(englishName, query)) return true;
      if (exercise.synonyms?.some((syn) => matchHangul(syn, query))) return true;
      return false;
    })
    .map((exercise) => {
      const name = exercise.name.toLowerCase();
      const englishName = exercise.englishName || exercise.english_name || '';
      const engName = englishName ? englishName.toLowerCase() : '';
      const nameDisassembled = disassembleHangul(name);
      let score = 0;

      if (name === q) {
        score += 2000;
      } else if (engName === q) {
        score += 1800;
      }

      if (nameDisassembled.startsWith(qDisassembled)) {
        score += 1000;
      } else if (nameDisassembled.includes(qDisassembled)) {
        score += 500;
      }

      if (qChosung) {
        const nameChosung = extractChosung(name);
        if (nameChosung.startsWith(qChosung)) {
          score += 800;
        } else if (nameChosung.includes(qChosung)) {
          score += 400;
        }
      }

      if (engName) {
        if (engName.startsWith(q)) {
          score += 600;
        } else if (engName.includes(q)) {
          score += 300;
        }
      }

      const synonyms = exercise.synonyms ?? [];
      if (synonyms.length > 0) {
        for (const syn of synonyms) {
          const synLower = syn.toLowerCase();
          const synDisassembled = disassembleHangul(synLower);

          if (synLower === q) {
            score += 300;
            break;
          }

          if (synDisassembled.startsWith(qDisassembled)) {
            score += 150;
            break;
          }

          if (synDisassembled.includes(qDisassembled)) {
            score += 50;
            break;
          }
        }
      }

      return { exercise, score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.exercise.name.length !== b.exercise.name.length) {
        return a.exercise.name.length - b.exercise.name.length;
      }
      return a.exercise.name.localeCompare(b.exercise.name, 'ko');
    })
    .slice(0, limit)
    .map(({ exercise }) => exercise);
}
