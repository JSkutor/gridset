// @ts-nocheck
import { motion } from 'framer-motion';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import {
  ROUTINE_ROW_LAYOUT_TRANSITION,
  getRoutineRowAnimation,
  getRoutineRowHoverAnimation,
} from '../../utils/routineRowAnimation';
import { getFormattedSessionName, getSessionColor, getSessionDayLetter, isTemporarySession } from '../../utils/sessionHelper';
import { useIsKeyboardNavigating } from '../../hooks/useIsKeyboardNavigating';


export function SessionEditRow({ session, editingName, onEditingNameChange, onFinish, onCancel }) {
  return (
    <div
      onClick={event => event.stopPropagation()}
      className="routine-session-edit-row"
    >
      <input
        type="text"
        value={editingName}
        onChange={(event) => onEditingNameChange(event.target.value)}
        maxLength={100}
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
        className="routine-session-edit-input"
      />
      <button
        onClick={() => onFinish(session)}
        className="routine-session-edit-action routine-session-edit-action--save"
      >
        <Check size={12} />
      </button>
      <button
        onClick={() => onCancel(session)}
        className="routine-session-edit-action routine-session-edit-action--cancel"
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
  isHighlighted,
  onKeyDown,
  onFocus,
  onSelect,
  onStartEdit,
  onDelete,
  isReadOnly,
}) {
  const isTemporary = isTemporarySession(session);
  const sessionDayLetter = getSessionDayLetter(session, sessions);
  const sessionColor = getSessionColor(session);
  const isKeyboardNav = useIsKeyboardNavigating();


  return (
    <motion.div
      ref={refCallback}
      tabIndex={0}
      onKeyDown={(event) => onKeyDown(event, index)}
      onFocus={onFocus}
      onClick={() => onSelect(session.id)}
      className={`routine-session-row ${isTemporary ? 'routine-session-row--temporary' : ''} ${isHighlighted ? 'is-highlighted' : ''}`}
      layout="position"
      animate={getRoutineRowAnimation(isHighlighted)}
      transition={ROUTINE_ROW_LAYOUT_TRANSITION}
      whileHover={isKeyboardNav ? undefined : getRoutineRowHoverAnimation(isHighlighted)}

    >
      <div className="routine-row-body">
        <div className="routine-session-name">
          {isTemporary ? (
            <span className="routine-session-temp-title">
              <span className="routine-session-temp-badge">임시</span>
              <span>{session.name}</span>
            </span>
          ) : sessionDayLetter ? (
            <>
              <span className="routine-session-day" style={{ '--session-color': sessionColor }}>
                Day {sessionDayLetter}
              </span>
              <span className="routine-row-separator">:</span>
              <span>{session.name}</span>
            </>
          ) : (
            getFormattedSessionName(session, sessions)
          )}
        </div>
        <div className="routine-row-subtext">
          운동 {exerciseCount}개{isTemporary ? ' · 로테이션 제외' : ''}
        </div>
      </div>

      {isHighlighted && !isReadOnly && (
        <div className="routine-row-actions" onClick={event => event.stopPropagation()}>
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
    </motion.div>
  );
}

function SmallRowButton({ children, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="routine-small-row-button"
      style={{ '--button-hover-color': color }}
    >
      {children}
    </button>
  );
}
