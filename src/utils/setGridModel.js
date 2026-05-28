const NUMERIC_RE = /^[0-9.]*$/;

export function isNumericGridValue(value) {
  return NUMERIC_RE.test(value);
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

      return {
        id: se.id,
        exercise_id: se.exercise_id,
        exercise_name: exercise?.name ?? 'Unknown Exercise',
        sets: Array.from({ length: targetSets }, (_, i) => ({
          id: createSetId(),
          set_number: i + 1,
          weight: '',
          reps: '',
        })),
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
