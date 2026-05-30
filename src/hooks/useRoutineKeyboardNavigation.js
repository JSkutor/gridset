import { swapItems } from '../utils/array.js';
import { findGroupForSessionExercise } from '../utils/sessionExerciseGroups.js';

function focusElement(element, delay = 0) {
  setTimeout(() => {
    element?.focus();
    element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, delay);
}


export function useRoutineKeyboardNavigation({
  effectiveRoutineId,
  effectiveSessionId,
  temporarySessionId,
  effectiveRoutineSessions,
  activeSessionExercises,
  activeSessionExerciseGroups = [],
  sessionExercises,
  selectedExerciseId,
  isAddingExerciseRow,
  sessionRefs,
  exerciseRefs,
  exerciseGroupRefs,
  settingControlRefs,
  addSessionBtnRef,
  addExerciseBtnRef,
  addGroupBtnRef,
  reorderSessions,
  reorderSessionExercises,
  onSelectSession,
  onFocusExerciseSettings = () => {},
  setSelectedSessionId,
  setSelectedExerciseId,
  setSelectedExerciseGroupId = () => {},
  setIsAddingExerciseRow,
  setFocusedRoutinePanel,
  isReadOnly,
}) {
  const focusSessionById = (id, delay = 0) => {
    setFocusedRoutinePanel('sessions');
    focusElement(sessionRefs.current[id], delay);
  };

  const focusExerciseById = (id, delay = 0) => {
    setFocusedRoutinePanel('exercises');
    focusElement(exerciseRefs.current[id], delay);
  };

  const focusExerciseGroupById = (id, delay = 0) => {
    setFocusedRoutinePanel('groups');
    focusElement(exerciseGroupRefs?.current?.[id], delay);
  };

  const focusSession = (index, delay = 0) => {
    const session = effectiveRoutineSessions[index];
    if (session) {
      focusSessionById(session.id, delay);
    }
  };

  const focusExercise = (index, delay = 0) => {
    const exercise = activeSessionExercises[index];
    if (exercise) {
      focusExerciseById(exercise.id, delay);
    }
  };

  const focusSettingControl = (index) => {
    setFocusedRoutinePanel('settings');
    setTimeout(() => {
      const el = settingControlRefs.current[index];
      if (el && document.body.contains(el)) {
        el.focus();
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 20);
  };

  const focusSelectedExerciseRow = () => {
    if (selectedExerciseId) {
      focusExerciseById(selectedExerciseId);
    }
  };

  const focusActiveSessionRow = () => {
    if (effectiveSessionId) {
      focusSessionById(effectiveSessionId);
    }
  };

  const focusAddExerciseButton = () => {
    setSelectedExerciseId(null);
    setSelectedExerciseGroupId(null);
    setFocusedRoutinePanel('exercises');
    focusElement(addExerciseBtnRef.current);
  };

  const focusAddGroupButton = () => {
    setSelectedExerciseGroupId(null);
    setFocusedRoutinePanel('groups');
    focusElement(addGroupBtnRef?.current);
  };

  const handleSettingValueKeyDown = (event, index, onIncrement, onDecrement) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (event.metaKey || event.ctrlKey) {
        if (!isReadOnly) onIncrement();
      } else {
        // 실제 DOM에 부착된 이전 설정 컨트롤 찾기
        let prevIndex = index - 1;
        while (prevIndex >= 0) {
          const el = settingControlRefs.current[prevIndex];
          if (el && document.body.contains(el)) {
            focusSettingControl(prevIndex);
            break;
          }
          prevIndex--;
        }
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (event.metaKey || event.ctrlKey) {
        if (!isReadOnly) onDecrement();
      } else {
        // 실제 DOM에 부착된 다음 설정 컨트롤 찾기
        let nextIndex = index + 1;
        while (nextIndex < settingControlRefs.current.length) {
          const el = settingControlRefs.current[nextIndex];
          if (el && document.body.contains(el)) {
            focusSettingControl(nextIndex);
            break;
          }
          nextIndex++;
        }
      }
    } else if (event.key === 'ArrowLeft' || event.key === 'Escape') {
      event.preventDefault();
      focusSelectedExerciseRow();
    }
  };

  const handleSessionKeyDown = (event, index) => {
    const isTemporary = index === effectiveRoutineSessions.length;

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const isReordering = (event.metaKey || event.ctrlKey) && !isTemporary;
        const nextIndex = index + 1;

        if (!isTemporary && nextIndex < effectiveRoutineSessions.length) {
          if (isReordering) {
            if (isReadOnly) break;
            const currentSessionId = effectiveRoutineSessions[index].id;
            const reorderedSessions = swapItems(effectiveRoutineSessions, index, nextIndex);
            reorderSessions(effectiveRoutineId, reorderedSessions.map(s => s.id));
            focusSessionById(currentSessionId, 20);
          } else {
            onSelectSession(effectiveRoutineSessions[nextIndex].id);
            focusSession(nextIndex);
          }
        } else if (!isReordering) {
          if (!isTemporary && nextIndex === effectiveRoutineSessions.length) {
            if (temporarySessionId) {
              onSelectSession(temporarySessionId);
              focusSessionById(temporarySessionId);
            } else {
              setFocusedRoutinePanel('session-add');
              focusElement(addSessionBtnRef.current);
            }
          } else if (isTemporary) {
            setFocusedRoutinePanel('session-add');
            focusElement(addSessionBtnRef.current);
          }
        }
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const isReordering = (event.metaKey || event.ctrlKey) && !isTemporary;

        if (isTemporary) {
          if (effectiveRoutineSessions.length > 0) {
            const lastRegIndex = effectiveRoutineSessions.length - 1;
            onSelectSession(effectiveRoutineSessions[lastRegIndex].id);
            focusSession(lastRegIndex);
          }
        } else {
          const prevIndex = index - 1;
          if (prevIndex >= 0) {
            if (isReordering) {
              if (isReadOnly) break;
              const currentSessionId = effectiveRoutineSessions[index].id;
              const reorderedSessions = swapItems(effectiveRoutineSessions, index, prevIndex);
              reorderSessions(effectiveRoutineId, reorderedSessions.map(s => s.id));
              focusSessionById(currentSessionId, 20);
            } else {
              onSelectSession(effectiveRoutineSessions[prevIndex].id);
              focusSession(prevIndex);
            }
          }
        }
        break;
      }
      case 'ArrowRight': {
        event.preventDefault();
        if (activeSessionExercises.length > 0) {
          setSelectedExerciseId(activeSessionExercises[0].id);
          setSelectedExerciseGroupId(null);
          focusExercise(0);
        } else if (!isAddingExerciseRow) {
          focusAddExerciseButton();
        }
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        if (isTemporary) {
          onSelectSession(temporarySessionId);
        } else {
          onSelectSession(effectiveRoutineSessions[index].id);
        }
        break;
      }
      default:
        break;
    }
  };

  const handleExerciseKeyDown = (event, index) => {
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const isReordering = event.metaKey || event.ctrlKey;
        const nextIndex = index + 1;
        if (nextIndex < activeSessionExercises.length) {
          if (isReordering) {
            if (isReadOnly) break;
            const currentExerciseId = activeSessionExercises[index].id;
            const reorderedExercises = swapItems(activeSessionExercises, index, nextIndex);
            reorderSessionExercises(effectiveSessionId, reorderedExercises.map(se => se.id));
            // 리렌더링 완료 후 포커스
            focusExerciseById(currentExerciseId, 20);
          } else {
            setSelectedExerciseId(activeSessionExercises[nextIndex].id);
            setSelectedExerciseGroupId(null);
            focusExercise(nextIndex);
          }
        } else if (nextIndex === activeSessionExercises.length && !isAddingExerciseRow) {
          focusElement(addExerciseBtnRef.current);
        }
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const isReordering = event.metaKey || event.ctrlKey;
        const prevIndex = index - 1;
        if (prevIndex >= 0) {
          if (isReordering) {
            if (isReadOnly) break;
            const currentExerciseId = activeSessionExercises[index].id;
            const reorderedExercises = swapItems(activeSessionExercises, index, prevIndex);
            reorderSessionExercises(effectiveSessionId, reorderedExercises.map(se => se.id));
            // 리렌더링 완료 후 포커스
            focusExerciseById(currentExerciseId, 20);
          } else {
            setSelectedExerciseId(activeSessionExercises[prevIndex].id);
            setSelectedExerciseGroupId(null);
            focusExercise(prevIndex);
          }
        }
        break;
      }
      case 'ArrowLeft': {
        event.preventDefault();
        focusActiveSessionRow();
        break;
      }
      case 'ArrowRight': {
        event.preventDefault();
        const group = findGroupForSessionExercise(activeSessionExerciseGroups, activeSessionExercises[index]);
        if (group) {
          setSelectedExerciseGroupId(group.id);
          focusExerciseGroupById(group.id);
        } else {
          onFocusExerciseSettings();
          focusSettingControl(0);
        }
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const exerciseId = activeSessionExercises[index].id;
        setSelectedExerciseId(selectedExerciseId === exerciseId ? null : exerciseId);
        setSelectedExerciseGroupId(null);
        break;
      }
      default:
        break;
    }
  };

  const handleAddExerciseButtonKeyDown = (event) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (activeSessionExercises.length > 0) {
        const lastIndex = activeSessionExercises.length - 1;
        setSelectedExerciseId(activeSessionExercises[lastIndex].id);
        setSelectedExerciseGroupId(null);
        focusExercise(lastIndex);
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (addGroupBtnRef?.current && !addGroupBtnRef.current.disabled) {
        focusAddGroupButton();
      }
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusActiveSessionRow();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      onFocusExerciseSettings();
      focusSettingControl(0);
    }
  };

  const handleAddSessionButtonKeyDown = (event) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (effectiveRoutineSessions.length > 0) {
        const lastIndex = effectiveRoutineSessions.length - 1;
        onSelectSession(effectiveRoutineSessions[lastIndex].id);
        focusSession(lastIndex);
      } else if (temporarySessionId) {
        onSelectSession(temporarySessionId);
        focusSessionById(temporarySessionId);
      }
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (activeSessionExercises.length > 0) {
        setSelectedExerciseId(activeSessionExercises[0].id);
        setSelectedExerciseGroupId(null);
        focusExercise(0);
      } else if (!isAddingExerciseRow) {
        focusAddExerciseButton();
      }
    }
  };

  const focusFirstSessionFirstExercise = () => {
    if (effectiveRoutineSessions.length === 0 && !temporarySessionId) return;

    const firstSession = effectiveRoutineSessions[0] || { id: temporarySessionId };
    setSelectedSessionId(firstSession.id);
    setSelectedExerciseId(null);
    setSelectedExerciseGroupId(null);
    setIsAddingExerciseRow(false);

    setTimeout(() => {
      const exercisesOfFirstSession = sessionExercises
        .filter(se => se.session_id === firstSession.id)
        .sort((a, b) => a.order - b.order);

      if (exercisesOfFirstSession.length > 0) {
        setSelectedExerciseId(exercisesOfFirstSession[0].id);
        setSelectedExerciseGroupId(null);
        focusExerciseById(exercisesOfFirstSession[0].id, 50);
      } else {
        focusSessionById(firstSession.id, 50);
      }
    }, 50);
  };

  return {
    handleSettingValueKeyDown,
    handleSessionKeyDown,
    handleExerciseKeyDown,
    handleAddSessionButtonKeyDown,
    handleAddExerciseButtonKeyDown,
    focusFirstSessionFirstExercise,
    focusExercise,
    focusExerciseGroupById,
    focusSettingControl,
  };
}
