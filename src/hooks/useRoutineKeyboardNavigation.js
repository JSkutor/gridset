function focusElement(element, delay = 0) {
  setTimeout(() => {
    element?.focus();
    element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, delay);
}

function swapItems(items, fromIndex, toIndex) {
  const nextItems = [...items];
  const temp = nextItems[fromIndex];
  nextItems[fromIndex] = nextItems[toIndex];
  nextItems[toIndex] = temp;
  return nextItems;
}

export function useRoutineKeyboardNavigation({
  effectiveRoutineId,
  effectiveSessionId,
  effectiveRoutineSessions,
  activeSessionExercises,
  sessionExercises,
  selectedExerciseId,
  isAddingExerciseRow,
  sessionRefs,
  exerciseRefs,
  settingControlRefs,
  addExerciseBtnRef,
  reorderSessions,
  reorderSessionExercises,
  onSelectSession,
  setSelectedSessionId,
  setSelectedExerciseId,
  setIsAddingExerciseRow,
}) {
  const focusSessionById = (id, delay = 0) => {
    focusElement(sessionRefs.current[id], delay);
  };

  const focusExerciseById = (id, delay = 0) => {
    focusElement(exerciseRefs.current[id], delay);
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
    const el = settingControlRefs.current[index];
    if (el && document.body.contains(el)) {
      focusElement(el);
    }
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

  const handleSettingValueKeyDown = (event, index, onIncrement, onDecrement) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (event.metaKey || event.ctrlKey) {
        onIncrement();
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
        onDecrement();
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
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const isReordering = event.metaKey || event.ctrlKey;
        const nextIndex = index + 1;
        if (nextIndex < effectiveRoutineSessions.length) {
          if (isReordering) {
            const currentSessionId = effectiveRoutineSessions[index].id;
            const reorderedSessions = swapItems(effectiveRoutineSessions, index, nextIndex);
            reorderSessions(effectiveRoutineId, reorderedSessions.map(s => s.id));
            // 리렌더링 완료 후 포커스 — ID를 사용하여 올바른 세션을 정확하게 포커스
            focusSessionById(currentSessionId, 20);
          } else {
            onSelectSession(effectiveRoutineSessions[nextIndex].id);
            focusSession(nextIndex);
          }
        }
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const isReordering = event.metaKey || event.ctrlKey;
        const prevIndex = index - 1;
        if (prevIndex >= 0) {
          if (isReordering) {
            const currentSessionId = effectiveRoutineSessions[index].id;
            const reorderedSessions = swapItems(effectiveRoutineSessions, index, prevIndex);
            reorderSessions(effectiveRoutineId, reorderedSessions.map(s => s.id));
            // 리렌더링 완료 후 포커스
            focusSessionById(currentSessionId, 20);
          } else {
            onSelectSession(effectiveRoutineSessions[prevIndex].id);
            focusSession(prevIndex);
          }
        }
        break;
      }
      case 'ArrowRight': {
        event.preventDefault();
        if (activeSessionExercises.length > 0) {
          setSelectedExerciseId(activeSessionExercises[0].id);
          focusExercise(0);
        }
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        onSelectSession(effectiveRoutineSessions[index].id);
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
            const currentExerciseId = activeSessionExercises[index].id;
            const reorderedExercises = swapItems(activeSessionExercises, index, nextIndex);
            reorderSessionExercises(effectiveSessionId, reorderedExercises.map(se => se.id));
            // 리렌더링 완료 후 포커스
            focusExerciseById(currentExerciseId, 20);
          } else {
            setSelectedExerciseId(activeSessionExercises[nextIndex].id);
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
            const currentExerciseId = activeSessionExercises[index].id;
            const reorderedExercises = swapItems(activeSessionExercises, index, prevIndex);
            reorderSessionExercises(effectiveSessionId, reorderedExercises.map(se => se.id));
            // 리렌더링 완료 후 포커스
            focusExerciseById(currentExerciseId, 20);
          } else {
            setSelectedExerciseId(activeSessionExercises[prevIndex].id);
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
        focusSettingControl(0);
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const exerciseId = activeSessionExercises[index].id;
        setSelectedExerciseId(selectedExerciseId === exerciseId ? null : exerciseId);
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
        focusExercise(lastIndex);
      }
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusActiveSessionRow();
    }
  };

  const focusFirstSessionFirstExercise = () => {
    if (effectiveRoutineSessions.length === 0) return;

    const firstSession = effectiveRoutineSessions[0];
    setSelectedSessionId(firstSession.id);
    setSelectedExerciseId(null);
    setIsAddingExerciseRow(false);

    setTimeout(() => {
      const exercisesOfFirstSession = sessionExercises
        .filter(se => se.session_id === firstSession.id)
        .sort((a, b) => a.order - b.order);

      if (exercisesOfFirstSession.length > 0) {
        setSelectedExerciseId(exercisesOfFirstSession[0].id);
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
    handleAddExerciseButtonKeyDown,
    focusFirstSessionFirstExercise,
    focusExercise,
  };
}
