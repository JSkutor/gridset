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
  const startOrder = Math.min(
    maxStart,
    Math.max(1, Number(group.start_order) || 1),
  );
  const gridRow = `${startOrder} / span ${size}`;
  const groupColor = group.color || "#9ece6a";

  // 그룹 크기에 따라 브라켓 크기 조정
  const fontSizeScale = Math.min(1 + (size - 2) * 0.2, 2.0); // size 2→1.0x, size 3→1.2x, size 4→1.4x, size 5→1.6x, 최대 2.0x

  return (
    <div
      ref={refCallback}
      tabIndex={0}
      role="button"
      aria-label={`${group.name} 그룹 (${size}개 운동)`}
      className={`routine-exercise-group-bracket ${isHighlighted ? "is-highlighted" : ""}`}
      style={{ gridRow, "--group-color": groupColor }}
      data-group-size={size}
      onKeyDown={(event) => onKeyDown(event, index)}
      onFocus={onFocus}
      onClick={() => onSelect(isSelected ? null : group.id)}
    >
      <span
        className="routine-exercise-group-brace"
        style={{ fontSize: `${38 * fontSizeScale}px` }}
      >
        {"}"}
      </span>
    </div>
  );
}
