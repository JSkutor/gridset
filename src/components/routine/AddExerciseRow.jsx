import { X } from 'lucide-react';
import ExerciseAutocomplete from '../ExerciseAutocomplete';

export default function AddExerciseRow({ index, onAddExercise, onCancel }) {
  return (
    <div
      style={{
        padding: '8px 12px',
        borderRadius: '8px',
        background: 'rgba(228, 232, 240, 0.03)',
        marginBottom: '8px',
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

      <div style={{ gridColumn: '2 / span 3', minWidth: 0 }}>
        <ExerciseAutocomplete
          onSelect={onAddExercise}
          onCancel={onCancel}
          autoFocus={true}
          placeholder="추가할 운동 검색..."
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gridColumn: '5' }}>
        <button
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.15s',
          }}
          onMouseEnter={event => event.currentTarget.style.color = '#f77a7a'}
          onMouseLeave={event => event.currentTarget.style.color = 'var(--text-muted)'}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
