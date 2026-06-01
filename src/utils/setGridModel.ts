const NUMERIC_RE = /^[0-9.]*$/;
const DEFAULT_REST_BETWEEN_SETS = 90;
const DEFAULT_REST_AFTER_EXERCISE = 120;

type SetGridSession = {
  id: string;
};

type SetGridSessionExercise = {
  id: string;
  session_id: string;
  exercise_id: string;
  order?: number | null;
  target_sets?: number | null;
  rest_between_sets?: number | string | null;
  rest_after_exercise?: number | string | null;
};

type SetGridExercise = {
  id: string;
  name?: string | null;
  is_unilateral?: boolean | null;
};

type SetGridSessionExerciseGroup = {
  id: string;
  session_id?: string | null;
  name?: string | null;
  start_order?: number | null;
  size?: number | null;
  color?: string | null;
};

export type SetGridSet = {
  id: string;
  set_number?: number;
  side?: 'L' | 'R' | 'both';
  weight?: string | number | null;
  reps?: string | number | null;
  memo?: string | null;
  exercise_id?: string;
  exercise_name?: string;
  session_exercise_id?: string;
};

type GroupExerciseInfo = {
  linkId: string;
  exercise_id: string;
  name: string;
  is_unilateral: boolean;
  target_sets: number;
};

export type SetGridBlock = {
  id: string;
  exercise_id?: string;
  exercise_name?: string;
  is_unilateral?: boolean;
  is_group?: boolean;
  group_id?: string;
  group_name?: string | null;
  group_color?: string;
  group_exercises?: GroupExerciseInfo[];
  sets: SetGridSet[];
};

export type FlattenedSetGridRow = SetGridSet & {
  blockIndex: number;
  rowIndex: number;
  globalIndex: number;
  isLastSet: boolean;
  exerciseId?: string;
};

export type RestTimerPayload =
  | {
      mode: 'set';
      durationSeconds: number;
      exerciseId?: string;
      exerciseName?: string;
      setNumber: number;
    }
  | {
      mode: 'exercise';
      durationSeconds: number;
      exerciseId?: string;
      exerciseName?: string;
      nextExerciseId?: string;
      nextExerciseName?: string;
      setNumber: number;
    };

export function isNumericGridValue(value: string) {
  return NUMERIC_RE.test(value);
}

export function isCommittedNumericGridValue(value: unknown) {
  const normalizedValue = String(value ?? '').trim();
  return normalizedValue !== '' && isNumericGridValue(normalizedValue) && Number.isFinite(Number(normalizedValue));
}

export function isCompletedRepsValue(value: unknown) {
  return isCommittedNumericGridValue(value);
}

export function fillExerciseWeightsFromFirstSet<TBlock extends SetGridBlock>(
  blocks: TBlock[],
  blockIndex: number,
  rowIndex: number,
  weight: unknown,
) {
  const normalizedWeight = String(weight ?? '').trim();

  const targetBlock = blocks[blockIndex];
  if (!targetBlock) return blocks;

  const targetSet = targetBlock.sets[rowIndex];
  if (!targetSet) return blocks;

  if (targetSet.set_number !== 1 || !isCommittedNumericGridValue(normalizedWeight)) {
    return blocks;
  }

  const targetExerciseId = targetSet.exercise_id;

  return blocks.map((block, currentBlockIndex) => {
    if (currentBlockIndex !== blockIndex) return block;

    return {
      ...block,
      sets: block.sets.map((set, setIndex) => {
        if (targetExerciseId && set.exercise_id && set.exercise_id !== targetExerciseId) {
          return set;
        }

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
export function buildInitialBlocks(
  session: SetGridSession | null | undefined,
  sessionExercises: SetGridSessionExercise[],
  exercises: SetGridExercise[],
  sessionExerciseGroupsOrIdFactory: SetGridSessionExerciseGroup[] | (() => string) = [],
  createSetIdFallback = () => crypto.randomUUID(),
): SetGridBlock[] {
  if (!session) return [];

  let sessionExerciseGroups: SetGridSessionExerciseGroup[] = [];
  let createSetId: () => string = createSetIdFallback;

  if (typeof sessionExerciseGroupsOrIdFactory === 'function') {
    createSetId = sessionExerciseGroupsOrIdFactory;
  } else if (Array.isArray(sessionExerciseGroupsOrIdFactory)) {
    sessionExerciseGroups = sessionExerciseGroupsOrIdFactory;
  }

  // Filter and sort sessionExercises for this session
  const sessionLinks = sessionExercises
    .filter((se) => se.session_id === session.id)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Filter and sort sessionExerciseGroups for this session
  const sessionGroups = (sessionExerciseGroups || [])
    .filter((group) => group.session_id === session.id)
    .sort((a, b) => (a.start_order || 0) - (b.start_order || 0));

  const blocks: SetGridBlock[] = [];
  let index = 0;

  while (index < sessionLinks.length) {
    const se = sessionLinks[index];
    const order = Number(se.order) || 0;

    // Check if the current exercise is part of any group
    const group = sessionGroups.find((g) => {
      const start = Number(g.start_order) || 1;
      const end = start + (Number(g.size) || 2) - 1;
      return order >= start && order <= end;
    });

    if (group) {
      // Find all exercises belonging to this group
      const start = Number(group.start_order) || 1;
      const end = start + (Number(group.size) || 2) - 1;
      const groupLinks = sessionLinks.filter((link) => {
        const o = Number(link.order) || 0;
        return o >= start && o <= end;
      });

      // Gather exercise info in order
      const groupExercisesInfo = groupLinks.map((link) => {
        const ex = exercises.find((e) => e.id === link.exercise_id);
        return {
          linkId: link.id,
          exercise_id: link.exercise_id,
          name: ex?.name ?? 'Unknown Exercise',
          is_unilateral: ex?.is_unilateral ?? false,
          target_sets: link.target_sets || 3,
        };
      });

      // Align group target sets to first exercise's target sets (already synced via store)
      const targetSets = groupExercisesInfo[0]?.target_sets || 3;
      const exerciseNames = groupExercisesInfo.map((e) => e.name);

      const sets: SetGridSet[] = [];
      for (let i = 0; i < targetSets; i++) {
        const setNumber = i + 1;
        // Alternately push sets for each exercise in the group
        groupExercisesInfo.forEach((exInfo) => {
          if (exInfo.is_unilateral) {
            sets.push({
              id: createSetId(),
              set_number: setNumber,
              side: 'L',
              weight: '',
              reps: '',
              memo: '',
              exercise_id: exInfo.exercise_id,
              exercise_name: exInfo.name,
              session_exercise_id: exInfo.linkId,
            });
            sets.push({
              id: createSetId(),
              set_number: setNumber,
              side: 'R',
              weight: '',
              reps: '',
              memo: '',
              exercise_id: exInfo.exercise_id,
              exercise_name: exInfo.name,
              session_exercise_id: exInfo.linkId,
            });
          } else {
            sets.push({
              id: createSetId(),
              set_number: setNumber,
              side: 'both',
              weight: '',
              reps: '',
              memo: '',
              exercise_id: exInfo.exercise_id,
              exercise_name: exInfo.name,
              session_exercise_id: exInfo.linkId,
            });
          }
        });
      }

      const palette = ['#7aa2f7', '#9ece6a', '#e0af68', '#f7768e'];
      const groupIdx = sessionGroups.findIndex((g) => g.id === group.id);
      const resolvedColor = group.color || palette[groupIdx % palette.length] || '#7aa2f7';

      blocks.push({
        id: group.id,
        is_group: true,
        group_id: group.id,
        group_name: group.name,
        group_color: resolvedColor,
        exercise_name: `${group.name} (${exerciseNames.join(' + ')})`,
        group_exercises: groupExercisesInfo,
        sets,
      });

      // Jump index by the size of the group
      index += groupLinks.length;
    } else {
      // Regular single exercise block
      const exercise = exercises.find((ex) => ex.id === se.exercise_id);
      const targetSets = se.target_sets || 3;
      const isUnilateral = exercise?.is_unilateral ?? false;

      const sets: SetGridSet[] = isUnilateral
        ? Array.from({ length: targetSets }, (_, i) => [
          {
            id: createSetId(),
            set_number: i + 1,
            side: 'L' as const,
            weight: '',
            reps: '',
            memo: '',
            exercise_id: se.exercise_id,
            exercise_name: exercise?.name ?? 'Unknown Exercise',
            session_exercise_id: se.id,
          },
          {
            id: createSetId(),
            set_number: i + 1,
            side: 'R' as const,
            weight: '',
            reps: '',
            memo: '',
            exercise_id: se.exercise_id,
            exercise_name: exercise?.name ?? 'Unknown Exercise',
            session_exercise_id: se.id,
          }
        ]).flat()
        : Array.from({ length: targetSets }, (_, i) => ({
          id: createSetId(),
          set_number: i + 1,
          side: 'both' as const,
          weight: '',
          reps: '',
          memo: '',
          exercise_id: se.exercise_id,
          exercise_name: exercise?.name ?? 'Unknown Exercise',
          session_exercise_id: se.id,
        }));

      blocks.push({
        id: se.id,
        exercise_id: se.exercise_id,
        exercise_name: exercise?.name ?? 'Unknown Exercise',
        is_unilateral: isUnilateral,
        is_group: false,
        sets,
      });

      index++;
    }
  }

  return blocks;
}

export function flattenBlocks(blocks: SetGridBlock[]): FlattenedSetGridRow[] {
  const rows: FlattenedSetGridRow[] = [];

  blocks.forEach((block, blockIndex) => {
    block.sets.forEach((set, rowIndex) => {
      rows.push({
        ...set,
        blockIndex,
        rowIndex,
        globalIndex: rows.length,
        isLastSet: rowIndex === block.sets.length - 1,
        exerciseId: set.exercise_id || block.exercise_id,
      });
    });
  });

  return rows;
}

export function computeNewGlobalIndex(blocks: SetGridBlock[], blockIndex: number) {
  let idx = 0;

  for (let i = 0; i < blockIndex; i += 1) {
    idx += blocks[i].sets.length;
  }

  return idx + blocks[blockIndex].sets.length;
}

export function getSetCompletionKey(block: SetGridBlock | null | undefined, set: SetGridSet | null | undefined) {
  if (!block || !set) return '';
  const exercisePart = set.exercise_id ? `:${set.exercise_id}` : '';
  return `${block.id}:${set.set_number}:${set.side || 'both'}${exercisePart}`;
}

function normalizeRestDuration(value: unknown, fallbackSeconds: number) {
  const seconds = Number(value ?? fallbackSeconds);
  if (!Number.isFinite(seconds)) return fallbackSeconds;
  return Math.max(0, Math.round(seconds));
}

export function getRestTimerPayloadForCompletedSet({
  blocks,
  sessionExercises,
  blockIndex,
  rowIndex,
}: {
  blocks: SetGridBlock[];
  sessionExercises: SetGridSessionExercise[];
  blockIndex: number;
  rowIndex: number;
}): RestTimerPayload | null {
  const block = blocks[blockIndex];
  const set = block?.sets?.[rowIndex];

  if (!block || !set) return null;

  const setNumber = Number(set.set_number) || 0;

  if (block.is_group) {
    const groupExercises = block.group_exercises ?? [];
    // 1. Check if unilateral exercise is finished (must finish 'R' if unilateral)
    const isUnilateral = groupExercises.find((e) => e.exercise_id === set.exercise_id)?.is_unilateral ?? false;
    const isFinalSideForExercise = !isUnilateral || set.side === 'R';
    
    if (!isFinalSideForExercise) {
      return null; // No rest yet between L and R sides
    }

    // 2. Check if this is the last exercise in the current group round
    const exerciseIndexInGroup = groupExercises.findIndex((e) => e.exercise_id === set.exercise_id);
    const isLastExerciseInGroup = exerciseIndexInGroup === groupExercises.length - 1;

    if (!isLastExerciseInGroup) {
      // Bypassing rest between switching exercises inside the same group
      return null;
    }

    // 3. This is the last exercise of the group's current round
    // Check if there are later rounds in the group
    const isFinalRound = !block.sets.some((candidate) => Number(candidate.set_number) > setNumber);

    if (!isFinalRound) {
      const lastLink = sessionExercises.find((se) => se.id === set.session_exercise_id);
      const durationSeconds = normalizeRestDuration(lastLink?.rest_between_sets, DEFAULT_REST_BETWEEN_SETS);
      if (durationSeconds <= 0) return null;

      return {
        mode: 'set',
        durationSeconds,
        exerciseId: block.id,
        exerciseName: block.exercise_name,
        setNumber,
      };
    }

    // 4. This is the final round of the entire group. Next is next exercise block (if exists)
    const nextBlock = blocks[blockIndex + 1];
    if (!nextBlock) return null;

    const lastLink = sessionExercises.find((se) => se.id === set.session_exercise_id);
    const durationSeconds = normalizeRestDuration(lastLink?.rest_after_exercise, DEFAULT_REST_AFTER_EXERCISE);
    if (durationSeconds <= 0) return null;

    return {
      mode: 'exercise',
      durationSeconds,
      exerciseId: block.id,
      exerciseName: block.exercise_name,
      nextExerciseId: nextBlock.is_group ? nextBlock.id : nextBlock.exercise_id,
      nextExerciseName: nextBlock.exercise_name,
      setNumber,
    };

  } else {
    // Regular single exercise block
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
      nextExerciseId: nextBlock.is_group ? nextBlock.id : nextBlock.exercise_id,
      nextExerciseName: nextBlock.exercise_name,
      setNumber,
    };
  }
}
