import { useRef } from 'react';
import { Plus } from 'lucide-react';
import RoutineHeader from './RoutineHeader';
import { SessionEditRow, SessionRow } from './SessionRows';

export default function SessionListPanel({
  routine,
  routineSessions,
  activeSessionId,
  sessions,
  sessionExercises,
  canAddSession,
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
  onSelectSession,
  onSessionKeyDown,
  onSessionRef,
}) {
  const scrollContainerRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    }, 50);
  };

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

      <div ref={scrollContainerRef} className="session-scroll-container" style={{ flex: 1, overflowY: 'auto', padding: '0 8px 16px' }}>
        {!routine ? (
          <EmptyPanelText>루틴을 선택하거나 추가해주세요</EmptyPanelText>
        ) : (
          <>
            {routineSessions.length === 0 ? (
              <EmptyPanelText>세션이 없습니다</EmptyPanelText>
            ) : routineSessions.map((session, index) => {
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
                  onKeyDown={onSessionKeyDown}
                  onSelect={onSelectSession}
                  onStartEdit={onStartSessionEdit}
                  onDelete={onDeleteSession}
                />
              );
            })}

            {canAddSession && (
              <button
                type="button"
                onClick={() => {
                  onAddSession();
                  scrollToBottom();
                }}
                style={{
                  width: '100%',
                  padding: '10px 0',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '8px',
                }}
              >
                <Plus size={14} />
                세션 추가
              </button>
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
