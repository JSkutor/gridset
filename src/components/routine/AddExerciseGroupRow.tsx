// @ts-nocheck
import { useMemo, useState } from "react";
import { Check, Minus, Plus, X } from "lucide-react";

export default function AddExerciseGroupRow({
  exerciseCount,
  groupCount,
  onAddGroup,
  onCancel,
}) {
  const maxSize = Math.max(2, exerciseCount);
  const defaultSize = Math.min(2, maxSize);
  const [name, setName] = useState(`그룹 ${groupCount + 1}`);
  const [size, setSize] = useState(defaultSize);

  const canSave = exerciseCount >= 2;
  const clampedSize = useMemo(() => {
    return Math.min(maxSize, Math.max(2, Number(size) || 2));
  }, [maxSize, size]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSave) return;
    onAddGroup({ name, size: clampedSize });
  };

  return (
    <form className="routine-add-group-row" onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        autoFocus
        maxLength={40}
        aria-label="그룹 이름"
        placeholder="그룹 이름"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
          }
        }}
      />

      <div className="routine-add-group-size">
        <button
          type="button"
          onClick={() => setSize(Math.max(2, clampedSize - 1))}
          aria-label="그룹 크기 줄이기"
          disabled={!canSave || clampedSize <= 2}
        >
          <Minus size={12} />
        </button>
        <span
          role="spinbutton"
          aria-label="그룹 크기 값"
          aria-valuemin={2}
          aria-valuemax={maxSize}
          aria-valuenow={clampedSize}
        >
          {clampedSize}
        </span>
        <button
          type="button"
          onClick={() => setSize(Math.min(maxSize, clampedSize + 1))}
          aria-label="그룹 크기 늘리기"
          disabled={!canSave || clampedSize >= maxSize}
        >
          <Plus size={12} />
        </button>
      </div>

      <button type="submit" aria-label="그룹 저장" disabled={!canSave}>
        <Check size={13} />
      </button>
      <button type="button" onClick={onCancel} aria-label="그룹 추가 취소">
        <X size={13} />
      </button>
    </form>
  );
}
