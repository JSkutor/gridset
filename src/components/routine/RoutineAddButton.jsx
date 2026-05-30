import { forwardRef } from 'react';
import { Plus } from 'lucide-react';

const RoutineAddButton = forwardRef(function RoutineAddButton({
  label,
  onFocus,
  onClick,
  onKeyDown,
  disabled = false,
  title,
}, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className="routine-add-exercise-btn"
      onFocus={onFocus}
      onClick={onClick}
      onKeyDown={onKeyDown}
      disabled={disabled}
      title={title}
      style={{
        width: '100%',
        padding: '10px 0',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px dashed var(--border)',
        borderRadius: '8px',
        color: 'var(--text-muted)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        marginTop: '8px',
        opacity: disabled ? 0.42 : 1,
      }}
    >
      <Plus size={14} />
      {label}
    </button>
  );
});

export default RoutineAddButton;
