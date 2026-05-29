import { useRef } from 'react';
import { LayoutGroup } from 'framer-motion';
import { ListPlus } from 'lucide-react';
import AddExerciseRow from './AddExerciseRow';
import ExerciseRow from './ExerciseRow';
import RoutineAddButton from './RoutineAddButton';

export default function SessionExerciseListPanel({
  session,
  dayLetter,
  sessionExercises,
  exercises,
  selectedExerciseId,
  isPanelFocused,
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
  onPanelFocus,
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
            {sessionExercises.length === 0 ? null : (
              <LayoutGroup id={`session-exercises-${session.id}`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '6px 4px 4px 4px' }}>
                  {sessionExercises.map((sessionExercise, index) => {
                    const exercise = exercises.find(item => item.id === sessionExercise.exercise_id);
                    if (!exercise) return null;

                    const isSelected = sessionExercise.id === selectedExerciseId;
                    return (
                      <ExerciseRow
                        key={sessionExercise.id}
                        refCallback={element => onExerciseRef(sessionExercise.id, element)}
                        sessionExercise={sessionExercise}
                        exercise={exercise}
                        index={index}
                        isSelected={isSelected}
                        isHighlighted={isSelected && isPanelFocused}
                        onKeyDown={onExerciseKeyDown}
                        onFocus={onPanelFocus}
                        onSelect={onSelectExercise}
                        onDelete={onDeleteExercise}
                      />
                    );
                  })}
                </div>
              </LayoutGroup>
            )}

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
              <RoutineAddButton
                ref={addExerciseBtnRef}
                label="운동 추가"
                onFocus={() => {
                  onPanelFocus();
                  onSelectExercise(null);
                }}
                onClick={() => {
                  onStartAddingExercise();
                  scrollToBottom();
                }}
                onKeyDown={onAddExerciseButtonKeyDown}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
