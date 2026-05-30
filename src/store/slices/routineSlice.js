import {
  MAX_SESSIONS_PER_ROUTINE,
  TEMPORARY_SESSION_ORDER,
  getRegularRoutineSessions,
  getRoutineTemporarySession,
  isTemporarySession,
} from '../../utils/sessionHelper.js';
import {
  MAX_GROUPS_PER_SESSION,
  MIN_GROUP_SIZE,
  applyGroupTargetSets,
  cleanGroupName,
  findFirstAvailableGroupStart,
  findGroupForSessionExercise,
  getLinksCoveredByGroup,
  getNextGroupColor,
  getSessionExerciseLinks,
  getSessionGroups,
  normalizeGroupPlacement,
  normalizeGroupPlacementWithoutOverlap,
  withGroupColor,
} from '../../utils/sessionExerciseGroups.js';
import { generateUUID } from '../../data/dummyGenerator.js';
import * as workoutRepository from '../../api/supabaseWorkoutRepository.js';
import { initialSeed } from './authSlice.js';

export const createRoutineSlice = (set, get) => ({
  // --- State ---
  routines: initialSeed.routines,
  sessions: initialSeed.sessions,
  sessionExercises: initialSeed.sessionExercises,
  sessionExerciseGroups: initialSeed.sessionExerciseGroups || [],

  // --- Actions ---
  addRoutine: (name) => {
    const { currentUser, routines } = get();
    const cleanName = (name || '').trim().slice(0, 100) || `새 루틴 ${routines.length + 1}`;
    const newRoutine = {
      id: generateUUID(),
      name: cleanName,
      user_id: currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    set((state) => ({ routines: [...state.routines, newRoutine] }));

    if (!currentUser.isGuest) {
      get().runRemoteSync('addRoutine', () => workoutRepository.upsertRows('routines', [newRoutine]));
    }

    return newRoutine;
  },

  deleteRoutine: (id) => {
    const { currentUser, sessions } = get();
    const sessionsToDelete = sessions.filter(s => s.routine_id === id);
    const sessionIdsToDelete = sessionsToDelete.map(s => s.id);
    
    set((state) => ({
      routines: state.routines.filter(r => r.id !== id),
      sessions: state.sessions.filter(s => s.routine_id !== id),
      sessionExercises: state.sessionExercises.filter(se => !sessionIdsToDelete.includes(se.session_id)),
      sessionExerciseGroups: state.sessionExerciseGroups.filter(group => !sessionIdsToDelete.includes(group.session_id))
    }));

    if (!currentUser.isGuest) {
      get().runRemoteSync('deleteRoutine', () => workoutRepository.deleteRow('routines', id));
    }
  },

  updateRoutine: (id, name) => {
    const { currentUser } = get();
    const cleanName = (name || '').trim().slice(0, 100) || '이름 없는 루틴';
    const updatedAt = new Date().toISOString();
    
    set((state) => ({
      routines: state.routines.map(r => r.id === id ? { ...r, name: cleanName, updated_at: updatedAt } : r)
    }));

    if (!currentUser.isGuest) {
      get().runRemoteSync('updateRoutine', () =>
        workoutRepository.updateRow('routines', id, { name: cleanName, updated_at: updatedAt }),
      );
    }
  },

  duplicateRoutine: (sourceRoutineId) => {
    const { currentUser, routines, sessions, sessionExercises } = get();
    const sourceRoutine = routines.find(r => r.id === sourceRoutineId);
    if (!sourceRoutine) return null;

    const newRoutineId = generateUUID();
    const newRoutine = {
      id: newRoutineId,
      name: `${sourceRoutine.name} 복사`,
      user_id: currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const sessionsToCopy = sessions.filter(s => s.routine_id === sourceRoutineId);
    const newSessions = [];
    const newSessionExercises = [];
    const newSessionExerciseGroups = [];
    const sessionIdMap = new Map();

    sessionsToCopy.forEach(s => {
      const newSessionId = generateUUID();
      sessionIdMap.set(s.id, newSessionId);
      newSessions.push({
        id: newSessionId,
        name: s.name,
        routine_id: newRoutineId,
        session_order: s.session_order,
        user_id: currentUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const exercisesToCopy = sessionExercises.filter(se => se.session_id === s.id);
      exercisesToCopy.forEach(se => {
        newSessionExercises.push({
          id: generateUUID(),
          session_id: newSessionId,
          exercise_id: se.exercise_id,
          order: se.order,
          target_sets: se.target_sets,
          target_record: se.target_record,
          rest_between_sets: se.rest_between_sets,
          rest_after_exercise: se.rest_after_exercise,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      });
    });

    (get().sessionExerciseGroups || [])
      .filter(group => sessionIdMap.has(group.session_id))
      .forEach(group => {
        newSessionExerciseGroups.push({
          ...withGroupColor(group, get().sessionExerciseGroups || []),
          id: generateUUID(),
          session_id: sessionIdMap.get(group.session_id),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      });

    set((state) => ({
      routines: [...state.routines, newRoutine],
      sessions: [...state.sessions, ...newSessions],
      sessionExercises: [...state.sessionExercises, ...newSessionExercises],
      sessionExerciseGroups: [...state.sessionExerciseGroups, ...newSessionExerciseGroups]
    }));

    if (!currentUser.isGuest) {
      get().runRemoteSync('duplicateRoutine', async () => {
        await get().syncExercisesForReferences(newSessionExercises.map(se => se.exercise_id), currentUser.id);
        await workoutRepository.upsertRows('routines', [newRoutine]);
        await workoutRepository.upsertRows('sessions', newSessions);
        await workoutRepository.upsertRows('session_exercises', newSessionExercises);
        await workoutRepository.upsertRows('session_exercise_groups', newSessionExerciseGroups);
      });
    }

    return newRoutine;
  },

  addSession: (routine_id, name) => {
    const { currentUser, sessions } = get();
    const routineSessions = getRegularRoutineSessions(sessions, routine_id);
    if (routineSessions.length >= MAX_SESSIONS_PER_ROUTINE) return null;

    const cleanName = (name || '').trim().slice(0, 100) || `새 세션 ${routineSessions.length + 1}`;
    const nextOrder = routineSessions.length + 1;
    const newSession = {
      id: generateUUID(),
      name: cleanName,
      routine_id,
      session_order: nextOrder,
      user_id: currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    set((state) => ({ sessions: [...state.sessions, newSession] }));

    if (!currentUser.isGuest) {
      get().runRemoteSync('addSession', () => workoutRepository.upsertRows('sessions', [newSession]));
    }

    return newSession;
  },

  createTemporarySession: (routine_id, name = '임시 세션') => {
    if (!routine_id) return null;
    const { currentUser, sessions } = get();
    const existingTemporarySession = getRoutineTemporarySession(sessions, routine_id);
    if (existingTemporarySession) return existingTemporarySession;

    const cleanName = (name || '').trim().slice(0, 100) || '임시 세션';
    const createdAt = new Date().toISOString();
    const newSession = {
      id: generateUUID(),
      name: cleanName,
      routine_id,
      session_order: TEMPORARY_SESSION_ORDER,
      user_id: currentUser.id,
      created_at: createdAt,
      updated_at: createdAt
    };

    set((state) => ({ sessions: [...state.sessions, newSession] }));

    if (!currentUser.isGuest) {
      get().runRemoteSync('createTemporarySession', () => workoutRepository.upsertRows('sessions', [newSession]));
    }

    return newSession;
  },

  deleteSession: (id) => {
    const { currentUser, sessions } = get();
    const sessionToDelete = sessions.find(s => s.id === id);
    if (!sessionToDelete) return;

    const routineId = sessionToDelete.routine_id;
    let finalSessions = [];

    set((state) => {
      const remainingSessions = state.sessions.filter(sn => sn.id !== id);
      
      const routineSessions = remainingSessions
        .filter(s => s.routine_id === routineId && !isTemporarySession(s))
        .sort((a, b) => (a.session_order || 0) - (b.session_order || 0));

      const orderMap = new Map();
      routineSessions.forEach((s, idx) => {
        orderMap.set(s.id, idx + 1);
      });

      finalSessions = remainingSessions.map(s => {
        if (s.routine_id === routineId && !isTemporarySession(s)) {
          return { ...s, session_order: orderMap.get(s.id) || 1 };
        }
        return s;
      });

      return {
        sessions: finalSessions,
        sessionExercises: state.sessionExercises.filter(se => se.session_id !== id),
        sessionExerciseGroups: state.sessionExerciseGroups.filter(group => group.session_id !== id)
      };
    });

    if (!currentUser.isGuest) {
      const sessionsToUpsert = finalSessions.filter(s => s.routine_id === routineId);
      get().runRemoteSync('deleteSession', async () => {
        await workoutRepository.deleteRow('sessions', id);
        await workoutRepository.upsertRows('sessions', sessionsToUpsert);
      });
    }
  },

  updateSession: (id, name) => {
    const { currentUser } = get();
    const cleanName = (name || '').trim().slice(0, 100) || '이름 없는 세션';
    const updatedAt = new Date().toISOString();
    
    set((state) => ({
      sessions: state.sessions.map(s => s.id === id ? { ...s, name: cleanName, updated_at: updatedAt } : s)
    }));

    if (!currentUser.isGuest) {
      get().runRemoteSync('updateSession', () =>
        workoutRepository.updateRow('sessions', id, { name: cleanName, updated_at: updatedAt }),
      );
    }
  },

  reorderSessions: (routine_id, orderedSessionIds) => {
    const { currentUser } = get();
    let updatedSessions = [];
    
    set((state) => {
      updatedSessions = state.sessions.map(s => {
        if (s.routine_id === routine_id && !isTemporarySession(s)) {
          const newOrderIndex = orderedSessionIds.indexOf(s.id);
          if (newOrderIndex !== -1) {
            return { ...s, session_order: newOrderIndex + 1, updated_at: new Date().toISOString() };
          }
        }
        return s;
      });
      return { sessions: updatedSessions };
    });

    if (!currentUser.isGuest) {
      const sessionsToUpsert = updatedSessions.filter(s => s.routine_id === routine_id);
      get().runRemoteSync('reorderSessions', () => workoutRepository.upsertRows('sessions', sessionsToUpsert));
    }
  },

  addSessionExercise: (session_id, exercise_id, order, target_sets, target_record) => {
    const { currentUser } = get();
    const newSessionExercise = {
      id: generateUUID(),
      session_id,
      exercise_id,
      order,
      target_sets,
      target_record,
      rest_between_sets: 90,
      rest_after_exercise: 120, 
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    set((state) => ({ sessionExercises: [...state.sessionExercises, newSessionExercise] }));

    if (!currentUser.isGuest) {
      get().runRemoteSync('addSessionExercise', async () => {
        await get().syncExercisesForReferences([exercise_id], currentUser.id);
        await workoutRepository.upsertRows('session_exercises', [newSessionExercise]);
      });
    }

    return newSessionExercise;
  },

  deleteSessionExercise: (id) => {
    const { currentUser, sessionExercises } = get();
    const exerciseToDelete = sessionExercises.find(se => se.id === id);
    if (!exerciseToDelete) return;

    const sessionId = exerciseToDelete.session_id;
    const deletedOrder = Number(exerciseToDelete.order) || 0;
    let finalExercises = [];
    let finalGroups = [];
    let deletedGroups = [];

    set((state) => {
      const remainingExercises = state.sessionExercises.filter(se => se.id !== id);

      const sessionExs = remainingExercises
        .filter(se => se.session_id === sessionId)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      const orderMap = new Map();
      sessionExs.forEach((se, idx) => {
        orderMap.set(se.id, idx + 1);
      });

      finalExercises = remainingExercises.map(se => {
        if (se.session_id === sessionId) {
          return { ...se, order: orderMap.get(se.id) || 1, updated_at: new Date().toISOString() };
        }
        return se;
      });

      const remainingCount = sessionExs.length;
      const updatedAt = new Date().toISOString();
      deletedGroups = [];
      finalGroups = state.sessionExerciseGroups.reduce((groups, group) => {
        if (group.session_id !== sessionId) {
          groups.push(group);
          return groups;
        }

        let startOrder = Number(group.start_order) || 1;
        let size = Number(group.size) || MIN_GROUP_SIZE;
        const endOrder = startOrder + size - 1;

        if (deletedOrder < startOrder) {
          startOrder -= 1;
        } else if (deletedOrder >= startOrder && deletedOrder <= endOrder) {
          size -= 1;
        }

        const normalizedGroup = normalizeGroupPlacement(
          { ...group, start_order: startOrder, size, updated_at: updatedAt },
          remainingCount,
        );

        if (!normalizedGroup) {
          deletedGroups.push(group);
          return groups;
        }

        groups.push(normalizedGroup);
        return groups;
      }, []);

      return {
        sessionExercises: finalExercises,
        sessionExerciseGroups: finalGroups,
      };
    });

    if (!currentUser.isGuest) {
      const exercisesToUpsert = finalExercises.filter(se => se.session_id === sessionId);
      const groupsToUpsert = finalGroups.filter(group => group.session_id === sessionId);
      get().runRemoteSync('deleteSessionExercise', async () => {
        await workoutRepository.deleteRow('session_exercises', id);
        await workoutRepository.upsertRows('session_exercises', exercisesToUpsert);
        await workoutRepository.upsertRows('session_exercise_groups', groupsToUpsert);
        await Promise.all(deletedGroups.map(group => workoutRepository.deleteRow('session_exercise_groups', group.id)));
      });
    }
  },

  updateSessionExercise: (id, updates) => {
    const { currentUser, sessionExercises, sessionExerciseGroups } = get();
    const updatedAt = new Date().toISOString();
    const currentLink = sessionExercises.find(se => se.id === id);
    const targetGroup = 'target_sets' in updates
      ? findGroupForSessionExercise(sessionExerciseGroups, currentLink)
      : null;
    let changedLinks = [];
    
    set((state) => ({
      sessionExercises: state.sessionExercises.map(se => {
        const isCurrentLink = se.id === id;
        const isGroupedLink = targetGroup
          ? getLinksCoveredByGroup(state.sessionExercises, targetGroup).some(link => link.id === se.id)
          : false;

        if (!isCurrentLink && !isGroupedLink) return se;

        const nextLink = {
          ...se,
          ...(isGroupedLink && 'target_sets' in updates ? { target_sets: updates.target_sets } : {}),
          ...(isCurrentLink ? updates : {}),
          updated_at: updatedAt,
        };
        changedLinks.push(nextLink);
        return nextLink;
      })
    }));

    if (!currentUser.isGuest) {
      get().runRemoteSync('updateSessionExercise', () =>
        changedLinks.length > 1
          ? workoutRepository.upsertRows('session_exercises', changedLinks)
          : workoutRepository.updateRow('session_exercises', id, { ...updates, updated_at: updatedAt }),
      );
    }
  },

  reorderSessionExercises: (session_id, orderedExerciseLinkIds) => {
    const { currentUser } = get();
    let updatedExercises = [];
    
    set((state) => {
      const updatedAt = new Date().toISOString();
      updatedExercises = state.sessionExercises.map(se => {
        if (se.session_id === session_id) {
          const newOrderIndex = orderedExerciseLinkIds.indexOf(se.id);
          if (newOrderIndex !== -1) {
            return { ...se, order: newOrderIndex + 1, updated_at: updatedAt };
          }
        }
        return se;
      });

      state.sessionExerciseGroups
        .filter(group => group.session_id === session_id)
        .forEach(group => {
          const result = applyGroupTargetSets(updatedExercises, group, updatedAt);
          updatedExercises = result.sessionExercises;
        });

      return { sessionExercises: updatedExercises };
    });

    if (!currentUser.isGuest) {
      const exercisesToUpsert = updatedExercises.filter(se => se.session_id === session_id);
      get().runRemoteSync('reorderSessionExercises', () =>
        workoutRepository.upsertRows('session_exercises', exercisesToUpsert),
      );
    }
  },

  addSessionExerciseGroup: (session_id, name, size = MIN_GROUP_SIZE) => {
    const { currentUser, sessionExercises, sessionExerciseGroups } = get();
    const sessionLinks = getSessionExerciseLinks(sessionExercises, session_id);
    const existingGroups = getSessionGroups(sessionExerciseGroups, session_id);
    if (existingGroups.length >= MAX_GROUPS_PER_SESSION) return null;

    const exerciseCount = sessionLinks.length;
    if (exerciseCount < MIN_GROUP_SIZE) return null;
    const rawSize = Number.parseInt(size, 10);
    const normalizedSize = Math.min(
      exerciseCount,
      Math.max(MIN_GROUP_SIZE, Number.isFinite(rawSize) ? rawSize : MIN_GROUP_SIZE),
    );
    const startOrder = findFirstAvailableGroupStart(normalizedSize, existingGroups, exerciseCount);
    if (startOrder === null) return null;

    const createdAt = new Date().toISOString();
    const normalizedGroup = normalizeGroupPlacement({
      id: generateUUID(),
      session_id,
      name: cleanGroupName(name, `그룹 ${sessionExerciseGroups.filter(group => group.session_id === session_id).length + 1}`),
      start_order: startOrder,
      size: normalizedSize,
      color: getNextGroupColor(sessionExerciseGroups, session_id),
      created_at: createdAt,
      updated_at: createdAt,
    }, sessionLinks.length);

    if (!normalizedGroup) return null;

    let touchedLinks = [];
    set((state) => {
      const result = applyGroupTargetSets(state.sessionExercises, normalizedGroup, createdAt);
      touchedLinks = result.touchedLinks;
      return {
        sessionExercises: result.sessionExercises,
        sessionExerciseGroups: [...state.sessionExerciseGroups, normalizedGroup],
      };
    });

    if (!currentUser.isGuest) {
      get().runRemoteSync('addSessionExerciseGroup', async () => {
        await workoutRepository.upsertRows('session_exercise_groups', [normalizedGroup]);
        await workoutRepository.upsertRows('session_exercises', touchedLinks);
      });
    }

    return normalizedGroup;
  },

  updateSessionExerciseGroup: (id, updates) => {
    const { currentUser, sessionExerciseGroups, sessionExercises } = get();
    const group = sessionExerciseGroups.find(item => item.id === id);
    if (!group) return null;

    const updatedAt = new Date().toISOString();
    const sessionLinkCount = getSessionExerciseLinks(sessionExercises, group.session_id).length;
    const otherGroups = getSessionGroups(sessionExerciseGroups, group.session_id, id);
    const direction = 'start_order' in updates
      ? Math.sign((Number(updates.start_order) || Number(group.start_order) || 1) - (Number(group.start_order) || 1))
      : 0;
    const normalizedGroup = normalizeGroupPlacementWithoutOverlap({
      ...withGroupColor(group, sessionExerciseGroups),
      ...updates,
      name: 'name' in updates ? cleanGroupName(updates.name, group.name) : group.name,
      updated_at: updatedAt,
    }, sessionLinkCount, otherGroups, direction);

    if (!normalizedGroup) return null;

    let touchedLinks = [];
    set((state) => {
      const result = applyGroupTargetSets(state.sessionExercises, normalizedGroup, updatedAt);
      touchedLinks = result.touchedLinks;
      return {
        sessionExercises: result.sessionExercises,
        sessionExerciseGroups: state.sessionExerciseGroups.map(item =>
          item.id === id ? normalizedGroup : item
        ),
      };
    });

    if (!currentUser.isGuest) {
      get().runRemoteSync('updateSessionExerciseGroup', async () => {
        await workoutRepository.upsertRows('session_exercise_groups', [normalizedGroup]);
        await workoutRepository.upsertRows('session_exercises', touchedLinks);
      });
    }

    return normalizedGroup;
  },

  deleteSessionExerciseGroup: (id) => {
    const { currentUser } = get();
    set((state) => ({
      sessionExerciseGroups: state.sessionExerciseGroups.filter(group => group.id !== id),
    }));

    if (!currentUser.isGuest) {
      get().runRemoteSync('deleteSessionExerciseGroup', () =>
        workoutRepository.deleteRow('session_exercise_groups', id),
      );
    }
  },
});
