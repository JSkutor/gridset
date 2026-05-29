import { useRef } from 'react';
import { LayoutGroup } from 'framer-motion';
import { Clock, Plus } from 'lucide-react';
import RoutineHeader from './RoutineHeader';
import RoutineAddButton from './RoutineAddButton';
import { SessionEditRow, SessionRow } from './SessionRows';

export default function SessionListPanel({
  routine,
  routineSessions,
  temporarySession,
  activeSessionId,
  isPanelFocused,
  sessions,
  sessionExercises,
  canAddSession,
  isAddingSessionRow,
  isEditingRoutineName,
  editingRoutineName,
  onEditingRoutineNameChange,
  onStartRoutineNameEdit,
  onSaveRoutineName,
  onCancelRoutineNameEdit,
  onDeleteRoutine,
  editingSessionId,
  editingSessionName,
  onEditingSessionNameChange,
  onStartSessionEdit,
  onFinishSessionEdit,
  onCancelSessionEdit,
  onDeleteSession,
  onAddSession,
  onCreateTemporarySession,
  onSelectSession,
  onSessionKeyDown,
  onTemporarySessionKeyDown,
  onAddSessionButtonKeyDown,
  onSessionRef,
  addSessionBtnRef,
  onPanelFocus,
  onAddButtonFocus,
}) {
  const scrollContainerRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    }, 50);
  };

  const temporaryExerciseCount = temporarySession
    ? sessionExercises.filter(se => se.session_id === temporarySession.id).length
    : 0;
  const isTemporarySessionEditing = temporarySession && editingSessionId === temporarySession.id;
  const isTemporarySessionActive = temporarySession && temporarySession.id === activeSessionId;

  return (
    <div
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {routine && (
        <RoutineHeader
          routine={routine}
          isEditing={isEditingRoutineName}
          editingName={editingRoutineName}
          onEditingNameChange={onEditingRoutineNameChange}
          onStartEdit={onStartRoutineNameEdit}
          onSave={onSaveRoutineName}
          onCancel={onCancelRoutineNameEdit}
          onDelete={onDeleteRoutine}
        />
      )}

      <div style={{
        padding: '16px 20px 10px',
        fontSize: '10px',
        fontWeight: '600',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span>세션 목록</span>
        {routine && !canAddSession && (
          <span style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
            최대 7개
          </span>
        )}
      </div>

      {routine && (
        <div className="routine-temporary-session-zone">
          <div className="routine-temporary-session-heading">
            <span>
              <Clock size={12} />
              임시 세션
            </span>
            <b>순서 제외 · 최대 1개</b>
          </div>

          {!temporarySession ? (
            <button
              type="button"
              className="routine-temporary-session-create"
              onClick={onCreateTemporarySession}
              onFocus={onPanelFocus}
            >
              <Plus size={14} />
              임시 세션 설정
            </button>
          ) : isTemporarySessionEditing ? (
            <SessionEditRow
              session={temporarySession}
              editingName={editingSessionName}
              onEditingNameChange={onEditingSessionNameChange}
              onFinish={onFinishSessionEdit}
              onCancel={onCancelSessionEdit}
            />
          ) : (
            <SessionRow
              refCallback={element => onSessionRef(temporarySession.id, element)}
              session={temporarySession}
              index={-1}
              sessions={sessions}
              exerciseCount={temporaryExerciseCount}
              isActive={isTemporarySessionActive}
              isHighlighted={isTemporarySessionActive && isPanelFocused}
              onKeyDown={onTemporarySessionKeyDown}
              onFocus={onPanelFocus}
              onSelect={onSelectSession}
              onStartEdit={onStartSessionEdit}
              onDelete={onDeleteSession}
            />
          )}
        </div>
      )}

      <div ref={scrollContainerRef} className="session-scroll-container" style={{ flex: 1, overflowY: 'auto', padding: '0 8px 16px' }}>
        {!routine ? (
          <EmptyPanelText>루틴을 선택하거나 추가해주세요</EmptyPanelText>
        ) : (
          <>
            {routineSessions.length === 0 ? (
              <EmptyPanelText>세션이 없습니다</EmptyPanelText>
            ) : (
              <LayoutGroup id={`routine-sessions-${routine.id}`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '6px 4px 4px 4px' }}>
                  {routineSessions.map((session, index) => {
                    const isActive = session.id === activeSessionId;
                    const exerciseCount = sessionExercises.filter(se => se.session_id === session.id).length;
                    const isEditing = editingSessionId === session.id;

                    if (isEditing) {
                      return (
                        <SessionEditRow
                          key={session.id}
                          session={session}
                          editingName={editingSessionName}
                          onEditingNameChange={onEditingSessionNameChange}
                          onFinish={onFinishSessionEdit}
                          onCancel={onCancelSessionEdit}
                        />
                      );
                    }

                    return (
                      <SessionRow
                        key={session.id}
                        refCallback={element => onSessionRef(session.id, element)}
                        session={session}
                        index={index}
                        sessions={sessions}
                        exerciseCount={exerciseCount}
                        isActive={isActive}
                        isHighlighted={isActive && isPanelFocused}
                        onKeyDown={onSessionKeyDown}
                        onFocus={onPanelFocus}
                        onSelect={onSelectSession}
                        onStartEdit={onStartSessionEdit}
                        onDelete={onDeleteSession}
                      />
                    );
                  })}
                </div>
              </LayoutGroup>
            )}

            {canAddSession && !isAddingSessionRow && (
              <RoutineAddButton
                ref={addSessionBtnRef}
                label="세션 추가"
                onFocus={onAddButtonFocus}
                onClick={() => {
                  onAddSession();
                  scrollToBottom();
                }}
                onKeyDown={onAddSessionButtonKeyDown}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyPanelText({ children }) {
  return (
    <div style={{ padding: '20px 8px', color: 'var(--text-muted)', fontSize: '13px', opacity: 0.6 }}>
      {children}
    </div>
  );
}
