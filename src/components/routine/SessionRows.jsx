import { Check, Pencil, Trash2, X } from 'lucide-react';
import { getFormattedSessionName, getSessionColor, getSessionDayLetter } from '../../utils/sessionHelper';

export function SessionEditRow({ session, editingName, onEditingNameChange, onFinish, onCancel }) {
  return (
    <div
      onClick={event => event.stopPropagation()}
      style={{
        padding: '8px 10px',
        borderRadius: '7px',
        background: 'rgba(228, 232, 240, 0.06)',
        marginBottom: '2px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <input
        type="text"
        value={editingName}
        onChange={(event) => onEditingNameChange(event.target.value)}
        autoFocus
        placeholder="세션 이름"
        onFocus={(event) => event.currentTarget.select()}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            onFinish(session);
          } else if (event.key === 'Escape') {
            event.preventDefault();
            onCancel(session);
          }
        }}
        style={{
          flex: 1,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid var(--border-focus)',
          borderRadius: '5px',
          color: 'var(--text-bright)',
          fontSize: '13px',
          outline: 'none',
          padding: '4px 8px',
          minWidth: 0,
        }}
      />
      <button
        onClick={() => onFinish(session)}
        style={{
          background: 'rgba(122,162,247,0.15)',
          border: 'none',
          borderRadius: '5px',
          color: 'var(--accent)',
          cursor: 'pointer',
          padding: '4px 6px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Check size={12} />
      </button>
      <button
        onClick={() => onCancel(session)}
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: 'none',
          borderRadius: '5px',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '4px 6px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <X size={12} />
      </button>
    </div>
  );
}

export function SessionRow({
  refCallback,
  session,
  index,
  sessions,
  exerciseCount,
  isActive,
  onKeyDown,
  onSelect,
  onStartEdit,
  onDelete,
}) {
  const sessionDayLetter = getSessionDayLetter(session, sessions);
  const sessionColor = getSessionColor(session);

  return (
    <div
      ref={refCallback}
      tabIndex={0}
      onKeyDown={(event) => onKeyDown(event, index)}
      onClick={() => onSelect(session.id)}
      className="routine-session-row"
      style={{
        padding: '10px 10px',
        borderRadius: '7px',
        cursor: 'pointer',
        background: isActive ? 'rgba(228, 232, 240, 0.06)' : 'transparent',
        marginBottom: '2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'background 0.15s',
      }}
      onMouseEnter={event => { if (!isActive) event.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
      onMouseLeave={event => { if (!isActive) event.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '14px',
          fontWeight: isActive ? '600' : '400',
          color: isActive ? 'var(--text-bright)' : 'var(--text-main)',
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {sessionDayLetter ? (
            <>
              <span style={{
                color: sessionColor,
                fontWeight: '700',
                textShadow: `0 0 12px ${sessionColor}55`,
              }}>
                Day {sessionDayLetter}
              </span>
              <span style={{ margin: '0 6px', opacity: 0.6 }}>:</span>
              <span>{session.name}</span>
            </>
          ) : (
            getFormattedSessionName(session, sessions)
          )}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
          운동 {exerciseCount}개
        </div>
      </div>

      {isActive && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={event => event.stopPropagation()}>
          <SmallRowButton
            color="var(--accent)"
            onClick={() => onStartEdit(session)}
          >
            <Pencil size={12} />
          </SmallRowButton>
          <SmallRowButton
            color="#f77a7a"
            onClick={() => onDelete(session)}
          >
            <Trash2 size={13} />
          </SmallRowButton>
        </div>
      )}
    </div>
  );
}

function SmallRowButton({ children, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        padding: '4px',
        opacity: 0.5,
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
      }}
      onMouseEnter={event => {
        event.currentTarget.style.color = color;
        event.currentTarget.style.opacity = '1';
      }}
      onMouseLeave={event => {
        event.currentTarget.style.color = 'var(--text-muted)';
        event.currentTarget.style.opacity = '0.5';
      }}
    >
      {children}
    </button>
  );
}
