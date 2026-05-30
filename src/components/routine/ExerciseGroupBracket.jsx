export default function ExerciseGroupBracket({
  refCallback,
  group,
  index,
  exerciseCount,
  isSelected,
  isHighlighted,
  onKeyDown,
  onFocus,
  onSelect,
}) {
  const size = Math.max(2, Math.min(Number(group.size) || 2, exerciseCount));
  const maxStart = Math.max(1, exerciseCount - size + 1);
  const startOrder = Math.min(maxStart, Math.max(1, Number(group.start_order) || 1));
  const gridRow = `${startOrder} / span ${size}`;
  const groupColor = group.color || '#9ece6a';

  return (
    <div
      ref={refCallback}
      tabIndex={0}
      role="button"
      aria-label={`${group.name} 그룹`}
      className={`routine-exercise-group-bracket ${isHighlighted ? 'is-highlighted' : ''}`}
      style={{ gridRow, '--group-color': groupColor }}
      onKeyDown={(event) => onKeyDown(event, index)}
      onFocus={onFocus}
      onClick={() => onSelect(isSelected ? null : group.id)}
    >
      <span className="routine-exercise-group-brace">{'}'}</span>
    </div>
  );
}
