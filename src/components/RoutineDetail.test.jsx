import React from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import RoutineDetail from './RoutineDetail.jsx';
import { useWorkoutStore } from '../store/useWorkoutStore.js';

globalThis.React = React;

const guestUser = {
  id: '00000000-0000-0000-0000-000000000000',
  name: '게스트',
  isGuest: true,
};

function setupStoreForTest() {
  const state = useWorkoutStore.getState();

  // Create Routine A (Writable - most recent)
  const routineA = state.addRoutine('Routine A');

  // Create Routine B (Read-only - older)
  const routineB = state.addRoutine('Routine B');

  // Explicitly set created_at so Routine A is sorted first and Routine B is sorted second
  useWorkoutStore.setState({
    routines: [
      { ...routineA, created_at: '2026-05-30T12:00:00Z' },
      { ...routineB, created_at: '2026-05-20T12:00:00Z' },
    ],
  });

  const updatedRoutines = useWorkoutStore.getState().routines;
  const rA = updatedRoutines.find(r => r.name === 'Routine A');
  const rB = updatedRoutines.find(r => r.name === 'Routine B');

  // Add Sessions
  const sessionA1 = state.addSession(rA.id, 'Session A-1');
  const sessionA2 = state.addSession(rA.id, 'Session A-2');
  const sessionB1 = state.addSession(rB.id, 'Session B-1');

  // Add Exercises
  const bench = state.addExercise('Bench Press', 'Chest', 'Barbell', 'kg', false);
  const squat = state.addExercise('Squat', 'Legs', 'Barbell', 'kg', false);

  // Link Exercises to Sessions
  state.addSessionExercise(sessionA1.id, bench.id, 1, 4, '8');
  state.addSessionExercise(sessionA2.id, squat.id, 1, 3, '10');
  state.addSessionExercise(sessionB1.id, squat.id, 1, 5, '12');

  return { rA, rB, sessionA1, sessionA2, sessionB1, bench, squat };
}

beforeEach(() => {
  window.localStorage.clear();
  HTMLElement.prototype.scrollTo = vi.fn();
  HTMLElement.prototype.scrollIntoView = vi.fn();
  useWorkoutStore.getState().clearAllData();
  useWorkoutStore.setState({ currentUser: guestUser });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('RoutineDetail Component', () => {
  test('tab switching and session selection display appropriate exercises and settings', () => {
    setupStoreForTest();

    render(<RoutineDetail />);

    // Initially Routine A is selected (newest created_at)
    // 1. Verify Routine A sessions are displayed in the session list panel
    const sessionPanel = document.querySelector('.session-scroll-container');
    expect(within(sessionPanel).getByText('Session A-1')).toBeDefined();
    expect(within(sessionPanel).getByText('Session A-2')).toBeDefined();

    // 2. Click Session A-1 and select the exercise to view settings
    fireEvent.click(within(sessionPanel).getByText('Session A-1'));
    
    const exercisePanel = document.querySelector('.exercise-scroll-container');
    expect(within(exercisePanel).getByText('Bench Press')).toBeDefined();

    fireEvent.click(within(exercisePanel).getByText('Bench Press'));
    // Verify target sets (4) and target reps (8) are rendered inside their respective spinbuttons
    expect(screen.getByLabelText('세트 값').textContent).toBe('4');
    expect(screen.getByLabelText('회 값').textContent).toBe('8');

    // 3. Switch to Session A-2
    fireEvent.click(within(sessionPanel).getByText('Session A-2'));
    expect(within(exercisePanel).getByText('Squat')).toBeDefined();

    fireEvent.click(within(exercisePanel).getByText('Squat'));
    expect(screen.getByLabelText('세트 값').textContent).toBe('3');
    expect(screen.getByLabelText('회 값').textContent).toBe('10');

    // 4. Switch to Routine B tab
    const routineBTab = screen.getByRole('button', { name: 'Routine B' });
    fireEvent.click(routineBTab);

    // Verify Routine B's session and exercise settings load correctly
    const sessionPanelB = document.querySelector('.session-scroll-container');
    expect(within(sessionPanelB).getByText('Session B-1')).toBeDefined();
    
    fireEvent.click(within(sessionPanelB).getByText('Session B-1'));
    
    const exercisePanelB = document.querySelector('.exercise-scroll-container');
    expect(within(exercisePanelB).getByText('Squat')).toBeDefined();

    fireEvent.click(within(exercisePanelB).getByText('Squat'));
    expect(screen.getByLabelText('세트 값').textContent).toBe('5');
    expect(screen.getByLabelText('회 값').textContent).toBe('12');
  });

  test('read-only restrictions are applied when isReadOnly is true', () => {
    setupStoreForTest();

    render(<RoutineDetail />);

    // Switch to Routine B (which is read-only)
    const routineBTab = screen.getByRole('button', { name: 'Routine B' });
    fireEvent.click(routineBTab);

    // 1. Verify routine edit and delete buttons are absent in the header
    expect(screen.queryByRole('button', { name: /edit/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /delete/i })).toBeNull();

    // 2. Verify add session and temporary session buttons are absent
    expect(screen.queryByRole('button', { name: '세션 추가' })).toBeNull();
    expect(screen.queryByRole('button', { name: '임시 세션 추가' })).toBeNull();

    // 3. Click Session B-1 and verify exercise addition and deletion are absent/blocked
    const sessionPanel = document.querySelector('.session-scroll-container');
    fireEvent.click(within(sessionPanel).getByText('Session B-1'));
    
    const exercisePanel = document.querySelector('.exercise-scroll-container');
    expect(within(exercisePanel).queryByRole('button', { name: '운동 추가' })).toBeNull();
    
    // Verify exercise row delete button is not rendered in DOM
    const deleteBtn = document.querySelector('.exercise-delete-btn');
    expect(deleteBtn).toBeNull();

    // 4. Click Squat to check settings panel steppers
    fireEvent.click(within(exercisePanel).getByText('Squat'));

    // Verify all stepper adjustment control buttons are disabled
    const decreaseButtons = screen.getAllByRole('button', { name: /줄이기/i });
    expect(decreaseButtons.length).toBeGreaterThan(0);
    decreaseButtons.forEach(btn => {
      expect(btn.disabled).toBe(true);
    });

    const increaseButtons = screen.getAllByRole('button', { name: /늘리기/i });
    expect(increaseButtons.length).toBeGreaterThan(0);
    increaseButtons.forEach(btn => {
      expect(btn.disabled).toBe(true);
    });
  });
});
