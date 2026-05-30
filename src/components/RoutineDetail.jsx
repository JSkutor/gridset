import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useRoutineKeyboardNavigation } from '../hooks/useRoutineKeyboardNavigation';
import {
  MAX_SESSIONS_PER_ROUTINE,
  getRegularRoutineSessions,
  getRoutineTemporarySession,
  getSessionDayLetter,
  isTemporarySession,
  isRoutineReadOnly,
} from '../utils/sessionHelper';
import {
  findGroupForSessionExercise,
  getLinksCoveredByGroup,
} from '../utils/sessionExerciseGroups';
import ExerciseSettingsPanel from './routine/ExerciseSettingsPanel';
import RoutineTabs from './routine/RoutineTabs';
import SessionExerciseListPanel from './routine/SessionExerciseListPanel';
import SessionListPanel from './routine/SessionListPanel';

const RoutineDetail = forwardRef((props, ref) => {
  const routines = useWorkoutStore(state => state.routines);
  const sortedRoutines = useMemo(() => {
    return [...routines].sort((a, b) => {
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      return timeB - timeA;
    });
  }, [routines]);
  const sessions = useWorkoutStore(state => state.sessions);
  const sessionExercises = useWorkoutStore(state => state.sessionExercises);
  const sessionExerciseGroups = useWorkoutStore(state => state.sessionExerciseGroups);
  const exercises = useWorkoutStore(state => state.exercises);

  const addRoutine = useWorkoutStore(state => state.addRoutine);
  const deleteRoutine = useWorkoutStore(state => state.deleteRoutine);
  const duplicateRoutine = useWorkoutStore(state => state.duplicateRoutine);
  const updateRoutine = useWorkoutStore(state => state.updateRoutine);
  const addSession = useWorkoutStore(state => state.addSession);
  const createTemporarySession = useWorkoutStore(state => state.createTemporarySession);
  const deleteSession = useWorkoutStore(state => state.deleteSession);
  const updateSession = useWorkoutStore(state => state.updateSession);
  const addSessionExercise = useWorkoutStore(state => state.addSessionExercise);
  const deleteSessionExercise = useWorkoutStore(state => state.deleteSessionExercise);
  const updateSessionExercise = useWorkoutStore(state => state.updateSessionExercise);
  const addSessionExerciseGroup = useWorkoutStore(state => state.addSessionExerciseGroup);
  const updateSessionExerciseGroup = useWorkoutStore(state => state.updateSessionExerciseGroup);
  const deleteSessionExerciseGroup = useWorkoutStore(state => state.deleteSessionExerciseGroup);
  const addExercise = useWorkoutStore(state => state.addExercise);
  const reorderSessions = useWorkoutStore(state => state.reorderSessions);
  const reorderSessionExercises = useWorkoutStore(state => state.reorderSessionExercises);

  const [selectedRoutineId, setSelectedRoutineId] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [selectedExerciseGroupId, setSelectedExerciseGroupId] = useState(null);
  const [settingsMode, setSettingsMode] = useState('exercise');
  const [isAddingExerciseRow, setIsAddingExerciseRow] = useState(false);
  const [isAddingExerciseGroupRow, setIsAddingExerciseGroupRow] = useState(false);
  const [focusedRoutinePanel, setFocusedRoutinePanel] = useState(null);

  const [isEditingRoutineName, setIsEditingRoutineName] = useState(false);
  const [editingRoutineNameVal, setEditingRoutineNameVal] = useState('');
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingSessionNameVal, setEditingSessionNameVal] = useState('');
  const [pendingNewSessionId, setPendingNewSessionId] = useState(null);
  const [pendingNewSessionReturnId, setPendingNewSessionReturnId] = useState(null);

  const sessionRefs = useRef({});
  const exerciseRefs = useRef({});
  const exerciseGroupRefs = useRef({});
  const exerciseGroupRowRefs = useRef({});
  const settingControlRefs = useRef([]);
  const addSessionBtnRef = useRef(null);
  const addExerciseBtnRef = useRef(null);
  const addGroupBtnRef = useRef(null);
  const pendingFocusIndexRef = useRef(null);
  const pendingGroupFocusIdRef = useRef(null);

  const setSessionRef = (id, element) => {
    if (element) {
      sessionRefs.current[id] = element;
    } else {
      delete sessionRefs.current[id];
    }
  };

  const setExerciseRef = (id, element) => {
    if (element) {
      exerciseRefs.current[id] = element;
    } else {
      delete exerciseRefs.current[id];
    }
  };

  const setExerciseGroupRef = (id, element) => {
    if (element) {
      exerciseGroupRefs.current[id] = element;
    } else {
      delete exerciseGroupRefs.current[id];
    }
  };

  const setExerciseGroupRowRef = (id, element) => {
    if (element) {
      exerciseGroupRowRefs.current[id] = element;
    } else {
      delete exerciseGroupRowRefs.current[id];
    }
  };

  const setSettingControlRef = (index, element) => {
    settingControlRefs.current[index] = element;
  };

  const focusSessionAddButton = (delay = 50) => {
    setFocusedRoutinePanel('session-add');
    setTimeout(() => {
      addSessionBtnRef.current?.focus();
      addSessionBtnRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, delay);
  };

  const focusSessionRow = (id, delay = 50) => {
    if (!id) return;
    setFocusedRoutinePanel('sessions');
    setTimeout(() => {
      sessionRefs.current[id]?.focus();
      sessionRefs.current[id]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, delay);
  };

  const handleSelectRoutine = (id) => {
    setSelectedRoutineId(id);
    const routineSessions = getRegularRoutineSessions(sessions, id);
    const temporarySession = getRoutineTemporarySession(sessions, id);
    setSelectedSessionId(routineSessions[0]?.id || temporarySession?.id || null);
    setSelectedExerciseId(null);
    setSelectedExerciseGroupId(null);
    setIsAddingExerciseRow(false);
    setIsAddingExerciseGroupRow(false);
    setFocusedRoutinePanel('sessions');
  };

  const handleSelectSession = (id) => {
    setSelectedSessionId(id);
    setSelectedExerciseId(null);
    setSelectedExerciseGroupId(null);
    setIsAddingExerciseRow(false);
    setIsAddingExerciseGroupRow(false);
    setFocusedRoutinePanel('sessions');
  };

  const effectiveRoutineId = selectedRoutineId || sortedRoutines[0]?.id || null;
  const effectiveRoutine = sortedRoutines.find(routine => routine.id === effectiveRoutineId) || null;
  const isReadOnly = isRoutineReadOnly(effectiveRoutineId, sortedRoutines);

  const effectiveRoutineSessions = getRegularRoutineSessions(sessions, effectiveRoutineId);
  const effectiveTemporarySession = getRoutineTemporarySession(sessions, effectiveRoutineId);
  const effectiveSessionOptions = effectiveTemporarySession
    ? [...effectiveRoutineSessions, effectiveTemporarySession]
    : effectiveRoutineSessions;
  const selectedSessionStillExists = effectiveSessionOptions.some(session => session.id === selectedSessionId);
  const effectiveSessionId = selectedSessionStillExists
    ? selectedSessionId
    : effectiveRoutineSessions[0]?.id || effectiveTemporarySession?.id || null;
  const effectiveSession = effectiveSessionOptions.find(session => session.id === effectiveSessionId) || null;
  const activeSessionExercises = sessionExercises
    .filter(sessionExercise => sessionExercise.session_id === (effectiveSession?.id || null))
    .sort((a, b) => a.order - b.order);
  const activeSessionExerciseGroups = sessionExerciseGroups
    .filter(group => group.session_id === (effectiveSession?.id || null))
    .sort((a, b) => (a.start_order || 0) - (b.start_order || 0));
  const dayLetter = getSessionDayLetter(effectiveSession, sessions);
  const canAddSession = effectiveRoutineSessions.length < MAX_SESSIONS_PER_ROUTINE;
  const selectedExerciseLink = activeSessionExercises.find(sessionExercise => sessionExercise.id === selectedExerciseId);
  const selectedExercise = selectedExerciseLink
    ? exercises.find(exercise => exercise.id === selectedExerciseLink.exercise_id)
    : null;
  const selectedExerciseGroup = findGroupForSessionExercise(activeSessionExerciseGroups, selectedExerciseLink);
  const selectedExerciseGroupForSettings = settingsMode === 'group'
    ? activeSessionExerciseGroups.find(group => group.id === selectedExerciseGroupId) || null
    : null;

  const {
    handleSettingValueKeyDown,
    handleSessionKeyDown,
    handleExerciseKeyDown,
    handleAddSessionButtonKeyDown,
    handleAddExerciseButtonKeyDown,
    focusFirstSessionFirstExercise,
    focusExercise,
    focusExerciseGroupById,
    focusSettingControl,
  } = useRoutineKeyboardNavigation({
    effectiveRoutineId,
    effectiveSessionId,
    temporarySessionId: effectiveTemporarySession?.id || null,
    effectiveRoutineSessions,
    activeSessionExercises,
    activeSessionExerciseGroups,
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
    onSelectSession: handleSelectSession,
    onFocusExerciseSettings: () => setSettingsMode('exercise'),
    setSelectedSessionId,
    setSelectedExerciseId: (id) => {
      setSelectedExerciseId(id);
      if (id) setSelectedExerciseGroupId(null);
    },
    setSelectedExerciseGroupId,
    setIsAddingExerciseRow,
    setFocusedRoutinePanel,
    isReadOnly,
  });

  useImperativeHandle(ref, () => ({
    focusFirstSessionFirstExercise,
  }));

  const handleCreateRoutine = () => {
    const newRoutine = addRoutine(`새 루틴 ${routines.length + 1}`);
    handleSelectRoutine(newRoutine.id);
  };

  const handleDuplicateRoutine = (routineId) => {
    const newRoutine = duplicateRoutine(routineId);
    if (newRoutine) handleSelectRoutine(newRoutine.id);
  };

  const handleStartRoutineNameEdit = () => {
    if (!effectiveRoutine || isReadOnly) return;
    setIsEditingRoutineName(true);
    setEditingRoutineNameVal(effectiveRoutine.name);
  };

  const handleSaveRoutineName = () => {
    if (effectiveRoutine && editingRoutineNameVal.trim() && !isReadOnly) {
      updateRoutine(effectiveRoutine.id, editingRoutineNameVal.trim());
    }
    setIsEditingRoutineName(false);
  };

  const handleCancelRoutineNameEdit = () => {
    setIsEditingRoutineName(false);
  };

  const handleDeleteRoutine = () => {
    if (!effectiveRoutine || isReadOnly) return;
    if (confirm('이 루틴을 완전히 삭제하시겠습니까? 모든 세션과 설정이 함께 제거됩니다.')) {
      deleteRoutine(effectiveRoutine.id);
      const remainingRoutines = sortedRoutines.filter(routine => routine.id !== effectiveRoutine.id);
      const nextRoutine = remainingRoutines[0] || null;
      handleSelectRoutine(nextRoutine ? nextRoutine.id : null);
    }
  };

  const handleAddSession = () => {
    if (!effectiveRoutineId || !canAddSession || isReadOnly) return;
    const newSession = addSession(effectiveRoutineId, `새 세션 ${effectiveRoutineSessions.length + 1}`);
    if (!newSession) return;

    setPendingNewSessionId(newSession.id);
    setPendingNewSessionReturnId(effectiveSessionId);
    setSelectedSessionId(newSession.id);
    setEditingSessionId(newSession.id);
    setEditingSessionNameVal(newSession.name);
    setSelectedExerciseId(null);
    setSelectedExerciseGroupId(null);
    setIsAddingExerciseRow(false);
    setIsAddingExerciseGroupRow(false);
    setFocusedRoutinePanel('sessions');
  };

  const handleCreateTemporarySession = () => {
    if (!effectiveRoutineId || effectiveTemporarySession || isReadOnly) return;
    const newSession = createTemporarySession(effectiveRoutineId, '임시 세션');
    if (!newSession) return;

    setPendingNewSessionId(newSession.id);
    setPendingNewSessionReturnId(effectiveSessionId);
    setSelectedSessionId(newSession.id);
    setEditingSessionId(newSession.id);
    setEditingSessionNameVal(newSession.name);
    setSelectedExerciseId(null);
    setSelectedExerciseGroupId(null);
    setIsAddingExerciseRow(false);
    setIsAddingExerciseGroupRow(false);
    setFocusedRoutinePanel('sessions');
  };

  const handleStartSessionEdit = (session) => {
    if (isReadOnly) return;
    setEditingSessionId(session.id);
    setEditingSessionNameVal(session.name);
  };

  const finishSessionEdit = (session) => {
    if (isReadOnly) return;
    if (editingSessionNameVal.trim()) {
      updateSession(session.id, editingSessionNameVal.trim());
    }
    const shouldFocusSessionRow = pendingNewSessionId === session.id || editingSessionId === session.id;
    if (pendingNewSessionId === session.id) {
      setPendingNewSessionId(null);
      setPendingNewSessionReturnId(null);
    }
    setEditingSessionId(null);
    setEditingSessionNameVal('');
    if (shouldFocusSessionRow) {
      focusSessionRow(session.id);
    }
  };

  const cancelSessionEdit = (session) => {
    const isPendingNewSession = pendingNewSessionId === session.id;
    if (pendingNewSessionId === session.id) {
      const fallbackId = effectiveSessionOptions.some(item => item.id === pendingNewSessionReturnId)
        ? pendingNewSessionReturnId
        : effectiveSessionOptions.find(item => item.id !== session.id)?.id || null;

      deleteSession(session.id);
      setSelectedSessionId(fallbackId);
      setSelectedExerciseId(null);
      setSelectedExerciseGroupId(null);
      setIsAddingExerciseRow(false);
      setIsAddingExerciseGroupRow(false);
      setFocusedRoutinePanel('sessions');
      setPendingNewSessionId(null);
      setPendingNewSessionReturnId(null);
    }

    setEditingSessionId(null);
    setEditingSessionNameVal('');
    if (isPendingNewSession) {
      focusSessionAddButton();
    } else {
      focusSessionRow(session.id);
    }
  };

  const handleDeleteSession = (session) => {
    if (isReadOnly) return;
    const confirmMessage = isTemporarySession(session)
      ? '임시 세션을 삭제하시겠습니까? 등록한 운동 구성도 함께 제거됩니다.'
      : '이 세션을 삭제하시겠습니까?';

    if (confirm(confirmMessage)) {
      deleteSession(session.id);
      const remainingSessions = effectiveSessionOptions.filter(item => item.id !== session.id);
      setSelectedSessionId(remainingSessions[0]?.id || null);
      setSelectedExerciseId(null);
      setSelectedExerciseGroupId(null);
    }
  };

  const handleAddExerciseToSession = (dictExercise) => {
    if (!effectiveSession?.id || isReadOnly) return;

    let storeExercise = exercises.find(exercise => exercise.name.toLowerCase() === dictExercise.name.toLowerCase());
    if (!storeExercise) {
      storeExercise = addExercise(
        dictExercise.name,
        dictExercise.primaryMuscle || dictExercise.primary_muscle,
        dictExercise.equipment,
        dictExercise.unit || (dictExercise.category === 'cardio' ? 'reps' : 'kg'),
        dictExercise.is_unilateral ?? false,
      );
    }

    const alreadyExists = activeSessionExercises.some(sessionExercise => sessionExercise.exercise_id === storeExercise.id);
    if (alreadyExists) return;

    const newIndex = activeSessionExercises.length;
    const nextOrder = newIndex + 1;
    const newSessionExercise = addSessionExercise(effectiveSession.id, storeExercise.id, nextOrder, 3, '10');
    setSelectedExerciseId(newSessionExercise.id);
    setSelectedExerciseGroupId(null);
    setFocusedRoutinePanel('exercises');
    pendingFocusIndexRef.current = newIndex;
  };

  useEffect(() => {
    if (pendingFocusIndexRef.current === null) return;
    const index = pendingFocusIndexRef.current;
    pendingFocusIndexRef.current = null;
    focusExercise(index, 20);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionExercises.length]);

  const handleDeleteExercise = (id) => {
    if (isReadOnly) return;
    deleteSessionExercise(id);
    if (selectedExerciseId === id) setSelectedExerciseId(null);
    setSelectedExerciseGroupId(null);
  };

  const handleUpdateTarget = (id, field, value) => {
    if (isReadOnly) return;
    updateSessionExercise(id, { [field]: value });
  };

  const handleUpdateExerciseGroup = (id, updates) => {
    if (isReadOnly) return;
    updateSessionExerciseGroup(id, updates);
  };

  const handleStartAddingExercise = () => {
    if (isReadOnly) return;
    setSelectedExerciseId(null);
    setSelectedExerciseGroupId(null);
    setIsAddingExerciseRow(true);
    setIsAddingExerciseGroupRow(false);
    setFocusedRoutinePanel('exercises');
  };

  const handleCancelAddingExercise = (shouldFocusAddButton = true) => {
    setIsAddingExerciseRow(false);
    if (shouldFocusAddButton) {
      setTimeout(() => addExerciseBtnRef.current?.focus(), 50);
    }
  };

  const handleSelectExercise = (id) => {
    setSelectedExerciseId(id);
    if (id) setSettingsMode('exercise');
    if (id) setSelectedExerciseGroupId(null);
  };

  const handleSelectExerciseGroup = (groupOrId) => {
    const id = typeof groupOrId === 'object' ? groupOrId?.id : groupOrId;
    setSelectedExerciseGroupId(id || null);
    if (typeof groupOrId === 'object' && groupOrId?.id) {
      setSettingsMode('group');
    }
  };

  const handleFocusExerciseGroupRow = (group) => {
    setFocusedRoutinePanel('groups');
    if (!group?.id) return;
    setSelectedExerciseGroupId(group.id);
    setSettingsMode('group');
  };

  const handleStartAddingExerciseGroup = () => {
    if (isReadOnly || activeSessionExercises.length < 2) return;
    setSelectedExerciseGroupId(null);
    setIsAddingExerciseRow(false);
    setIsAddingExerciseGroupRow(true);
    setFocusedRoutinePanel('group-add');
  };

  const handleCancelAddingExerciseGroup = (shouldFocusAddButton = true) => {
    setIsAddingExerciseGroupRow(false);
    if (shouldFocusAddButton) {
      setFocusedRoutinePanel('group-add');
      setTimeout(() => addGroupBtnRef.current?.focus(), 50);
    }
  };

  const focusExerciseGroupRowById = (id, delay = 0) => {
    if (!id) return;
    setFocusedRoutinePanel('groups');
    setTimeout(() => {
      exerciseGroupRowRefs.current[id]?.focus();
      exerciseGroupRowRefs.current[id]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, delay);
  };

  const getFirstExerciseInGroup = (group) => {
    return getLinksCoveredByGroup(activeSessionExercises, group)[0] || null;
  };

  const focusGroupSettings = (group) => {
    const firstExercise = getFirstExerciseInGroup(group);
    if (!selectedExerciseId && firstExercise) {
      setSelectedExerciseId(firstExercise.id);
    }
    setSelectedExerciseGroupId(group.id);
    setSettingsMode('group');
    focusSettingControl(0);
  };

  const focusExerciseSettingsFromGroup = (group) => {
    const firstExercise = getFirstExerciseInGroup(group);
    if (!selectedExerciseId && firstExercise) {
      setSelectedExerciseId(firstExercise.id);
    }
    setSettingsMode('exercise');
    focusSettingControl(0);
  };

  const handleAddGroupButtonKeyDown = (event) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      addExerciseBtnRef.current?.focus();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      const firstGroup = activeSessionExerciseGroups[0];
      if (firstGroup) {
        setSelectedExerciseGroupId(firstGroup.id);
        focusExerciseGroupRowById(firstGroup.id);
      }
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (activeSessionExercises.length > 0) {
        const lastIndex = activeSessionExercises.length - 1;
        setSelectedExerciseId(activeSessionExercises[lastIndex].id);
        setSelectedExerciseGroupId(null);
        focusExercise(lastIndex);
      }
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      const firstGroup = activeSessionExerciseGroups[0];
      if (firstGroup) focusGroupSettings(firstGroup);
      else focusSettingControl(0);
    }
  };

  const handleAddExerciseGroup = ({ name, size }) => {
    if (!effectiveSession?.id || isReadOnly) return false;
    const newGroup = addSessionExerciseGroup(effectiveSession.id, name, size);
    if (!newGroup) return false;

    if (!selectedExerciseId) {
      const firstExercise = getFirstExerciseInGroup(newGroup);
      if (firstExercise) setSelectedExerciseId(firstExercise.id);
    }
    setSelectedExerciseGroupId(newGroup.id);
    setFocusedRoutinePanel('groups');
    pendingGroupFocusIdRef.current = newGroup.id;
    return true;
  };

  const handleDeleteExerciseGroup = (id) => {
    if (isReadOnly) return;
    deleteSessionExerciseGroup(id);
    if (selectedExerciseGroupId === id) setSelectedExerciseGroupId(null);
  };

  const handleExerciseGroupKeyDown = (event, index) => {
    const group = activeSessionExerciseGroups[index];
    if (!group) return;
    const isDetailRow = event.currentTarget.classList.contains('routine-group-row');
    const focusGroup = (id, delay = 0) => {
      if (isDetailRow) focusExerciseGroupRowById(id, delay);
      else focusExerciseGroupById(id, delay);
    };

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const isMoving = event.metaKey || event.ctrlKey;
        if (isMoving) {
          if (isReadOnly) break;
          const maxStart = Math.max(1, activeSessionExercises.length - (group.size || 2) + 1);
          const nextStart = Math.min(maxStart, (group.start_order || 1) + 1);
          if (nextStart !== group.start_order) {
            updateSessionExerciseGroup(group.id, { start_order: nextStart });
          }
          focusGroup(group.id, 20);
        } else {
          const nextGroup = activeSessionExerciseGroups[index + 1];
          if (nextGroup) {
            setSelectedExerciseGroupId(nextGroup.id);
            focusGroup(nextGroup.id);
          } else if (!isDetailRow) {
            setFocusedRoutinePanel('group-add');
            addGroupBtnRef.current?.focus();
          }
        }
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const isMoving = event.metaKey || event.ctrlKey;
        if (isMoving) {
          if (isReadOnly) break;
          const nextStart = Math.max(1, (group.start_order || 1) - 1);
          if (nextStart !== group.start_order) {
            updateSessionExerciseGroup(group.id, { start_order: nextStart });
          }
          focusGroup(group.id, 20);
        } else {
          const prevGroup = activeSessionExerciseGroups[index - 1];
          if (prevGroup) {
            setSelectedExerciseGroupId(prevGroup.id);
            focusGroup(prevGroup.id);
          } else if (isDetailRow) {
            setFocusedRoutinePanel('group-add');
            addGroupBtnRef.current?.focus();
          } else if (activeSessionExercises.length > 0) {
            const firstIndex = Math.max(0, (group.start_order || 1) - 1);
            setSelectedExerciseId(activeSessionExercises[firstIndex]?.id || null);
            setSelectedExerciseGroupId(null);
            focusExercise(firstIndex);
          }
        }
        break;
      }
      case 'ArrowLeft': {
        event.preventDefault();
        const exerciseIndex = Math.max(0, (group.start_order || 1) - 1);
        setSelectedExerciseId(activeSessionExercises[exerciseIndex]?.id || null);
        setSelectedExerciseGroupId(null);
        focusExercise(exerciseIndex);
        break;
      }
      case 'ArrowRight': {
        event.preventDefault();
        if (isDetailRow) {
          focusGroupSettings(group);
        } else {
          focusExerciseSettingsFromGroup(group);
        }
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        handleSelectExerciseGroup(selectedExerciseGroupId === group.id ? null : group.id);
        break;
      }
      case 'Backspace':
      case 'Delete': {
        event.preventDefault();
        handleDeleteExerciseGroup(group.id);
        break;
      }
      default:
        break;
    }
  };

  useEffect(() => {
    if (!selectedExerciseGroupId) return;
    const stillExists = activeSessionExerciseGroups.some(group => group.id === selectedExerciseGroupId);
    if (!stillExists) setSelectedExerciseGroupId(null);
  }, [activeSessionExerciseGroups, selectedExerciseGroupId]);

  useEffect(() => {
    if (!pendingGroupFocusIdRef.current) return;
    const id = pendingGroupFocusIdRef.current;
    pendingGroupFocusIdRef.current = null;
    focusExerciseGroupById(id, 20);
  }, [activeSessionExerciseGroups.length, focusExerciseGroupById]);

  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setFocusedRoutinePanel(null);
    }
  };

  return (
    <div
      onBlur={handleBlur}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minHeight: 0, gap: 0 }}
    >
      <RoutineTabs
        routines={sortedRoutines}
        activeRoutineId={effectiveRoutineId}
        onSelectRoutine={handleSelectRoutine}
        onCreateRoutine={handleCreateRoutine}
        onDuplicateRoutine={handleDuplicateRoutine}
      />

      <div className="routine-grid" style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1.8fr 1fr',
        gap: '24px',
        overflow: 'hidden',
      }}>
        <SessionListPanel
          routine={effectiveRoutine}
          routineSessions={effectiveRoutineSessions}
          temporarySession={effectiveTemporarySession}
          activeSessionId={effectiveSessionId}
          isPanelFocused={focusedRoutinePanel === 'sessions'}
          sessions={sessions}
          sessionExercises={sessionExercises}
          canAddSession={canAddSession}
          isAddingSessionRow={Boolean(pendingNewSessionId)}
          isEditingRoutineName={isEditingRoutineName}
          editingRoutineName={editingRoutineNameVal}
          onEditingRoutineNameChange={setEditingRoutineNameVal}
          onStartRoutineNameEdit={handleStartRoutineNameEdit}
          onSaveRoutineName={handleSaveRoutineName}
          onCancelRoutineNameEdit={handleCancelRoutineNameEdit}
          onDeleteRoutine={handleDeleteRoutine}
          editingSessionId={editingSessionId}
          editingSessionName={editingSessionNameVal}
          onEditingSessionNameChange={setEditingSessionNameVal}
          onStartSessionEdit={handleStartSessionEdit}
          onFinishSessionEdit={finishSessionEdit}
          onCancelSessionEdit={cancelSessionEdit}
          onDeleteSession={handleDeleteSession}
          onAddSession={handleAddSession}
          onCreateTemporarySession={handleCreateTemporarySession}
          onSelectSession={handleSelectSession}
          onSessionKeyDown={handleSessionKeyDown}
          onAddSessionButtonKeyDown={handleAddSessionButtonKeyDown}
          onSessionRef={setSessionRef}
          addSessionBtnRef={addSessionBtnRef}
          onPanelFocus={() => setFocusedRoutinePanel('sessions')}
          onAddButtonFocus={() => setFocusedRoutinePanel('session-add')}
          isReadOnly={isReadOnly}
        />

        <SessionExerciseListPanel
          session={effectiveSession}
          dayLetter={dayLetter}
          sessionExercises={activeSessionExercises}
          exerciseGroups={activeSessionExerciseGroups}
          exercises={exercises}
          selectedExerciseId={selectedExerciseId}
          selectedExerciseGroupId={selectedExerciseGroupId}
          isPanelFocused={focusedRoutinePanel === 'exercises'}
          isGroupPanelFocused={focusedRoutinePanel === 'groups'}
          isAddingExerciseRow={isAddingExerciseRow}
          isAddingExerciseGroupRow={isAddingExerciseGroupRow}
          addExerciseBtnRef={addExerciseBtnRef}
          addGroupBtnRef={addGroupBtnRef}
          onExerciseKeyDown={handleExerciseKeyDown}
          onAddExerciseButtonKeyDown={handleAddExerciseButtonKeyDown}
          onAddGroupButtonKeyDown={handleAddGroupButtonKeyDown}
          onExerciseGroupKeyDown={handleExerciseGroupKeyDown}
          onExerciseRef={setExerciseRef}
          onExerciseGroupRef={setExerciseGroupRef}
          onExerciseGroupRowRef={setExerciseGroupRowRef}
          onSelectExercise={handleSelectExercise}
          onSelectExerciseGroup={handleSelectExerciseGroup}
          onDeleteExercise={handleDeleteExercise}
          onDeleteExerciseGroup={handleDeleteExerciseGroup}
          onAddExercise={handleAddExerciseToSession}
          onAddExerciseGroup={handleAddExerciseGroup}
          onStartAddingExercise={handleStartAddingExercise}
          onStartAddingExerciseGroup={handleStartAddingExerciseGroup}
          onCancelAddingExercise={handleCancelAddingExercise}
          onCancelAddingExerciseGroup={handleCancelAddingExerciseGroup}
          onPanelFocus={() => setFocusedRoutinePanel('exercises')}
          onGroupPanelFocus={() => setFocusedRoutinePanel('groups')}
          onGroupRowFocus={handleFocusExerciseGroupRow}
          onGroupAddButtonFocus={() => setFocusedRoutinePanel('group-add')}
          isReadOnly={isReadOnly}
        />

        <ExerciseSettingsPanel
          selectedExerciseLink={selectedExerciseLink}
          selectedExercise={selectedExercise}
          selectedExerciseGroup={selectedExerciseGroup}
          selectedExerciseGroupForSettings={selectedExerciseGroupForSettings}
          exerciseCount={activeSessionExercises.length}
          onSettingControlRef={setSettingControlRef}
          onSettingValueKeyDown={handleSettingValueKeyDown}
          onUpdateTarget={handleUpdateTarget}
          onUpdateExerciseGroup={handleUpdateExerciseGroup}
          onFocusExerciseGroupRow={focusExerciseGroupRowById}
          onPanelFocus={() => setFocusedRoutinePanel('settings')}
          isReadOnly={isReadOnly}
        />
      </div>
    </div>
  );
});

export default RoutineDetail;
