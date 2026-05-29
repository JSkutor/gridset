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
  saveWorkoutLog,
  onRestStart,
  onSaveSuccess,
}) {
  const [startTime, setStartTime] = useState(null);
  const [blocks, setBlocks] = useState(() => buildInitialBlocks(session, sessionExercises, exercises));
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
    const isUnilateral = blocks[blockIndex].is_unilateral;

    setBlocks((prev) =>
      prev.map((block, currentBlockIndex) => {
        if (currentBlockIndex !== blockIndex) return block;

        const maxSetNumber = block.sets.length > 0 ? Math.max(...block.sets.map((set) => set.set_number)) : 0;
        const nextSetNumber = maxSetNumber + 1;

        const newSets = isUnilateral
          ? [
              { id: crypto.randomUUID(), set_number: nextSetNumber, side: 'L', weight: '', reps: '', memo: '' },
              { id: crypto.randomUUID(), set_number: nextSetNumber, side: 'R', weight: '', reps: '', memo: '' },
            ]
          : [
              { id: crypto.randomUUID(), set_number: nextSetNumber, side: 'both', weight: '', reps: '', memo: '' },
            ];

        return {
          ...block,
          sets: [...block.sets, ...newSets],
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
    saveWorkoutLog(session.id, blocks, startTime);
    onSaveSuccess?.();
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
