// @ts-nocheck
 
import React from 'react';
import { test, describe, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RestTimer from './RestTimer';

describe('RestTimer React Component', () => {
  test('should not render anything when isVisible is false', () => {
    const timer = {
      remainingSeconds: 60,
      durationSeconds: 90,
      isPaused: false,
      mode: 'set',
      exerciseName: 'Bench Press',
      setNumber: 1,
    };

    const { container } = render(
      <RestTimer
        timer={timer}
        isVisible={false}
        onTogglePause={() => {}}
        onDismiss={() => {}}
      />
    );

    // Should only have the wrapper div with no inner section
    const stage = container.querySelector('.rest-timer-stage');
    expect(stage).toBeInTheDocument();
    expect(stage.innerHTML).toBe('');
  });

  test('should render timer remaining seconds correctly formatted as MM:SS', () => {
    const timer = {
      remainingSeconds: 75, // 01:15
      durationSeconds: 120,
      isPaused: false,
      mode: 'set',
      exerciseName: 'Squats',
      setNumber: 2,
    };

    render(
      <RestTimer
        timer={timer}
        isVisible={true}
        onTogglePause={() => {}}
        onDismiss={() => {}}
      />
    );

    expect(screen.getByText('01:15')).toBeInTheDocument();
  });

  test('should render correct title and labels for set mode rest', () => {
    const timer = {
      remainingSeconds: 45,
      durationSeconds: 90,
      isPaused: false,
      mode: 'set',
      exerciseName: 'Squats',
      setNumber: 3,
    };

    const { container } = render(
      <RestTimer
        timer={timer}
        isVisible={true}
        onTogglePause={() => {}}
        onDismiss={() => {}}
      />
    );

    const section = container.querySelector('section.rest-timer');
    expect(section).toBeInTheDocument();
    expect(section.getAttribute('title')).toBe('Squats 3세트 후 휴식');
  });

  test('should render correct title and labels for exercise mode rest', () => {
    const timer = {
      remainingSeconds: 45,
      durationSeconds: 120,
      isPaused: false,
      mode: 'exercise',
      exerciseName: 'Bench Press',
      nextExerciseName: 'Incline Row',
      setNumber: 4,
    };

    const { container } = render(
      <RestTimer
        timer={timer}
        isVisible={true}
        onTogglePause={() => {}}
        onDismiss={() => {}}
      />
    );

    const section = container.querySelector('section.rest-timer');
    expect(section).toBeInTheDocument();
    expect(section.getAttribute('title')).toBe('Bench Press 완료, Incline Row 전 휴식');
  });

  test('should trigger onTogglePause callback when pause/play button clicked', async () => {
    const user = userEvent.setup();
    const handleTogglePause = vi.fn();
    const timer = {
      remainingSeconds: 45,
      durationSeconds: 90,
      isPaused: false, // will show pause icon, clicking pauses
      mode: 'set',
      exerciseName: 'Squats',
      setNumber: 1,
    };

    render(
      <RestTimer
        timer={timer}
        isVisible={true}
        onTogglePause={handleTogglePause}
        onDismiss={() => {}}
      />
    );

    const pauseBtn = screen.getByRole('button', { name: /휴식 타이머 일시정지/i });
    await user.click(pauseBtn);
    expect(handleTogglePause).toHaveBeenCalledTimes(1);
  });

  test('should trigger onDismiss callback when close button clicked', async () => {
    const user = userEvent.setup();
    const handleDismiss = vi.fn();
    const timer = {
      remainingSeconds: 45,
      durationSeconds: 90,
      isPaused: true,
      mode: 'set',
      exerciseName: 'Squats',
      setNumber: 1,
    };

    render(
      <RestTimer
        timer={timer}
        isVisible={true}
        onTogglePause={() => {}}
        onDismiss={handleDismiss}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /휴식 타이머 닫기/i });
    await user.click(closeBtn);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  test('should disable play/pause button when remainingSeconds is 0', () => {
    const timer = {
      remainingSeconds: 0,
      durationSeconds: 90,
      isPaused: false,
      mode: 'set',
      exerciseName: 'Squats',
      setNumber: 1,
    };

    const { container } = render(
      <RestTimer
        timer={timer}
        isVisible={true}
        onTogglePause={() => {}}
        onDismiss={() => {}}
      />
    );

    const pauseBtn = screen.getByRole('button', { name: /휴식 타이머 일시정지/i });
    expect(pauseBtn).toBeDisabled();
    
    const section = container.querySelector('section.rest-timer');
    expect(section).toHaveClass('is-complete');
  });
});
import '@testing-library/jest-dom'; // provides custom matchers like toBeDisabled / toHaveClass
