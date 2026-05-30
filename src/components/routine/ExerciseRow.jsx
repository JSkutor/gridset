import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import {
  ROUTINE_ROW_LAYOUT_TRANSITION,
  getRoutineRowAnimation,
  getRoutineRowHoverAnimation,
} from '../../utils/routineRowAnimation';

export default function ExerciseRow({
  refCallback,
  sessionExercise,
  exercise,
  index,
  isSelected,
  isHighlighted,
  onKeyDown,
  onFocus,
  onSelect,
  onDelete,
  isReadOnly,
}) {
  return (
    <motion.div
      ref={refCallback}
      tabIndex={0}
      onKeyDown={(event) => onKeyDown(event, index)}
      onFocus={onFocus}
      onClick={() => onSelect(isSelected ? null : sessionExercise.id)}
      className={`routine-exercise-row ${isHighlighted ? 'is-highlighted' : ''}`}
      layout="position"
      animate={getRoutineRowAnimation(isHighlighted)}
      transition={ROUTINE_ROW_LAYOUT_TRANSITION}
      whileHover={getRoutineRowHoverAnimation(isHighlighted)}
    >
      <span className="routine-row-index">
        {index + 1}
      </span>

      <div className="routine-exercise-main">
        <div className="routine-exercise-name">
          {exercise.name}
        </div>
        {exercise.primary_muscle && (
          <div className="routine-exercise-muscle">
            {exercise.primary_muscle}
          </div>
        )}
      </div>

      <span className="routine-exercise-target">
        {sessionExercise.target_sets}세트
      </span>

      <span className="routine-exercise-target routine-exercise-target--right">
        {sessionExercise.target_record}회
      </span>

      <div className="routine-row-delete-slot">
        {!isReadOnly && (
          <button
            onClick={(event) => {
              event.stopPropagation();
              onDelete(sessionExercise.id);
            }}
            className="exercise-delete-btn routine-row-delete-btn"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
