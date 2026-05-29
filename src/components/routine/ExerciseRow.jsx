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
}) {
  return (
    <motion.div
      ref={refCallback}
      tabIndex={0}
      onKeyDown={(event) => onKeyDown(event, index)}
      onFocus={onFocus}
      onClick={() => onSelect(isSelected ? null : sessionExercise.id)}
      className="routine-exercise-row"
      layout="position"
      animate={getRoutineRowAnimation(isHighlighted)}
      transition={ROUTINE_ROW_LAYOUT_TRANSITION}
      whileHover={getRoutineRowHoverAnimation(isHighlighted)}
      style={{
        padding: '12px 12px',
        borderRadius: '8px',
        cursor: 'pointer',
        border: '1px solid transparent',
        marginBottom: '2px',
        display: 'grid',
        gridTemplateColumns: '24px 1fr 60px 60px 24px',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <span style={{
        fontSize: '11px',
        color: 'var(--text-muted)',
        textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {index + 1}
      </span>

      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: '15px',
          fontWeight: isHighlighted ? '600' : '400',
          color: isHighlighted ? 'var(--text-bright)' : 'var(--text-main)',
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {exercise.name}
        </div>
        {exercise.primary_muscle && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {exercise.primary_muscle}
          </div>
        )}
      </div>

      <span style={{
        fontSize: '15px',
        color: isHighlighted ? 'var(--text-bright)' : 'var(--text-muted)',
        fontWeight: isHighlighted ? '500' : '400',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
      }}>
        {sessionExercise.target_sets}세트
      </span>

      <span style={{
        fontSize: '15px',
        color: isHighlighted ? 'var(--text-bright)' : 'var(--text-muted)',
        fontWeight: isHighlighted ? '500' : '400',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
        justifySelf: 'end',
        marginRight: '8px',
      }}>
        {sessionExercise.target_record}회
      </span>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onDelete(sessionExercise.id);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            opacity: 0,
            borderRadius: '4px',
            flexShrink: 0,
            transition: 'opacity 0.15s, color 0.15s',
          }}
          className="exercise-delete-btn"
          onMouseEnter={event => {
            event.currentTarget.style.color = '#f77a7a';
            event.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={event => {
            event.currentTarget.style.color = 'var(--text-muted)';
            event.currentTarget.style.opacity = '0';
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}
