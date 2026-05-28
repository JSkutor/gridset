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
  const focusSession = (index, delay = 0) => {
    focusElement(sessionRefs.current[index], delay);
  };

  const focusExercise = (index, delay = 0) => {
    focusElement(exerciseRefs.current[index], delay);
  };

  const focusSettingControl = (index) => {
    focusElement(settingControlRefs.current[index]);
  };

  const focusSelectedExerciseRow = () => {
    const index = activeSessionExercises.findIndex(se => se.id === selectedExerciseId);
    if (index !== -1) focusExercise(index);
  };

  const focusActiveSessionRow = () => {
    const activeSessionIndex = effectiveRoutineSessions.findIndex(s => s.id === effectiveSessionId);
    if (activeSessionIndex !== -1) focusSession(activeSessionIndex);
  };

  const handleSettingValueKeyDown = (event, index, onIncrement, onDecrement) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (event.metaKey || event.ctrlKey) {
        onIncrement();
      } else if (index > 0) {
        focusSettingControl(index - 1);
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (event.metaKey || event.ctrlKey) {
        onDecrement();
      } else if (index < 3) {
        focusSettingControl(index + 1);
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
            const reorderedSessions = swapItems(effectiveRoutineSessions, index, nextIndex);
            reorderSessions(effectiveRoutineId, reorderedSessions.map(s => s.id));
          } else {
            onSelectSession(effectiveRoutineSessions[nextIndex].id);
          }
          focusSession(nextIndex);
        }
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const isReordering = event.metaKey || event.ctrlKey;
        const prevIndex = index - 1;
        if (prevIndex >= 0) {
          if (isReordering) {
            const reorderedSessions = swapItems(effectiveRoutineSessions, index, prevIndex);
            reorderSessions(effectiveRoutineId, reorderedSessions.map(s => s.id));
          } else {
            onSelectSession(effectiveRoutineSessions[prevIndex].id);
          }
          focusSession(prevIndex);
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
            const reorderedExercises = swapItems(activeSessionExercises, index, nextIndex);
            reorderSessionExercises(effectiveSessionId, reorderedExercises.map(se => se.id));
          } else {
            setSelectedExerciseId(activeSessionExercises[nextIndex].id);
          }
          focusExercise(nextIndex);
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
            const reorderedExercises = swapItems(activeSessionExercises, index, prevIndex);
            reorderSessionExercises(effectiveSessionId, reorderedExercises.map(se => se.id));
          } else {
            setSelectedExerciseId(activeSessionExercises[prevIndex].id);
          }
          focusExercise(prevIndex);
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
        focusExercise(0, 50);
      } else {
        focusSession(0);
      }
    }, 50);
  };

  return {
    handleSettingValueKeyDown,
    handleSessionKeyDown,
    handleExerciseKeyDown,
    handleAddExerciseButtonKeyDown,
    focusFirstSessionFirstExercise,
  };
}
