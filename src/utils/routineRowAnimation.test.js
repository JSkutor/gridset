import { describe, expect, test } from 'vitest';
import {
  ROUTINE_ROW_LAYOUT_TRANSITION,
  getRoutineRowAnimation,
  getRoutineRowHoverAnimation,
} from './routineRowAnimation';

describe('routine row animation contract', () => {
  test('highlights only the row that belongs to the focused panel', () => {
    expect(getRoutineRowAnimation(true)).toMatchObject({
      scale: 1.025,
      y: -2,
      zIndex: 10,
      borderColor: 'var(--border-focus)',
      backgroundColor: 'rgba(22, 26, 42, 0.88)',
    });
  });

  test('keeps inactive panel rows visually idle', () => {
    expect(getRoutineRowAnimation(false)).toEqual({
      scale: 1,
      y: 0,
      boxShadow: '0 0 0px rgba(0,0,0,0)',
      zIndex: 1,
      borderColor: 'transparent',
      backgroundColor: 'rgba(22, 26, 42, 0)',
    });
  });

  test('uses a shared spring layout transition for session and exercise rows', () => {
    expect(ROUTINE_ROW_LAYOUT_TRANSITION).toEqual({
      type: 'spring',
      stiffness: 350,
      damping: 30,
      layout: { type: 'spring', stiffness: 460, damping: 36 },
    });
  });

  test('does not apply hover animation on the highlighted row', () => {
    expect(getRoutineRowHoverAnimation(true)).toBeUndefined();
    expect(getRoutineRowHoverAnimation(false)).toEqual({
      backgroundColor: 'rgba(255, 255, 255, 0.03)',
    });
  });
});
