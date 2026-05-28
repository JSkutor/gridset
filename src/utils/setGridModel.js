const NUMERIC_RE = /^[0-9.]*$/;
const DEFAULT_REST_BETWEEN_SETS = 90;
const DEFAULT_REST_AFTER_EXERCISE = 120;

export function isNumericGridValue(value) {
  return NUMERIC_RE.test(value);
}

export function isCommittedNumericGridValue(value) {
  const normalizedValue = String(value ?? '').trim();
  return normalizedValue !== '' && isNumericGridValue(normalizedValue) && Number.isFinite(Number(normalizedValue));
}

export function isCompletedRepsValue(value) {
  return isCommittedNumericGridValue(value);
}

export function fillExerciseWeightsFromFirstSet(blocks, blockIndex, rowIndex, weight) {
  const normalizedWeight = String(weight ?? '').trim();

  if (rowIndex !== 0 || !isCommittedNumericGridValue(normalizedWeight)) {
    return blocks;
  }

  return blocks.map((block, currentBlockIndex) => {
    if (currentBlockIndex !== blockIndex) return block;

    return {
      ...block,
      sets: block.sets.map((set, setIndex) => {
        const hasWeight = String(set.weight ?? '').trim() !== '';
        if (setIndex !== rowIndex && hasWeight) return set;
        return { ...set, weight: normalizedWeight };
      }),
    };
  });
}

/**
 * Build the set-entry blocks rendered by SetGrid from the current session
 * template. The id factory is injectable so tests can stay deterministic.
 */
export function buildInitialBlocks(session, sessionExercises, exercises, createSetId = () => crypto.randomUUID()) {
  if (!session) return [];

  return sessionExercises
    .filter((se) => se.session_id === session.id)
    .sort((a, b) => a.order - b.order)
    .map((se) => {
      const exercise = exercises.find((ex) => ex.id === se.exercise_id);
      const targetSets = se.target_sets || 3;
      const isUnilateral = exercise?.is_unilateral ?? false;

      const sets = isUnilateral
        ? Array.from({ length: targetSets }, (_, i) => [
          {
            id: createSetId(),
            set_number: i + 1,
            side: 'L',
            weight: '',
            reps: '',
            memo: '',
          },
          {
            id: createSetId(),
            set_number: i + 1,
            side: 'R',
            weight: '',
            reps: '',
            memo: '',
          }
        ]).flat()
        : Array.from({ length: targetSets }, (_, i) => ({
          id: createSetId(),
          set_number: i + 1,
          side: 'both',
          weight: '',
          reps: '',
          memo: '',
        }));

      return {
        id: se.id,
        exercise_id: se.exercise_id,
        exercise_name: exercise?.name ?? 'Unknown Exercise',
        is_unilateral: isUnilateral,
        sets,
      };
    });
}

export function flattenBlocks(blocks) {
  const rows = [];

  blocks.forEach((block, blockIndex) => {
    block.sets.forEach((set, rowIndex) => {
      rows.push({
        ...set,
        blockIndex,
        rowIndex,
        globalIndex: rows.length,
        isLastSet: rowIndex === block.sets.length - 1,
        exerciseId: block.exercise_id,
      });
    });
  });

  return rows;
}

export function computeNewGlobalIndex(blocks, blockIndex) {
  let idx = 0;

  for (let i = 0; i < blockIndex; i += 1) {
    idx += blocks[i].sets.length;
  }

  return idx + blocks[blockIndex].sets.length;
}

export function getSetCompletionKey(block, set) {
  if (!block || !set) return '';
  return `${block.id}:${set.set_number}:${set.side || 'both'}`;
}

function normalizeRestDuration(value, fallbackSeconds) {
  const seconds = Number(value ?? fallbackSeconds);
  if (!Number.isFinite(seconds)) return fallbackSeconds;
  return Math.max(0, Math.round(seconds));
}

export function getRestTimerPayloadForCompletedSet({ blocks, sessionExercises, blockIndex, rowIndex }) {
  const block = blocks[blockIndex];
  const set = block?.sets?.[rowIndex];

  if (!block || !set) return null;

  const setNumber = Number(set.set_number) || 0;
  const isFinalSideForSet = !block.sets.some(
    (candidate, index) => index > rowIndex && Number(candidate.set_number) === setNumber,
  );

  if (!isFinalSideForSet) return null;

  const link = sessionExercises.find((sessionExercise) => sessionExercise.id === block.id);
  const hasLaterSetInExercise = block.sets.some((candidate) => Number(candidate.set_number) > setNumber);

  if (hasLaterSetInExercise) {
    const durationSeconds = normalizeRestDuration(link?.rest_between_sets, DEFAULT_REST_BETWEEN_SETS);

    if (durationSeconds <= 0) return null;

    return {
      mode: 'set',
      durationSeconds,
      exerciseId: block.exercise_id,
      exerciseName: block.exercise_name,
      setNumber,
    };
  }

  const nextBlock = blocks[blockIndex + 1];
  if (!nextBlock) return null;

  const durationSeconds = normalizeRestDuration(link?.rest_after_exercise, DEFAULT_REST_AFTER_EXERCISE);

  if (durationSeconds <= 0) return null;

  return {
    mode: 'exercise',
    durationSeconds,
    exerciseId: block.exercise_id,
    exerciseName: block.exercise_name,
    nextExerciseId: nextBlock.exercise_id,
    nextExerciseName: nextBlock.exercise_name,
    setNumber,
  };
}
