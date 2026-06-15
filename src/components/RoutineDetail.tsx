// @ts-nocheck
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { useRoutineKeyboardNavigation } from '../hooks/useRoutineKeyboardNavigation';
import { useRoutineDetailActions } from '../hooks/useRoutineDetailActions';
import ExerciseSettingsPanel from './routine/ExerciseSettingsPanel';
import RoutineTabs from './routine/RoutineTabs';
import SessionExerciseListPanel from './routine/SessionExerciseListPanel';
import SessionListPanel from './routine/SessionListPanel';

const RoutineDetail = forwardRef((props, ref) => {
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
    if (element) sessionRefs.current[id] = element;
    else delete sessionRefs.current[id];
  };

  const setExerciseRef = (id, element) => {
    if (element) exerciseRefs.current[id] = element;
    else delete exerciseRefs.current[id];
  };

  const setExerciseGroupRef = (id, element) => {
    if (element) exerciseGroupRefs.current[id] = element;
    else delete exerciseGroupRefs.current[id];
  };

  const setExerciseGroupRowRef = (id, element) => {
    if (element) exerciseGroupRowRefs.current[id] = element;
    else delete exerciseGroupRowRefs.current[id];
  };

  const setSettingControlRef = (index, element) => {
    settingControlRefs.current[index] = element;
  };

  // 모든 비즈니스 로직과 CRUD 액션, 포커스 헬퍼들을 커스텀 훅으로 위임
  const actions = useRoutineDetailActions({
    sessionRefs,
    exerciseRefs,
    exerciseGroupRefs,
    exerciseGroupRowRefs,
    settingControlRefs,
    addSessionBtnRef,
    addExerciseBtnRef,
    addGroupBtnRef,
    pendingFocusIndexRef,
    pendingGroupFocusIdRef,
  });

  const {
    sessions,
    sessionExercises,
    exercises,
    sortedRoutines,
    effectiveRoutineId,
    effectiveRoutine,
    isReadOnly,
    effectiveRoutineSessions,
    effectiveTemporarySession,
    effectiveSessionId,
    effectiveSession,
    activeSessionExercises,
    activeSessionExerciseGroups,
    dayLetter,
    canAddSession,
    selectedExerciseLink,
    selectedExercise,
    selectedExerciseGroup,
    selectedExerciseGroupForSettings,
    selectedExerciseId,
    selectedExerciseGroupId,
    isAddingExerciseRow,
    isAddingExerciseGroupRow,
    focusedRoutinePanel,
    isEditingRoutineName,
    editingRoutineNameVal,
    editingSessionId,
    editingSessionNameVal,
    pendingNewSessionId,

    // Setters & Focus Helpers
    setSelectedSessionId,
    setSelectedExerciseId,
    setSelectedExerciseGroupId,
    setSettingsMode,
    setIsAddingExerciseRow,
    setFocusedRoutinePanel,
    setEditingRoutineNameVal,
    setEditingSessionNameVal,

    focusExerciseGroupRowById,

    // CRUD Handlers
    handleSelectRoutine,
    handleSelectSession,
    handleCreateRoutine,
    handleDuplicateRoutine,
    handleStartRoutineNameEdit,
    handleSaveRoutineName,
    handleCancelRoutineNameEdit,
    handleDeleteRoutine,
    handleAddSession,
    handleCreateTemporarySession,
    handleStartSessionEdit,
    finishSessionEdit,
    cancelSessionEdit,
    handleDeleteSession,
    handleAddExerciseToSession,
    handleDeleteExercise,
    handleUpdateTarget,
    handleUpdateExerciseGroup,
    handleStartAddingExercise,
    handleCancelAddingExercise,
    handleSelectExercise,
    handleSelectExerciseGroup,
    handleFocusExerciseGroupRow,
    handleStartAddingExerciseGroup,
    handleCancelAddingExerciseGroup,
    handleAddExerciseGroup,
    handleDeleteExerciseGroup,
    handleExerciseGroupKeyDown,
    handleAddGroupButtonKeyDown,
    reorderSessions,
    reorderSessionExercises,
  } = actions;

  // 키보드 네비게이션 훅 연동
  const {
    handleSettingValueKeyDown,
    handleSessionKeyDown,
    handleExerciseKeyDown,
    handleAddSessionButtonKeyDown,
    handleAddExerciseButtonKeyDown,
    focusFirstSessionFirstExercise,
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

      <div className="routine-grid">
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
