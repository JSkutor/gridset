export const MIN_GROUP_SIZE = 2;
export const MAX_GROUPS_PER_SESSION = 4;
export const GROUP_COLOR_PALETTE = ['#7aa2f7', '#9ece6a', '#e0af68', '#f7768e'];

export function cleanGroupName(name, fallback = '그룹') {
  return (name || '').trim().slice(0, 40) || fallback;
}

export function getSessionExerciseLinks(sessionExercises, sessionId) {
  return sessionExercises
    .filter((sessionExercise) => sessionExercise.session_id === sessionId)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function normalizeGroupPlacement(group, exerciseCount) {
  if (exerciseCount < MIN_GROUP_SIZE) return null;

  const rawSize = Number.parseInt(group.size, 10);
  const size = Math.min(
    exerciseCount,
    Math.max(MIN_GROUP_SIZE, Number.isFinite(rawSize) ? rawSize : MIN_GROUP_SIZE),
  );
  const maxStart = Math.max(1, exerciseCount - size + 1);
  const rawStart = Number.parseInt(group.start_order, 10);
  const startOrder = Math.min(
    maxStart,
    Math.max(1, Number.isFinite(rawStart) ? rawStart : 1),
  );

  return {
    ...group,
    start_order: startOrder,
    size,
  };
}

export function getGroupEnd(group) {
  return (Number(group.start_order) || 1) + (Number(group.size) || MIN_GROUP_SIZE) - 1;
}

export function groupsOverlap(a, b) {
  return (Number(a.start_order) || 1) <= getGroupEnd(b) && (Number(b.start_order) || 1) <= getGroupEnd(a);
}

export function getSessionGroups(sessionExerciseGroups, sessionId, excludeId = null) {
  return sessionExerciseGroups
    .filter(group => group.session_id === sessionId && group.id !== excludeId)
    .sort((a, b) => (a.start_order || 0) - (b.start_order || 0));
}

export function findFirstAvailableGroupStart(size, otherGroups, exerciseCount) {
  const maxStart = exerciseCount - size + 1;
  if (maxStart < 1) return null;

  let startOrder = 1;
  for (const group of otherGroups) {
    if (startOrder + size - 1 < (Number(group.start_order) || 1)) {
      return startOrder;
    }
    startOrder = Math.max(startOrder, getGroupEnd(group) + 1);
  }

  return startOrder <= maxStart ? startOrder : null;
}

export function findNonOverlappingGroupStart(candidateStart, size, otherGroups, exerciseCount, direction = 0) {
  const maxStart = exerciseCount - size + 1;
  if (maxStart < 1) return null;

  const normalizedStart = Math.min(maxStart, Math.max(1, Number(candidateStart) || 1));
  const sortedGroups = [...otherGroups].sort((a, b) => (a.start_order || 0) - (b.start_order || 0));

  const overlapsAt = (startOrder) => sortedGroups.find(group =>
    groupsOverlap({ start_order: startOrder, size }, group)
  );

  if (!overlapsAt(normalizedStart)) return normalizedStart;

  if (direction > 0) {
    let startOrder = normalizedStart;
    while (startOrder <= maxStart) {
      const overlapped = overlapsAt(startOrder);
      if (!overlapped) return startOrder;
      startOrder = getGroupEnd(overlapped) + 1;
    }
    return null;
  }

  if (direction < 0) {
    let startOrder = normalizedStart;
    while (startOrder >= 1) {
      const overlapped = overlapsAt(startOrder);
      if (!overlapped) return startOrder;
      startOrder = (Number(overlapped.start_order) || 1) - size;
    }
    return null;
  }

  for (let startOrder = normalizedStart + 1; startOrder <= maxStart; startOrder += 1) {
    if (!overlapsAt(startOrder)) return startOrder;
  }
  for (let startOrder = normalizedStart - 1; startOrder >= 1; startOrder -= 1) {
    if (!overlapsAt(startOrder)) return startOrder;
  }
  return null;
}

export function normalizeGroupPlacementWithoutOverlap(group, exerciseCount, otherGroups, direction = 0) {
  const normalizedGroup = normalizeGroupPlacement(group, exerciseCount);
  if (!normalizedGroup) return null;

  const startOrder = findNonOverlappingGroupStart(
    normalizedGroup.start_order,
    normalizedGroup.size,
    otherGroups,
    exerciseCount,
    direction,
  );

  if (startOrder === null) return null;
  return { ...normalizedGroup, start_order: startOrder };
}

export function getLargestAvailableGroupSize(exerciseCount, groups = []) {
  if (exerciseCount < MIN_GROUP_SIZE) return 0;

  const sortedGroups = [...groups].sort((a, b) => (a.start_order || 0) - (b.start_order || 0));
  let cursor = 1;
  let largestGap = 0;

  sortedGroups.forEach((group) => {
    const normalizedGroup = normalizeGroupPlacement(group, exerciseCount);
    if (!normalizedGroup) return;

    largestGap = Math.max(largestGap, normalizedGroup.start_order - cursor);
    cursor = Math.max(cursor, getGroupEnd(normalizedGroup) + 1);
  });

  return Math.max(largestGap, exerciseCount - cursor + 1);
}

export function getNextGroupColor(sessionExerciseGroups, sessionId) {
  const usedColors = new Set(
    sessionExerciseGroups
      .filter(group => group.session_id === sessionId)
      .map(group => group.color)
      .filter(Boolean),
  );
  return GROUP_COLOR_PALETTE.find(color => !usedColors.has(color)) || GROUP_COLOR_PALETTE[0];
}

export function withGroupColor(group, sessionExerciseGroups = []) {
  if (group.color) return group;
  const sessionGroups = sessionExerciseGroups.filter(item => item.session_id === group.session_id);
  const paletteIndex = Math.max(0, sessionGroups.findIndex(item => item.id === group.id));
  return { ...group, color: GROUP_COLOR_PALETTE[paletteIndex % GROUP_COLOR_PALETTE.length] };
}

export function getLinksCoveredByGroup(sessionExercises, group) {
  const normalizedGroup = normalizeGroupPlacement(
    group,
    getSessionExerciseLinks(sessionExercises, group.session_id).length,
  );
  if (!normalizedGroup) return [];

  return getSessionExerciseLinks(sessionExercises, group.session_id).slice(
    normalizedGroup.start_order - 1,
    normalizedGroup.start_order - 1 + normalizedGroup.size,
  );
}

export function applyGroupTargetSets(sessionExercises, group, updatedAt) {
  const coveredLinks = getLinksCoveredByGroup(sessionExercises, group);
  if (coveredLinks.length < MIN_GROUP_SIZE) {
    return { sessionExercises, touchedLinks: [] };
  }

  const targetSets = Number(coveredLinks[0].target_sets) || 3;
  const restBetweenSets = coveredLinks[0].rest_between_sets !== undefined ? coveredLinks[0].rest_between_sets : 90;
  const restAfterExercise = coveredLinks[0].rest_after_exercise !== undefined ? coveredLinks[0].rest_after_exercise : 120;

  const coveredIds = new Set(coveredLinks.map((link) => link.id));
  const touchedLinks = [];
  const nextSessionExercises = sessionExercises.map((sessionExercise) => {
    if (!coveredIds.has(sessionExercise.id)) return sessionExercise;
    const nextLink = {
      ...sessionExercise,
      target_sets: targetSets,
      rest_between_sets: restBetweenSets,
      rest_after_exercise: restAfterExercise,
      updated_at: updatedAt,
    };
    touchedLinks.push(nextLink);
    return nextLink;
  });

  return { sessionExercises: nextSessionExercises, touchedLinks };
}

export function findGroupForSessionExercise(sessionExerciseGroups, sessionExercise) {
  if (!sessionExercise) return null;
  const order = Number(sessionExercise.order) || 0;
  return sessionExerciseGroups.find((group) => {
    if (group.session_id !== sessionExercise.session_id) return false;
    const start = Number(group.start_order) || 1;
    const end = start + (Number(group.size) || MIN_GROUP_SIZE) - 1;
    return order >= start && order <= end;
  }) || null;
}
