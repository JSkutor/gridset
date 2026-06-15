// @ts-nocheck
import { Check, Pencil, Trash2, X, Lock } from 'lucide-react';

export default function RoutineHeader({
  routine,
  isEditing,
  editingName,
  onEditingNameChange,
  onStartEdit,
  onSave,
  onCancel,
  onDelete,
  isReadOnly,
}) {
  return (
    <div style={{
      padding: '20px 20px 16px',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        fontSize: '11px',
        fontWeight: '600',
        color: 'var(--accent)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '4px',
      }}>
        현재 루틴
      </div>

      {isEditing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }} onClick={event => event.stopPropagation()}>
          <input
            type="text"
            value={editingName}
            onChange={(event) => onEditingNameChange(event.target.value)}
            maxLength={100}
            autoFocus
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onSave();
              } else if (event.key === 'Escape') {
                onCancel();
              }
            }}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-focus)',
              borderRadius: '6px',
              color: 'var(--text-bright)',
              fontSize: '14px',
              outline: 'none',
              padding: '6px 10px',
              minWidth: 0,
            }}
          />
          <button
            onClick={onSave}
            style={{
              background: 'rgba(122,162,247,0.15)',
              border: 'none',
              borderRadius: '6px',
              color: 'var(--accent)',
              cursor: 'pointer',
              padding: '6px 8px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Check size={14} />
          </button>
          <button
            onClick={onCancel}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '6px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px 8px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', flex: 1 }}>
            <div style={{
              fontSize: '20px',
              fontWeight: '700',
              color: 'var(--text-bright)',
              letterSpacing: '-0.02em',
              wordBreak: 'break-all',
            }}>
              {routine.name}
            </div>
            {isReadOnly && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px',
                fontWeight: '600',
                padding: '3px 8px',
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'var(--text-muted)',
              }}>
                <Lock size={10} />
                보관됨
              </div>
            )}
          </div>
          {!isReadOnly && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <IconButton
                color="var(--accent)"
                hoverBackground="rgba(122,162,247,0.08)"
                onClick={(event) => {
                  event.stopPropagation();
                  onStartEdit();
                }}
              >
                <Pencil size={13} />
              </IconButton>
              <IconButton
                color="#f77a7a"
                hoverBackground="rgba(247,122,122,0.08)"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 size={13} />
              </IconButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IconButton({ children, color, hoverBackground, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        padding: '6px',
        display: 'flex',
        alignItems: 'center',
        borderRadius: '4px',
        transition: 'all 0.15s',
      }}
      onMouseEnter={event => {
        event.currentTarget.style.color = color;
        event.currentTarget.style.background = hoverBackground;
      }}
      onMouseLeave={event => {
        event.currentTarget.style.color = 'var(--text-muted)';
        event.currentTarget.style.background = 'none';
      }}
    >
      {children}
    </button>
  );
}
