import { describe, expect, test } from 'vitest';
import {
  GROUP_COLOR_PALETTE,
  applyGroupTargetSets,
  cleanGroupName,
  findFirstAvailableGroupStart,
  getLargestAvailableGroupSize,
  getLinksCoveredByGroup,
  getNextGroupColor,
  groupsOverlap,
  normalizeGroupPlacement,
  normalizeGroupPlacementWithoutOverlap,
} from './sessionExerciseGroups.js';

const sessionId = 'session-1';

function makeLinks(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `link-${index + 1}`,
    session_id: sessionId,
    exercise_id: `exercise-${index + 1}`,
    order: index + 1,
    target_sets: index === 0 ? 4 : 3,
    target_record: '10',
    rest_between_sets: index === 0 ? 100 : 90,
    rest_after_exercise: index === 0 ? 150 : 120,
  }));
}

describe('sessionExerciseGroups', () => {
  test('normalizes names and group bounds', () => {
    expect(cleanGroupName('  슈퍼세트 A  ')).toBe('슈퍼세트 A');
    expect(cleanGroupName('', '그룹 1')).toBe('그룹 1');

    expect(normalizeGroupPlacement({ start_order: -10, size: 1 }, 5)).toMatchObject({
      start_order: 1,
      size: 2,
    });
    expect(normalizeGroupPlacement({ start_order: 99, size: 9 }, 5)).toMatchObject({
      start_order: 1,
      size: 5,
    });
    expect(normalizeGroupPlacement({ start_order: 1, size: 2 }, 1)).toBeNull();
  });

  test('finds available ranges and detects overlap', () => {
    const groups = [
      { id: 'group-1', session_id: sessionId, start_order: 1, size: 2 },
      { id: 'group-2', session_id: sessionId, start_order: 5, size: 2 },
    ];

    expect(groupsOverlap({ start_order: 2, size: 2 }, groups[0])).toBe(true);
    expect(groupsOverlap({ start_order: 3, size: 2 }, groups[0])).toBe(false);
    expect(findFirstAvailableGroupStart(2, groups, 8)).toBe(3);
    expect(getLargestAvailableGroupSize(8, groups)).toBe(2);
  });

  test('moves groups over occupied ranges without overlapping', () => {
    const groups = [
      { id: 'group-1', session_id: sessionId, start_order: 1, size: 2 },
      { id: 'group-2', session_id: sessionId, start_order: 5, size: 2 },
    ];

    expect(
      normalizeGroupPlacementWithoutOverlap(
        { id: 'moving', session_id: sessionId, start_order: 2, size: 2 },
        8,
        groups,
        1,
      ),
    ).toMatchObject({ start_order: 3, size: 2 });

    expect(
      normalizeGroupPlacementWithoutOverlap(
        { id: 'moving', session_id: sessionId, start_order: 5, size: 2 },
        8,
        groups,
        1,
      ),
    ).toMatchObject({ start_order: 7, size: 2 });

    expect(
      normalizeGroupPlacementWithoutOverlap(
        { id: 'moving', session_id: sessionId, start_order: 5, size: 2 },
        8,
        groups,
        -1,
      ),
    ).toMatchObject({ start_order: 3, size: 2 });
  });

  test('assigns the first unused color in a session', () => {
    expect(
      getNextGroupColor([
        { session_id: sessionId, color: GROUP_COLOR_PALETTE[0] },
        { session_id: sessionId, color: GROUP_COLOR_PALETTE[1] },
        { session_id: 'other-session', color: GROUP_COLOR_PALETTE[2] },
      ], sessionId),
    ).toBe(GROUP_COLOR_PALETTE[2]);
  });

  test('returns covered links and unifies target sets and rest times inside a group', () => {
    const links = makeLinks(4);
    const group = { id: 'group-1', session_id: sessionId, start_order: 1, size: 3 };

    expect(getLinksCoveredByGroup(links, group).map(link => link.id)).toEqual(['link-1', 'link-2', 'link-3']);

    const result = applyGroupTargetSets(links, group, '2026-05-30T00:00:00.000Z');

    expect(result.touchedLinks.map(link => link.id)).toEqual(['link-1', 'link-2', 'link-3']);
    expect(result.sessionExercises.map(link => link.target_sets)).toEqual([4, 4, 4, 3]);
    expect(result.sessionExercises.map(link => link.rest_between_sets)).toEqual([100, 100, 100, 90]);
    expect(result.sessionExercises.map(link => link.rest_after_exercise)).toEqual([150, 150, 150, 120]);
  });
});
