import { useCallback, useMemo, useRef, useState } from 'react';
import {
  buildInitialBlocks,
  computeNewGlobalIndex,
  fillExerciseWeightsFromFirstSet,
  flattenBlocks,
  getRestTimerPayloadForCompletedSet,
  getSetCompletionKey,
  isCompletedRepsValue,
  isNumericGridValue,
} from '../utils/setGridModel.js';

function hasTableInput(blocks) {
  return blocks.some((block) =>
    block.sets.some((set) =>
      String(set.weight ?? '').trim() !== '' ||
      String(set.reps ?? '').trim() !== '',
    ),
  );
}

export function useWorkoutDraft({
  session,
  sessionExercises,
  exercises,
  sessionExerciseGroups = [],
  saveWorkoutLog,
  onRestStart,
  onSaveSuccess,
}) {
  const [startTime, setStartTime] = useState(null);
  const [blocks, setBlocks] = useState(() => buildInitialBlocks(session, sessionExercises, exercises, sessionExerciseGroups));
  const [focusedSet, setFocusedSet] = useState({ blockIndex: 0, rowIndex: 0 });
  const completedSetSignaturesRef = useRef(new Map());

  const currentMemo = blocks[focusedSet.blockIndex]?.sets[focusedSet.rowIndex]?.memo ?? '';
  const flatRows = useMemo(() => flattenBlocks(blocks), [blocks]);
  const totalRows = flatRows.length;

  const updateRow = useCallback((blockIndex, rowIndex, field, value) => {
    if (!isNumericGridValue(value)) return;

    if (field === 'reps' && !isCompletedRepsValue(value)) {
      const block = blocks[blockIndex];
      const set = block?.sets?.[rowIndex];
      const completionKey = getSetCompletionKey(block, set);
      if (completionKey) completedSetSignaturesRef.current.delete(completionKey);
    }

    const nextBlocks = blocks.map((block, currentBlockIndex) =>
      currentBlockIndex !== blockIndex ? block : {
        ...block,
        sets: block.sets.map((set, currentRowIndex) =>
          currentRowIndex !== rowIndex ? set : { ...set, [field]: value },
        ),
      },
    );

    setBlocks(nextBlocks);

    if (!hasTableInput(nextBlocks)) {
      setStartTime(null);
    } else if (String(value).trim() !== '') {
      setStartTime((currentStartTime) => currentStartTime || new Date().toISOString());
    }
  }, [blocks]);

  const updateMemo = useCallback((value) => {
    const { blockIndex, rowIndex } = focusedSet;
    setBlocks((prev) =>
      prev.map((block, currentBlockIndex) =>
        currentBlockIndex !== blockIndex ? block : {
          ...block,
          sets: block.sets.map((set, currentRowIndex) =>
            currentRowIndex !== rowIndex ? set : { ...set, memo: value },
          ),
        },
      ),
    );
  }, [focusedSet]);

  const handleSetFocus = useCallback((blockIndex, rowIndex) => {
    setFocusedSet({ blockIndex, rowIndex });
  }, []);

  const handleFirstWeightTab = useCallback((row, value) => {
    setBlocks((prev) => fillExerciseWeightsFromFirstSet(prev, row.blockIndex, row.rowIndex, value));
  }, []);

  const handleRepsTab = useCallback((row, value) => {
    if (!isCompletedRepsValue(value)) return;

    const block = blocks[row.blockIndex];
    const set = block?.sets?.[row.rowIndex];
    const completionKey = getSetCompletionKey(block, set);
    const completionSignature = String(value).trim();

    if (!completionKey || completedSetSignaturesRef.current.get(completionKey) === completionSignature) return;

    completedSetSignaturesRef.current.set(completionKey, completionSignature);

    const restPayload = getRestTimerPayloadForCompletedSet({
      blocks,
      sessionExercises,
      blockIndex: row.blockIndex,
      rowIndex: row.rowIndex,
    });

    if (restPayload) {
      onRestStart?.(restPayload);
    }
  }, [blocks, onRestStart, sessionExercises]);

  const addRow = useCallback((blockIndex, requestFocus) => {
    const newGlobalIndex = computeNewGlobalIndex(blocks, blockIndex);
    const newRowIndex = blocks[blockIndex].sets.length;
    const block = blocks[blockIndex];

    setBlocks((prev) =>
      prev.map((b, currentBlockIndex) => {
        if (currentBlockIndex !== blockIndex) return b;

        const maxSetNumber = b.sets.length > 0 ? Math.max(...b.sets.map((set) => set.set_number)) : 0;
        const nextSetNumber = maxSetNumber + 1;

        let newSets = [];
        if (b.is_group) {
          b.group_exercises.forEach((exInfo) => {
            if (exInfo.is_unilateral) {
              newSets.push({
                id: crypto.randomUUID(),
                set_number: nextSetNumber,
                side: 'L',
                weight: '',
                reps: '',
                memo: '',
                exercise_id: exInfo.exercise_id,
                exercise_name: exInfo.name,
                session_exercise_id: exInfo.linkId,
              });
              newSets.push({
                id: crypto.randomUUID(),
                set_number: nextSetNumber,
                side: 'R',
                weight: '',
                reps: '',
                memo: '',
                exercise_id: exInfo.exercise_id,
                exercise_name: exInfo.name,
                session_exercise_id: exInfo.linkId,
              });
            } else {
              newSets.push({
                id: crypto.randomUUID(),
                set_number: nextSetNumber,
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
        } else {
          const isUnilateral = b.is_unilateral;
          const exId = b.exercise_id;
          const exName = b.exercise_name;
          const seId = b.sets[0]?.session_exercise_id || b.id;

          newSets = isUnilateral
            ? [
                { id: crypto.randomUUID(), set_number: nextSetNumber, side: 'L', weight: '', reps: '', memo: '', exercise_id: exId, exercise_name: exName, session_exercise_id: seId },
                { id: crypto.randomUUID(), set_number: nextSetNumber, side: 'R', weight: '', reps: '', memo: '', exercise_id: exId, exercise_name: exName, session_exercise_id: seId },
              ]
            : [
                { id: crypto.randomUUID(), set_number: nextSetNumber, side: 'both', weight: '', reps: '', memo: '', exercise_id: exId, exercise_name: exName, session_exercise_id: seId },
              ];
        }

        return {
          ...b,
          sets: [...b.sets, ...newSets],
        };
      }),
    );

    setFocusedSet({ blockIndex, rowIndex: newRowIndex });
    requestFocus(newGlobalIndex);
  }, [blocks]);

  const hasEnteredData = useMemo(() => (
    blocks.some((block) =>
      block.sets.some((set) =>
        String(set.reps ?? '').trim() !== '',
      ),
    )
  ), [blocks]);

  const saveWorkout = useCallback(() => {
    if (!session || !hasEnteredData || !startTime) return;
    const newLog = saveWorkoutLog(session.id, blocks, startTime);
    onSaveSuccess?.(newLog);
  }, [blocks, hasEnteredData, onSaveSuccess, saveWorkoutLog, session, startTime]);

  return {
    blocks,
    focusedSet,
    currentMemo,
    flatRows,
    totalRows,
    hasEnteredData,
    canSaveWorkout: hasEnteredData && Boolean(startTime),
    updateRow,
    updateMemo,
    handleSetFocus,
    handleFirstWeightTab,
    handleRepsTab,
    addRow,
    saveWorkout,
  };
}
