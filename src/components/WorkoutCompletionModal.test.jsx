import React from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import WorkoutCompletionModal from './WorkoutCompletionModal.jsx';
import { useWorkoutStore } from '../store/useWorkoutStore.js';

// Polyfill scrollTo on HTML elements if needed
HTMLElement.prototype.scrollTo = vi.fn();

const guestUser = {
  id: '00000000-0000-0000-0000-000000000000',
  name: '게스트',
  isGuest: true,
};

describe('WorkoutCompletionModal', () => {
  let mockWorkoutLog;
  let mockSession;
  let mockWeightedExercise;
  let mockBodyweightExercise;

  beforeEach(() => {
    window.localStorage.clear();
    const state = useWorkoutStore.getState();
    state.clearAllData();
    state.currentUser = guestUser;

    // Seed mock exercises and sessions to the store
    mockWeightedExercise = state.addExercise('벤치 프레스', '가슴', '바벨', 'kg', false);
    mockBodyweightExercise = state.addExercise('턱걸이', '등', '맨몸', 'reps', false);

    const routine = state.addRoutine('테스트 루틴');
    mockSession = state.addSession(routine.id, '상체 A');
    mockSession.color = '#7aa2f7';

    mockWorkoutLog = {
      id: 'mock-log-123',
      session_id: mockSession.id,
      start_time: '2026-05-30T10:00:00.000Z',
      end_time: '2026-05-30T10:45:00.000Z',
      created_at: '2026-05-30T10:00:00.000Z',
      updated_at: '2026-05-30T10:45:00.000Z',
    };

    // Add set records to the store
    // 3 sets of bench press:
    // Set 1: 60kg x 8 reps
    // Set 2: 70kg x 6 reps (Best by weight/score)
    // Set 3: 70kg x 5 reps
    state.addSetRecord(mockWorkoutLog.id, mockWeightedExercise.id, 1, '60', '8');
    state.addSetRecord(mockWorkoutLog.id, mockWeightedExercise.id, 2, '70', '6');
    state.addSetRecord(mockWorkoutLog.id, mockWeightedExercise.id, 3, '70', '5');

    // 2 sets of pullups:
    // Set 1: 0kg x 10 reps
    // Set 2: 0kg x 12 reps (Best by reps)
    state.addSetRecord(mockWorkoutLog.id, mockBodyweightExercise.id, 1, '0', '10');
    state.addSetRecord(mockWorkoutLog.id, mockBodyweightExercise.id, 2, '0', '12');
  });

  test('correctly calculates and renders today\'s workout statistics', () => {
    const handleClose = vi.fn();
    render(
      React.createElement(WorkoutCompletionModal, {
        isOpen: true,
        workoutLog: mockWorkoutLog,
        onClose: handleClose,
      })
    );

    // Assert that the title is rendered
    expect(screen.getByText(/운동 완료! 수고하셨습니다/i)).toBeTruthy();
    
    // Assert active session name and date banner are rendered
    expect(screen.getByText(/상체 A/)).toBeTruthy();
    expect(screen.getByText(/2026년 5월 30일/i)).toBeTruthy();
    expect(screen.getByText(/45분/)).toBeTruthy();

    // Verify statistics:
    // Total Sets = 3 bench press + 2 pullups = 5 sets
    expect(screen.getByText(/5세트/)).toBeTruthy();

    // Total Reps = 8 + 6 + 5 + 10 + 12 = 41 reps
    expect(screen.getByText(/41회/)).toBeTruthy();

    // Max Weight = 70 kg
    expect(screen.getAllByText(/70\s*kg/i).length).toBeGreaterThan(0);

    // Total Volume = (60 * 8) + (70 * 6) + (70 * 5) = 480 + 420 + 350 = 1250 kg
    expect(screen.getAllByText(/1,250\s*kg/i).length).toBeGreaterThan(0);
  });

  test('correctly calculates and renders Best Set summaries for each exercise', () => {
    render(
      React.createElement(WorkoutCompletionModal, {
        isOpen: true,
        workoutLog: mockWorkoutLog,
        onClose: vi.fn(),
      })
    );

    // Verify exercise names are displayed
    expect(screen.getByText(/벤치 프레스/)).toBeTruthy();
    expect(screen.getByText(/턱걸이/)).toBeTruthy();

    // Verify correct set count sub-labels
    expect(screen.getByText(/3세트 완료/)).toBeTruthy();
    expect(screen.getByText(/2세트 완료/)).toBeTruthy();

    // Verify best set formulas:
    // Weighted exercise best set: 70kg x 6 reps
    expect(screen.getByText(/Best\s*70kg\s*×\s*6회/i)).toBeTruthy();

    // Bodyweight exercise best set: 12 reps (getExerciseDisplayUnit returns '회' or custom)
    expect(screen.getByText(/Best\s*12회/i)).toBeTruthy();
  });

  test('triggers onClose callback when clicking the primary view logs button', () => {
    const handleClose = vi.fn();
    render(
      React.createElement(WorkoutCompletionModal, {
        isOpen: true,
        workoutLog: mockWorkoutLog,
        onClose: handleClose,
      })
    );

    const button = screen.getByRole('button', { name: /기록 페이지에서 확인하기/i });
    fireEvent.click(button);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('correctly calculates and renders Progressive Overload progress and deltas', () => {
    const state = useWorkoutStore.getState();

    // Add historical records (past workout logs) for our exercises
    const pastWorkoutLog = {
      id: 'past-log-999',
      session_id: mockSession.id,
      start_time: '2026-05-20T10:00:00.000Z',
      end_time: '2026-05-20T10:45:00.000Z',
    };

    // Weighted exercise (Bench Press):
    // Past Best Set: 65kg x 5 reps.
    // Today's Best Set: 70kg x 6 reps.
    // Overload should be: +5kg (+5kg weight increase)
    state.addSetRecord(pastWorkoutLog.id, mockWeightedExercise.id, 1, '65', '5');

    // Bodyweight exercise (Pullups):
    // Past Best Set: 10 reps.
    // Today's Best Set: 12 reps.
    // Overload should be: +2회
    state.addSetRecord(pastWorkoutLog.id, mockBodyweightExercise.id, 1, '0', '10');

    render(
      React.createElement(WorkoutCompletionModal, {
        isOpen: true,
        workoutLog: mockWorkoutLog,
        onClose: vi.fn(),
      })
    );

    // Verify Overload deltas are rendered
    expect(screen.getByText(/점진적 과부하 \+5kg/i)).toBeTruthy();
    expect(screen.getByText(/점진적 과부하 \+2회/i)).toBeTruthy();
  });

  test('correctly calculates rep overload when weight is equal to past best weight', () => {
    const state = useWorkoutStore.getState();

    const pastWorkoutLog = {
      id: 'past-log-888',
      session_id: mockSession.id,
      start_time: '2026-05-20T10:00:00.000Z',
    };

    // Past Best Set: 70kg x 4 reps.
    // Today's Best Set: 70kg x 6 reps.
    // Overload should be: +2회 (+2 reps increase at the same maximum weight)
    state.addSetRecord(pastWorkoutLog.id, mockWeightedExercise.id, 1, '70', '4');

    render(
      React.createElement(WorkoutCompletionModal, {
        isOpen: true,
        workoutLog: mockWorkoutLog,
        onClose: vi.fn(),
      })
    );

    expect(screen.getByText(/점진적 과부하 \+2회/i)).toBeTruthy();
  });
});
