import { renderHook, act } from '@testing-library/react';
import { useWorkoutDraft } from './useWorkoutDraft.js';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// Polyfill/mock crypto.randomUUID if missing in Node/jsdom
if (typeof crypto === 'undefined') {
  globalThis.crypto = {};
}
if (!crypto.randomUUID) {
  let uuidCounter = 0;
  crypto.randomUUID = () => `mock-uuid-${uuidCounter++}`;
}

describe('useWorkoutDraft', () => {
  let mockSession;
  let mockSessionExercises;
  let mockExercises;
  let saveWorkoutLogMock;
  let onRestStartMock;
  let onSaveSuccessMock;

  beforeEach(() => {
    mockSession = { id: 'session-1' };
    mockSessionExercises = [
      {
        id: 'se-1',
        session_id: 'session-1',
        exercise_id: 'ex-regular',
        order: 1,
        target_sets: 2,
        rest_between_sets: 60,
        rest_after_exercise: 120,
      },
      {
        id: 'se-2',
        session_id: 'session-1',
        exercise_id: 'ex-unilateral',
        order: 2,
        target_sets: 1,
        rest_between_sets: 90,
        rest_after_exercise: 150,
      },
    ];
    mockExercises = [
      { id: 'ex-regular', name: 'Regular Exercise', is_unilateral: false },
      { id: 'ex-unilateral', name: 'Unilateral Exercise', is_unilateral: true },
    ];
    saveWorkoutLogMock = vi.fn();
    onRestStartMock = vi.fn();
    onSaveSuccessMock = vi.fn();
  });

  test('initial block generation matches expectations (including regular vs unilateral set counts)', () => {
    const { result } = renderHook(() =>
      useWorkoutDraft({
        session: mockSession,
        sessionExercises: mockSessionExercises,
        exercises: mockExercises,
        saveWorkoutLog: saveWorkoutLogMock,
        onRestStart: onRestStartMock,
        onSaveSuccess: onSaveSuccessMock,
      })
    );

    const { blocks } = result.current;
    expect(blocks.length).toBe(2);

    // Regular exercise (ex-regular): target_sets = 2 -> should have 2 sets (both sides)
    expect(blocks[0].exercise_id).toBe('ex-regular');
    expect(blocks[0].is_unilateral).toBe(false);
    expect(blocks[0].sets.length).toBe(2);
    expect(blocks[0].sets[0].set_number).toBe(1);
    expect(blocks[0].sets[0].side).toBe('both');
    expect(blocks[0].sets[1].set_number).toBe(2);
    expect(blocks[0].sets[1].side).toBe('both');

    // Unilateral exercise (ex-unilateral): target_sets = 1 -> should have 2 sets (L and R symmetric)
    expect(blocks[1].exercise_id).toBe('ex-unilateral');
    expect(blocks[1].is_unilateral).toBe(true);
    expect(blocks[1].sets.length).toBe(2);
    expect(blocks[1].sets[0].set_number).toBe(1);
    expect(blocks[1].sets[0].side).toBe('L');
    expect(blocks[1].sets[1].set_number).toBe(1);
    expect(blocks[1].sets[1].side).toBe('R');
  });

  test('row updates correctly update the weight/reps inside the block state', () => {
    const { result } = renderHook(() =>
      useWorkoutDraft({
        session: mockSession,
        sessionExercises: mockSessionExercises,
        exercises: mockExercises,
        saveWorkoutLog: saveWorkoutLogMock,
        onRestStart: onRestStartMock,
        onSaveSuccess: onSaveSuccessMock,
      })
    );

    act(() => {
      result.current.updateRow(0, 0, 'weight', '82.5');
    });
    act(() => {
      result.current.updateRow(0, 0, 'reps', '8');
    });

    expect(result.current.blocks[0].sets[0].weight).toBe('82.5');
    expect(result.current.blocks[0].sets[0].reps).toBe('8');
  });

  test("startTime is set upon typing the first non-empty value, and cleared to null if all entered values are erased", () => {
    const { result } = renderHook(() =>
      useWorkoutDraft({
        session: mockSession,
        sessionExercises: mockSessionExercises,
        exercises: mockExercises,
        saveWorkoutLog: saveWorkoutLogMock,
        onRestStart: onRestStartMock,
        onSaveSuccess: onSaveSuccessMock,
      })
    );

    // Initial state: canSaveWorkout is false because startTime is null and hasEnteredData is false
    expect(result.current.canSaveWorkout).toBe(false);

    // Type a non-empty value for reps (which also sets hasEnteredData to true)
    act(() => {
      result.current.updateRow(0, 0, 'reps', '10');
    });
    expect(result.current.canSaveWorkout).toBe(true);

    // Save workout to check what startTime is passed
    act(() => {
      result.current.saveWorkout();
    });
    expect(saveWorkoutLogMock).toHaveBeenCalledTimes(1);
    const firstStartTime = saveWorkoutLogMock.mock.calls[0][2];
    expect(typeof firstStartTime).toBe('string');
    expect(firstStartTime).not.toBe('');

    // Clear the only entered value (all entered values erased)
    saveWorkoutLogMock.mockClear();
    act(() => {
      result.current.updateRow(0, 0, 'reps', '');
    });
    expect(result.current.canSaveWorkout).toBe(false);

    // If we type again, we should get a new/reinitialized start time
    act(() => {
      result.current.updateRow(0, 0, 'reps', '12');
    });
    expect(result.current.canSaveWorkout).toBe(true);

    act(() => {
      result.current.saveWorkout();
    });
    expect(saveWorkoutLogMock).toHaveBeenCalledTimes(1);
    const secondStartTime = saveWorkoutLogMock.mock.calls[0][2];
    expect(typeof secondStartTime).toBe('string');
  });

  test("addRow immutably adds 1 set for regular exercises, and 2 sets (L and R symmetric) for unilateral exercises with the same incremented set_number", () => {
    const { result } = renderHook(() =>
      useWorkoutDraft({
        session: mockSession,
        sessionExercises: mockSessionExercises,
        exercises: mockExercises,
        saveWorkoutLog: saveWorkoutLogMock,
        onRestStart: onRestStartMock,
        onSaveSuccess: onSaveSuccessMock,
      })
    );

    const requestFocusMock = vi.fn();

    // Regular: originally 2 sets. Adding row should add 1 set (set_number: 3, side: both)
    act(() => {
      result.current.addRow(0, requestFocusMock);
    });

    expect(result.current.blocks[0].sets.length).toBe(3);
    expect(result.current.blocks[0].sets[2].set_number).toBe(3);
    expect(result.current.blocks[0].sets[2].side).toBe('both');
    expect(requestFocusMock).toHaveBeenCalledWith(2); // newGlobalIndex before mutation is 2

    // Unilateral: originally 2 sets (set_number: 1 L & R). Adding row should add 2 sets (set_number: 2, side L & R)
    act(() => {
      result.current.addRow(1, requestFocusMock);
    });

    expect(result.current.blocks[1].sets.length).toBe(4);
    expect(result.current.blocks[1].sets[2].set_number).toBe(2);
    expect(result.current.blocks[1].sets[2].side).toBe('L');
    expect(result.current.blocks[1].sets[3].set_number).toBe(2);
    expect(result.current.blocks[1].sets[3].side).toBe('R');
  });

  test("handleRepsTab commits reps and triggers onRestStart callback with correct restPayload only when a new value is committed. In unilateral sets, the timer is only triggered on the last side's completion", () => {
    const { result } = renderHook(() =>
      useWorkoutDraft({
        session: mockSession,
        sessionExercises: mockSessionExercises,
        exercises: mockExercises,
        saveWorkoutLog: saveWorkoutLogMock,
        onRestStart: onRestStartMock,
        onSaveSuccess: onSaveSuccessMock,
      })
    );

    // 1. Regular set 1 (has later set in same exercise) -> triggers "set" mode with 60 seconds
    act(() => {
      result.current.handleRepsTab({ blockIndex: 0, rowIndex: 0 }, '10');
    });
    expect(onRestStartMock).toHaveBeenCalledTimes(1);
    expect(onRestStartMock).toHaveBeenLastCalledWith({
      mode: 'set',
      durationSeconds: 60,
      exerciseId: 'ex-regular',
      exerciseName: 'Regular Exercise',
      setNumber: 1,
    });

    // 2. Call again with same value -> does NOT trigger again
    onRestStartMock.mockClear();
    act(() => {
      result.current.handleRepsTab({ blockIndex: 0, rowIndex: 0 }, '10');
    });
    expect(onRestStartMock).not.toHaveBeenCalled();

    // 3. Call with new value -> triggers
    act(() => {
      result.current.handleRepsTab({ blockIndex: 0, rowIndex: 0 }, '12');
    });
    expect(onRestStartMock).toHaveBeenCalledTimes(1);

    // 4. Regular set 2 (no later set in same exercise, but has next exercise) -> triggers "exercise" mode with 120 seconds
    onRestStartMock.mockClear();
    act(() => {
      result.current.handleRepsTab({ blockIndex: 0, rowIndex: 1 }, '8');
    });
    expect(onRestStartMock).toHaveBeenLastCalledWith({
      mode: 'exercise',
      durationSeconds: 120,
      exerciseId: 'ex-regular',
      exerciseName: 'Regular Exercise',
      nextExerciseId: 'ex-unilateral',
      nextExerciseName: 'Unilateral Exercise',
      setNumber: 2,
    });

    // 5. Unilateral set 1 L (rowIndex 0 in block 1) -> does NOT trigger timer (not the last side)
    onRestStartMock.mockClear();
    act(() => {
      result.current.handleRepsTab({ blockIndex: 1, rowIndex: 0 }, '10');
    });
    expect(onRestStartMock).not.toHaveBeenCalled();

    // 6. Unilateral set 1 R (rowIndex 1 in block 1) -> normally would trigger timer, but this is the last block, so it skips
    act(() => {
      result.current.handleRepsTab({ blockIndex: 1, rowIndex: 1 }, '10');
    });
    expect(onRestStartMock).not.toHaveBeenCalled();

    // 7. Let's add a set in block 1 first, so set 1 R has a later set in the same exercise
    const requestFocusMock = vi.fn();
    act(() => {
      result.current.addRow(1, requestFocusMock);
    });
    // Now block 1 sets: rowIndex 0 (set 1 L), 1 (set 1 R), 2 (set 2 L), 3 (set 2 R)
    onRestStartMock.mockClear();
    // Use a different reps value ('11') to ensure it registers as a new commit signature
    act(() => {
      result.current.handleRepsTab({ blockIndex: 1, rowIndex: 1 }, '11');
    });
    expect(onRestStartMock).toHaveBeenCalledTimes(1);
    expect(onRestStartMock).toHaveBeenLastCalledWith({
      mode: 'set',
      durationSeconds: 90,
      exerciseId: 'ex-unilateral',
      exerciseName: 'Unilateral Exercise',
      setNumber: 1,
    });
  });

  test('saveWorkout executes saveWorkoutLog and calls onSaveSuccess', () => {
    const { result } = renderHook(() =>
      useWorkoutDraft({
        session: mockSession,
        sessionExercises: mockSessionExercises,
        exercises: mockExercises,
        saveWorkoutLog: saveWorkoutLogMock,
        onRestStart: onRestStartMock,
        onSaveSuccess: onSaveSuccessMock,
      })
    );

    // Initial save does nothing because no entered data
    act(() => {
      result.current.saveWorkout();
    });
    expect(saveWorkoutLogMock).not.toHaveBeenCalled();
    expect(onSaveSuccessMock).not.toHaveBeenCalled();

    // Mock saveWorkoutLog to return a mock log object
    const mockCreatedLog = { id: 'mock-log-id', session_id: mockSession.id };
    saveWorkoutLogMock.mockReturnValue(mockCreatedLog);

    // Type a value for reps (so we have entered data & startTime)
    act(() => {
      result.current.updateRow(0, 0, 'reps', '10');
    });

    act(() => {
      result.current.saveWorkout();
    });

    expect(saveWorkoutLogMock).toHaveBeenCalledTimes(1);
    expect(saveWorkoutLogMock).toHaveBeenCalledWith(
      mockSession.id,
      result.current.blocks,
      expect.any(String)
    );
    expect(onSaveSuccessMock).toHaveBeenCalledTimes(1);
    expect(onSaveSuccessMock).toHaveBeenCalledWith(mockCreatedLog);
  });
});
