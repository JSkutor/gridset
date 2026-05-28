import { useRef } from 'react';
import { ListPlus, Plus } from 'lucide-react';
import AddExerciseRow from './AddExerciseRow';
import ExerciseRow from './ExerciseRow';

export default function SessionExerciseListPanel({
  session,
  dayLetter,
  sessionExercises,
  exercises,
  selectedExerciseId,
  isAddingExerciseRow,
  addExerciseBtnRef,
  onExerciseKeyDown,
  onAddExerciseButtonKeyDown,
  onExerciseRef,
  onSelectExercise,
  onDeleteExercise,
  onAddExercise,
  onStartAddingExercise,
  onCancelAddingExercise,
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
      <div style={{
        padding: '16px 20px 10px',
        fontSize: '11px',
        fontWeight: '600',
        letterSpacing: '0.05em',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)',
      }}>
        <span>
          {session ? (
            <>
              <span style={{ color: 'var(--accent)', fontWeight: '700' }}>Day {dayLetter}</span>
              <span style={{ margin: '0 6px', opacity: 0.5 }}>:</span>
              <span>{session.name}</span>
            </>
          ) : '운동'}
        </span>
      </div>

      <div
        ref={scrollContainerRef}
        className="exercise-scroll-container"
        style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 16px' }}
      >
        {!session ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', opacity: 0.5 }}>
            세션을 선택하세요
          </div>
        ) : (
          <>
            {sessionExercises.map((sessionExercise, index) => {
              const exercise = exercises.find(item => item.id === sessionExercise.exercise_id);
              if (!exercise) return null;

              const isSelected = sessionExercise.id === selectedExerciseId;
              return (
                <ExerciseRow
                  key={sessionExercise.id}
                  refCallback={element => onExerciseRef(index, element)}
                  sessionExercise={sessionExercise}
                  exercise={exercise}
                  index={index}
                  isSelected={isSelected}
                  onKeyDown={onExerciseKeyDown}
                  onSelect={onSelectExercise}
                  onDelete={onDeleteExercise}
                />
              );
            })}

            {sessionExercises.length === 0 && !isAddingExerciseRow && (
              <div style={{ padding: '30px 20px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', opacity: 0.5 }}>
                <ListPlus size={24} style={{ marginBottom: '6px', display: 'block', margin: '0 auto 6px' }} />
                등록된 운동이 없습니다
              </div>
            )}

            {isAddingExerciseRow && (
              <AddExerciseRow
                index={sessionExercises.length}
                onAddExercise={(exercise) => {
                  onAddExercise(exercise);
                  onCancelAddingExercise(false);
                }}
                onCancel={() => onCancelAddingExercise(true)}
              />
            )}

            {!isAddingExerciseRow && (
              <button
                ref={addExerciseBtnRef}
                className="routine-add-exercise-btn"
                onFocus={() => onSelectExercise(null)}
                onClick={() => {
                  onStartAddingExercise();
                  scrollToBottom();
                }}
                onKeyDown={onAddExerciseButtonKeyDown}
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
                운동 추가
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
