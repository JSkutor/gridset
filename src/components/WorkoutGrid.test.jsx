import React from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkoutGrid from './WorkoutGrid.jsx';
import { useWorkoutStore } from '../store/useWorkoutStore.js';

const guestUser = {
  id: '00000000-0000-0000-0000-000000000000',
  name: '게스트',
  isGuest: true,
};

function setupWorkoutGrid() {
  const state = useWorkoutStore.getState();
  const routine = state.addRoutine('테스트 루틴');
  const session = state.addSession(routine.id, '상체 A');
  const bench = state.addExercise('테스트 벤치', '가슴', '바벨', 'kg', false);

  state.addSessionExercise(session.id, bench.id, 1, 2, '8');

  const saveSuccess = vi.fn();
  render(React.createElement(WorkoutGrid, {
    session,
    onExerciseFocus: vi.fn(),
    onRestStart: vi.fn(),
    onSaveSuccess: saveSuccess,
  }));

  return { bench, session, saveSuccess };
}

function getSetRows() {
  return screen
    .getAllByRole('row')
    .filter((row) => within(row).queryAllByRole('textbox').length === 2);
}

beforeEach(() => {
  window.localStorage.clear();
  HTMLElement.prototype.scrollTo = vi.fn();
  useWorkoutStore.getState().clearAllData();
  useWorkoutStore.setState({ currentUser: guestUser });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('WorkoutGrid workout start timing', () => {
  test('starts the workout from the first table input and saves reps-only rows', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-29T01:00:00.000Z'));

    const { bench, saveSuccess } = setupWorkoutGrid();
    const firstInputs = within(getSetRows()[0]).getAllByRole('textbox');
    const saveButton = screen.getByRole('button', { name: /운동 완료/i });

    fireEvent.change(firstInputs[1], { target: { value: '8' } });
    expect(saveButton.disabled).toBe(false);

    vi.setSystemTime(new Date('2026-05-29T01:30:00.000Z'));
    fireEvent.click(saveButton);

    const savedLog = useWorkoutStore.getState().workoutLogs.at(-1);
    expect(saveSuccess).toHaveBeenCalledTimes(1);
    expect(savedLog.start_time).toBe('2026-05-29T01:00:00.000Z');
    expect(savedLog.end_time).toBe('2026-05-29T01:30:00.000Z');

    const savedRecord = useWorkoutStore
      .getState()
      .setRecords
      .find((record) => record.workout_log_id === savedLog.id && record.exercise_id === bench.id);
    expect(savedRecord.record).toBe('8');
    expect(savedRecord.weight).toBe(0);
  });

  test('cancels the workout start when every table input is cleared', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-29T02:00:00.000Z'));

    setupWorkoutGrid();
    const firstInputs = within(getSetRows()[0]).getAllByRole('textbox');
    const saveButton = screen.getByRole('button', { name: /운동 완료/i });

    fireEvent.change(firstInputs[0], { target: { value: '80' } });
    fireEvent.change(firstInputs[0], { target: { value: '' } });
    expect(saveButton.disabled).toBe(true);

    vi.setSystemTime(new Date('2026-05-29T02:10:00.000Z'));
    fireEvent.change(firstInputs[0], { target: { value: '70' } });
    fireEvent.change(firstInputs[1], { target: { value: '8' } });
    fireEvent.click(saveButton);

    const savedLog = useWorkoutStore.getState().workoutLogs.at(-1);
    expect(savedLog.start_time).toBe('2026-05-29T02:10:00.000Z');
  });
});

describe('WorkoutGrid bodyweight equipment', () => {
  test('disables kg input for 맨몸 exercises and Tab skips to reps', async () => {
    const user = userEvent.setup();
    const state = useWorkoutStore.getState();
    const routine = state.addRoutine('테스트 루틴');
    const session = state.addSession(routine.id, '상체 A');
    const pullup = state.addExercise('턱걸이', '등', '맨몸', 'reps', false);

    state.addSessionExercise(session.id, pullup.id, 1, 2, '8');

    render(React.createElement(WorkoutGrid, {
      session,
      onExerciseFocus: vi.fn(),
      onRestStart: vi.fn(),
      onSaveSuccess: vi.fn(),
    }));

    const setRows = getSetRows();
    const [weightInput, repsInput] = within(setRows[0]).getAllByRole('textbox');

    expect(weightInput.readOnly).toBe(true);
    expect(weightInput.tabIndex).toBe(-1);

    await user.click(repsInput);
    expect(document.activeElement).toBe(repsInput);

    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(weightInput);

    await user.keyboard('12');
    expect(weightInput.value).toBe('');
    expect(repsInput.value).toBe('');

    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(repsInput);

    await user.type(repsInput, '10');
    expect(repsInput.value).toBe('10');
  });
});

describe('WorkoutGrid memo entry', () => {
  test('saves memo typed in the set memo textarea with the focused set record', async () => {
    const user = userEvent.setup();
    const { bench, saveSuccess } = setupWorkoutGrid();

    const rows = screen.getAllByRole('row');
    const firstSetRow = rows.find((row) => within(row).queryByText('1'));
    const inputs = within(firstSetRow).getAllByRole('textbox');

    await user.type(inputs[0], '80');
    await user.type(inputs[1], '8');

    const memoInput = screen.getByPlaceholderText('이 세트에 대한 메모...');
    await user.click(memoInput);
    await user.type(memoInput, '오늘은 가볍게');

    await user.click(screen.getByRole('button', { name: /운동 완료/i }));

    const savedRecord = useWorkoutStore
      .getState()
      .setRecords
      .find((record) => record.exercise_id === bench.id && record.set_number === 1);

    expect(saveSuccess).toHaveBeenCalledTimes(1);
    expect(savedRecord?.memo).toBe('오늘은 가볍게');
  });

  test('keeps memos attached to the set that was focused before opening the memo textarea', async () => {
    const user = userEvent.setup();
    const { bench } = setupWorkoutGrid();

    const setRows = getSetRows();
    const firstInputs = within(setRows[0]).getAllByRole('textbox');
    const secondInputs = within(setRows[1]).getAllByRole('textbox');

    await user.type(firstInputs[0], '80');
    await user.type(firstInputs[1], '8');
    await user.click(screen.getByPlaceholderText('이 세트에 대한 메모...'));
    await user.type(screen.getByPlaceholderText('이 세트에 대한 메모...'), '첫 세트 메모');

    await user.type(secondInputs[0], '80');
    await user.type(secondInputs[1], '7');
    await user.click(screen.getByPlaceholderText('이 세트에 대한 메모...'));
    await user.clear(screen.getByPlaceholderText('이 세트에 대한 메모...'));
    await user.type(screen.getByPlaceholderText('이 세트에 대한 메모...'), '두 번째 메모');

    await user.click(screen.getByRole('button', { name: /운동 완료/i }));

    const savedRecords = useWorkoutStore
      .getState()
      .setRecords
      .filter((record) => record.exercise_id === bench.id)
      .sort((a, b) => a.set_number - b.set_number);

    expect(savedRecords.map((record) => record.memo)).toEqual(['첫 세트 메모', '두 번째 메모']);
  });
});
