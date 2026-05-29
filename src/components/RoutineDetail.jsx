import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useRoutineKeyboardNavigation } from '../hooks/useRoutineKeyboardNavigation';
import { MAX_SESSIONS_PER_ROUTINE, getSessionDayLetter } from '../utils/sessionHelper';
import ExerciseSettingsPanel from './routine/ExerciseSettingsPanel';
import RoutineTabs from './routine/RoutineTabs';
import SessionExerciseListPanel from './routine/SessionExerciseListPanel';
import SessionListPanel from './routine/SessionListPanel';

const RoutineDetail = forwardRef((props, ref) => {
  const routines = useWorkoutStore(state => state.routines);
  const sessions = useWorkoutStore(state => state.sessions);
  const sessionExercises = useWorkoutStore(state => state.sessionExercises);
  const exercises = useWorkoutStore(state => state.exercises);

  const addRoutine = useWorkoutStore(state => state.addRoutine);
  const deleteRoutine = useWorkoutStore(state => state.deleteRoutine);
  const duplicateRoutine = useWorkoutStore(state => state.duplicateRoutine);
  const updateRoutine = useWorkoutStore(state => state.updateRoutine);
  const addSession = useWorkoutStore(state => state.addSession);
  const deleteSession = useWorkoutStore(state => state.deleteSession);
  const updateSession = useWorkoutStore(state => state.updateSession);
  const addSessionExercise = useWorkoutStore(state => state.addSessionExercise);
  const deleteSessionExercise = useWorkoutStore(state => state.deleteSessionExercise);
  const updateSessionExercise = useWorkoutStore(state => state.updateSessionExercise);
  const addExercise = useWorkoutStore(state => state.addExercise);
  const reorderSessions = useWorkoutStore(state => state.reorderSessions);
  const reorderSessionExercises = useWorkoutStore(state => state.reorderSessionExercises);

  const [selectedRoutineId, setSelectedRoutineId] = useState(routines[0]?.id || null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [isAddingExerciseRow, setIsAddingExerciseRow] = useState(false);
  const [focusedRoutinePanel, setFocusedRoutinePanel] = useState('sessions');

  const [isEditingRoutineName, setIsEditingRoutineName] = useState(false);
  const [editingRoutineNameVal, setEditingRoutineNameVal] = useState('');
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingSessionNameVal, setEditingSessionNameVal] = useState('');
  const [pendingNewSessionId, setPendingNewSessionId] = useState(null);
  const [pendingNewSessionReturnId, setPendingNewSessionReturnId] = useState(null);

  const sessionRefs = useRef({});
  const exerciseRefs = useRef({});
  const settingControlRefs = useRef([]);
  const addSessionBtnRef = useRef(null);
  const addExerciseBtnRef = useRef(null);
  const pendingFocusIndexRef = useRef(null);

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
    const routineSessions = sessions.filter(s => s.routine_id === id);
    setSelectedSessionId(routineSessions[0]?.id || null);
    setSelectedExerciseId(null);
    setIsAddingExerciseRow(false);
    setFocusedRoutinePanel('sessions');
  };

  const handleSelectSession = (id) => {
    setSelectedSessionId(id);
    setSelectedExerciseId(null);
    setIsAddingExerciseRow(false);
    setFocusedRoutinePanel('sessions');
  };

  const effectiveRoutineId = selectedRoutineId || routines[0]?.id || null;
  const effectiveRoutine = routines.find(routine => routine.id === effectiveRoutineId) || null;
  const effectiveRoutineSessions = sessions
    .filter(session => session.routine_id === effectiveRoutineId)
    .sort((a, b) => (a.session_order || 0) - (b.session_order || 0));
  const effectiveSessionId = selectedSessionId || effectiveRoutineSessions[0]?.id || null;
  const effectiveSession = effectiveRoutineSessions.find(session => session.id === effectiveSessionId) || null;
  const activeSessionExercises = sessionExercises
    .filter(sessionExercise => sessionExercise.session_id === (effectiveSession?.id || null))
    .sort((a, b) => a.order - b.order);
  const dayLetter = getSessionDayLetter(effectiveSession, sessions);
  const canAddSession = effectiveRoutineSessions.length < MAX_SESSIONS_PER_ROUTINE;
  const selectedExerciseLink = activeSessionExercises.find(sessionExercise => sessionExercise.id === selectedExerciseId);
  const selectedExercise = selectedExerciseLink
    ? exercises.find(exercise => exercise.id === selectedExerciseLink.exercise_id)
    : null;

  const {
    handleSettingValueKeyDown,
    handleSessionKeyDown,
    handleExerciseKeyDown,
    handleAddSessionButtonKeyDown,
    handleAddExerciseButtonKeyDown,
    focusFirstSessionFirstExercise,
    focusExercise,
  } = useRoutineKeyboardNavigation({
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
    addSessionBtnRef,
    addExerciseBtnRef,
    reorderSessions,
    reorderSessionExercises,
    onSelectSession: handleSelectSession,
    setSelectedSessionId,
    setSelectedExerciseId,
    setIsAddingExerciseRow,
    setFocusedRoutinePanel,
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
    if (!effectiveRoutine) return;
    setIsEditingRoutineName(true);
    setEditingRoutineNameVal(effectiveRoutine.name);
  };

  const handleSaveRoutineName = () => {
    if (effectiveRoutine && editingRoutineNameVal.trim()) {
      updateRoutine(effectiveRoutine.id, editingRoutineNameVal.trim());
    }
    setIsEditingRoutineName(false);
  };

  const handleCancelRoutineNameEdit = () => {
    setIsEditingRoutineName(false);
  };

  const handleDeleteRoutine = () => {
    if (!effectiveRoutine) return;
    if (confirm('이 루틴을 완전히 삭제하시겠습니까? 모든 세션과 설정이 함께 제거됩니다.')) {
      deleteRoutine(effectiveRoutine.id);
      const remainingRoutines = routines.filter(routine => routine.id !== effectiveRoutine.id);
      const nextRoutine = remainingRoutines[remainingRoutines.length - 1] || null;
      handleSelectRoutine(nextRoutine ? nextRoutine.id : null);
    }
  };

  const handleAddSession = () => {
    if (!effectiveRoutineId || !canAddSession) return;
    const newSession = addSession(effectiveRoutineId, `새 세션 ${effectiveRoutineSessions.length + 1}`);
    if (!newSession) return;

    setPendingNewSessionId(newSession.id);
    setPendingNewSessionReturnId(effectiveSessionId);
    setSelectedSessionId(newSession.id);
    setEditingSessionId(newSession.id);
    setEditingSessionNameVal(newSession.name);
    setSelectedExerciseId(null);
    setIsAddingExerciseRow(false);
    setFocusedRoutinePanel('sessions');
  };

  const handleStartSessionEdit = (session) => {
    setEditingSessionId(session.id);
    setEditingSessionNameVal(session.name);
  };

  const finishSessionEdit = (session) => {
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
      const fallbackId = effectiveRoutineSessions.some(item => item.id === pendingNewSessionReturnId)
        ? pendingNewSessionReturnId
        : effectiveRoutineSessions.find(item => item.id !== session.id)?.id || null;

      deleteSession(session.id);
      setSelectedSessionId(fallbackId);
      setSelectedExerciseId(null);
      setIsAddingExerciseRow(false);
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
    if (confirm('이 세션을 삭제하시겠습니까?')) {
      deleteSession(session.id);
      const remainingSessions = effectiveRoutineSessions.filter(item => item.id !== session.id);
      setSelectedSessionId(remainingSessions[0]?.id || null);
    }
  };

  const handleAddExerciseToSession = (dictExercise) => {
    if (!effectiveSession?.id) return;

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
    deleteSessionExercise(id);
    if (selectedExerciseId === id) setSelectedExerciseId(null);
  };

  const handleUpdateTarget = (id, field, value) => {
    updateSessionExercise(id, { [field]: value });
  };

  const handleStartAddingExercise = () => {
    setSelectedExerciseId(null);
    setIsAddingExerciseRow(true);
    setFocusedRoutinePanel('exercises');
  };

  const handleCancelAddingExercise = (shouldFocusAddButton = true) => {
    setIsAddingExerciseRow(false);
    if (shouldFocusAddButton) {
      setTimeout(() => addExerciseBtnRef.current?.focus(), 50);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minHeight: 0, gap: 0 }}>
      <RoutineTabs
        routines={routines}
        activeRoutineId={effectiveRoutineId}
        onSelectRoutine={handleSelectRoutine}
        onCreateRoutine={handleCreateRoutine}
        onDuplicateRoutine={handleDuplicateRoutine}
      />

      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1.8fr 1fr',
        gap: '24px',
        overflow: 'hidden',
      }}>
        <SessionListPanel
          routine={effectiveRoutine}
          routineSessions={effectiveRoutineSessions}
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
          onSelectSession={handleSelectSession}
          onSessionKeyDown={handleSessionKeyDown}
          onAddSessionButtonKeyDown={handleAddSessionButtonKeyDown}
          onSessionRef={setSessionRef}
          addSessionBtnRef={addSessionBtnRef}
          onPanelFocus={() => setFocusedRoutinePanel('sessions')}
          onAddButtonFocus={() => setFocusedRoutinePanel('session-add')}
        />

        <SessionExerciseListPanel
          session={effectiveSession}
          dayLetter={dayLetter}
          sessionExercises={activeSessionExercises}
          exercises={exercises}
          selectedExerciseId={selectedExerciseId}
          isPanelFocused={focusedRoutinePanel === 'exercises'}
          isAddingExerciseRow={isAddingExerciseRow}
          addExerciseBtnRef={addExerciseBtnRef}
          onExerciseKeyDown={handleExerciseKeyDown}
          onAddExerciseButtonKeyDown={handleAddExerciseButtonKeyDown}
          onExerciseRef={setExerciseRef}
          onSelectExercise={setSelectedExerciseId}
          onDeleteExercise={handleDeleteExercise}
          onAddExercise={handleAddExerciseToSession}
          onStartAddingExercise={handleStartAddingExercise}
          onCancelAddingExercise={handleCancelAddingExercise}
          onPanelFocus={() => setFocusedRoutinePanel('exercises')}
        />

        <ExerciseSettingsPanel
          selectedExerciseLink={selectedExerciseLink}
          selectedExercise={selectedExercise}
          onSettingControlRef={setSettingControlRef}
          onSettingValueKeyDown={handleSettingValueKeyDown}
          onUpdateTarget={handleUpdateTarget}
          onPanelFocus={() => setFocusedRoutinePanel('settings')}
        />
      </div>
    </div>
  );
});

export default RoutineDetail;
