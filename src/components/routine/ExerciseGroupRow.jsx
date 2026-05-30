import { Trash2 } from 'lucide-react';

export default function ExerciseGroupRow({
  refCallback,
  group,
  index,
  exerciseCount,
  isSelected,
  isHighlighted,
  onKeyDown,
  onFocus,
  onSelect,
  onDelete,
  isReadOnly,
}) {
  const size = Math.max(2, Math.min(Number(group.size) || 2, exerciseCount));
  const maxStart = Math.max(1, exerciseCount - size + 1);
  const startOrder = Math.min(maxStart, Math.max(1, Number(group.start_order) || 1));
  const endOrder = startOrder + size - 1;
  const groupColor = group.color || '#9ece6a';

  return (
    <div
      ref={refCallback}
      tabIndex={0}
      className={`routine-group-row ${isHighlighted ? 'is-highlighted' : ''}`}
      style={{ '--group-color': groupColor }}
      onKeyDown={(event) => onKeyDown(event, index)}
      onFocus={() => onFocus(group)}
      onClick={() => onSelect(isSelected ? null : group)}
    >
      <span className="routine-group-row-index">{index + 1}</span>
      <div className="routine-group-row-main">
        <strong>{group.name}</strong>
        <span>{startOrder}-{endOrder}</span>
      </div>
      <span className="routine-group-row-size">{size}개</span>
      {!isReadOnly && (
        <button
          type="button"
          className="routine-group-row-delete"
          aria-label={`${group.name} 그룹 삭제`}
          onClick={(event) => {
            event.stopPropagation();
            onDelete(group.id);
          }}
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}
