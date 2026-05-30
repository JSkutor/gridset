import { Clock, Dumbbell, Layers, RotateCcw, Timer, Activity } from "lucide-react";
import {
  NumberStepper,
  RestTimeStepper,
  SettingRow,
  UnilateralStepper,
} from "./RoutineSettingSteppers";
import { useWorkoutStore } from "../../store/useWorkoutStore";

export default function ExerciseSettingsPanel({
  selectedExerciseLink,
  selectedExercise,
  selectedExerciseGroup,
  selectedExerciseGroupForSettings,
  exerciseCount,
  onSettingControlRef,
  onSettingValueKeyDown,
  onUpdateTarget,
  onUpdateExerciseGroup,
  onFocusExerciseGroupRow,
  onPanelFocus,
  isReadOnly,
}) {
  return (
    <div
      className="glass-panel"
      onFocusCapture={onPanelFocus}
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 16px 10px",
          fontSize: "10px",
          fontWeight: "600",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
        }}
      >
        설정
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}>
        {selectedExerciseGroupForSettings ? (
          <GroupSettings
            group={selectedExerciseGroupForSettings}
            exerciseCount={exerciseCount}
            onSettingControlRef={onSettingControlRef}
            onUpdateExerciseGroup={onUpdateExerciseGroup}
            onFocusExerciseGroupRow={onFocusExerciseGroupRow}
            isReadOnly={isReadOnly}
          />
        ) : selectedExerciseLink && selectedExercise ? (
          <ExerciseSettings
            selectedExerciseLink={selectedExerciseLink}
            selectedExercise={selectedExercise}
            selectedExerciseGroup={selectedExerciseGroup}
            onSettingControlRef={onSettingControlRef}
            onSettingValueKeyDown={onSettingValueKeyDown}
            onUpdateTarget={onUpdateTarget}
            isReadOnly={isReadOnly}
          />
        ) : (
          <div
            style={{
              paddingTop: "40px",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "13px",
              opacity: 0.5,
              lineHeight: 1.6,
            }}
          >
            운동을 선택하면
            <br />
            세부 설정이 표시됩니다
          </div>
        )}
      </div>
    </div>
  );
}

function GroupSettings({
  group,
  exerciseCount,
  onSettingControlRef,
  onUpdateExerciseGroup,
  onFocusExerciseGroupRow,
  isReadOnly,
}) {
  const size = Math.max(2, Math.min(Number(group.size) || 2, exerciseCount));
  const maxStart = Math.max(1, exerciseCount - size + 1);
  const startOrder = Math.min(maxStart, Math.max(1, Number(group.start_order) || 1));

  const moveFocus = (index) => {
    const element = document.querySelector(`[data-group-setting-index="${index}"]`);
    element?.focus();
  };

  const handleValueKeyDown = (event, index, onIncrement, onDecrement) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (event.metaKey || event.ctrlKey) onIncrement();
      else moveFocus(index - 1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      if (event.metaKey || event.ctrlKey) onDecrement();
      else moveFocus(index + 1);
    } else if (event.key === "ArrowLeft" || event.key === "Escape") {
      event.preventDefault();
      onFocusExerciseGroupRow(group.id);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <div
          style={{
            fontSize: "18px",
            fontWeight: "700",
            color: "var(--text-bright)",
            letterSpacing: "-0.02em",
            marginBottom: "4px",
          }}
        >
          {group.name}
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "10px",
              padding: "2px 6px",
              borderRadius: "3px",
              background: `color-mix(in srgb, ${group.color || "#9ece6a"} 12%, transparent)`,
              color: group.color || "#9ece6a",
              border: `1px solid color-mix(in srgb, ${group.color || "#9ece6a"} 24%, transparent)`,
            }}
          >
            그룹
          </span>
        </div>
      </div>

      <SettingRow label="그룹 이름" icon={<Layers size={13} />}>
        <input
          className="setting-text-input"
          value={group.name}
          maxLength={40}
          disabled={isReadOnly}
          onChange={(event) => onUpdateExerciseGroup(group.id, { name: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              onFocusExerciseGroupRow(group.id);
            } else if (event.key === "ArrowDown") {
              event.preventDefault();
              moveFocus(0);
            }
          }}
        />
      </SettingRow>

      <SettingRow label="시작 위치" icon={<RotateCcw size={13} />}>
        <NumberStepper
          value={startOrder}
          min={1}
          max={maxStart}
          onChange={(value) => onUpdateExerciseGroup(group.id, { start_order: value })}
          valueRef={(element) => {
            if (element) element.dataset.groupSettingIndex = "0";
            onSettingControlRef(0, element);
          }}
          onValueKeyDown={(event) =>
            handleValueKeyDown(
              event,
              0,
              () => onUpdateExerciseGroup(group.id, { start_order: Math.min(maxStart, startOrder + 1) }),
              () => onUpdateExerciseGroup(group.id, { start_order: Math.max(1, startOrder - 1) }),
            )
          }
          unit="번째"
          disabled={isReadOnly}
        />
      </SettingRow>

      <SettingRow label="그룹 크기" icon={<Dumbbell size={13} />}>
        <NumberStepper
          value={size}
          min={2}
          max={Math.max(2, exerciseCount)}
          onChange={(value) => onUpdateExerciseGroup(group.id, { size: value })}
          valueRef={(element) => {
            if (element) element.dataset.groupSettingIndex = "1";
            onSettingControlRef(1, element);
          }}
          onValueKeyDown={(event) =>
            handleValueKeyDown(
              event,
              1,
              () => onUpdateExerciseGroup(group.id, { size: Math.min(exerciseCount, size + 1) }),
              () => onUpdateExerciseGroup(group.id, { size: Math.max(2, size - 1) }),
            )
          }
          unit="개"
          disabled={isReadOnly}
        />
      </SettingRow>
    </div>
  );
}

function ExerciseSettings({
  selectedExerciseLink,
  selectedExercise,
  selectedExerciseGroup,
  onSettingControlRef,
  onSettingValueKeyDown,
  onUpdateTarget,
  isReadOnly,
}) {
  const reps = Number.parseInt(selectedExerciseLink.target_record, 10) || 10;
  const restBetweenSets = selectedExerciseLink.rest_between_sets ?? 90;
  const restAfterExercise = selectedExerciseLink.rest_after_exercise ?? 120;
  const updateExercise = useWorkoutStore((state) => state.updateExercise);

  const isCustom = selectedExercise.user_id !== null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <div
          style={{
            fontSize: "18px",
            fontWeight: "700",
            color: "var(--text-bright)",
            letterSpacing: "-0.02em",
            marginBottom: "4px",
          }}
        >
          {selectedExercise.name}
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {selectedExercise.primary_muscle && (
            <span
              style={{
                fontSize: "10px",
                padding: "2px 6px",
                borderRadius: "3px",
                background: "rgba(122,162,247,0.08)",
                color: "var(--accent)",
                border: "1px solid rgba(122,162,247,0.12)",
              }}
            >
              {selectedExercise.primary_muscle}
            </span>
          )}
          {selectedExercise.equipment && (
            <span
              style={{
                fontSize: "10px",
                padding: "2px 6px",
                borderRadius: "3px",
                background: "rgba(255,255,255,0.03)",
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
              }}
            >
              {selectedExercise.equipment}
            </span>
          )}
          {selectedExerciseGroup && (
            <span
              style={{
                fontSize: "10px",
                padding: "2px 6px",
                borderRadius: "3px",
                background: `color-mix(in srgb, ${selectedExerciseGroup.color || "#9ece6a"} 12%, transparent)`,
                color: selectedExerciseGroup.color || "#9ece6a",
                border: `1px solid color-mix(in srgb, ${selectedExerciseGroup.color || "#9ece6a"} 24%, transparent)`,
              }}
            >
              {selectedExerciseGroup.name}
            </span>
          )}
        </div>
      </div>

      <SettingRow label="목표 세트" icon={<Dumbbell size={13} />}>
        <NumberStepper
          value={selectedExerciseLink.target_sets || 3}
          min={1}
          max={20}
          onChange={(value) =>
            onUpdateTarget(selectedExerciseLink.id, "target_sets", value)
          }
          valueRef={(element) => onSettingControlRef(0, element)}
          onValueKeyDown={(event) =>
            onSettingValueKeyDown(
              event,
              0,
              () =>
                onUpdateTarget(
                  selectedExerciseLink.id,
                  "target_sets",
                  Math.min(20, (selectedExerciseLink.target_sets || 3) + 1),
                ),
              () =>
                onUpdateTarget(
                  selectedExerciseLink.id,
                  "target_sets",
                  Math.max(1, (selectedExerciseLink.target_sets || 3) - 1),
                ),
            )
          }
          unit="세트"
          disabled={isReadOnly}
        />
      </SettingRow>

      <SettingRow label="목표 횟수" icon={<RotateCcw size={13} />}>
        <NumberStepper
          value={reps}
          min={1}
          max={999}
          onChange={(value) =>
            onUpdateTarget(
              selectedExerciseLink.id,
              "target_record",
              String(value),
            )
          }
          valueRef={(element) => onSettingControlRef(1, element)}
          onValueKeyDown={(event) => {
            onSettingValueKeyDown(
              event,
              1,
              () =>
                onUpdateTarget(
                  selectedExerciseLink.id,
                  "target_record",
                  String(Math.min(999, reps + 1)),
                ),
              () =>
                onUpdateTarget(
                  selectedExerciseLink.id,
                  "target_record",
                  String(Math.max(1, reps - 1)),
                ),
            );
          }}
          unit="회"
          disabled={isReadOnly}
        />
      </SettingRow>

      <SettingRow label="세트 간 휴식" icon={<Timer size={13} />}>
        <RestTimeStepper
          value={restBetweenSets}
          onChange={(value) =>
            onUpdateTarget(selectedExerciseLink.id, "rest_between_sets", value)
          }
          valueRef={(element) => onSettingControlRef(2, element)}
          onValueKeyDown={(event) => {
            onSettingValueKeyDown(
              event,
              2,
              () =>
                onUpdateTarget(
                  selectedExerciseLink.id,
                  "rest_between_sets",
                  Math.min(600, restBetweenSets + 15),
                ),
              () =>
                onUpdateTarget(
                  selectedExerciseLink.id,
                  "rest_between_sets",
                  Math.max(0, restBetweenSets - 15),
                ),
            );
          }}
          disabled={isReadOnly}
        />
      </SettingRow>

      <SettingRow label="운동 후 휴식" icon={<Clock size={13} />}>
        <RestTimeStepper
          value={restAfterExercise}
          onChange={(value) =>
            onUpdateTarget(
              selectedExerciseLink.id,
              "rest_after_exercise",
              value,
            )
          }
          valueRef={(element) => onSettingControlRef(3, element)}
          onValueKeyDown={(event) => {
            onSettingValueKeyDown(
              event,
              3,
              () =>
                onUpdateTarget(
                  selectedExerciseLink.id,
                  "rest_after_exercise",
                  Math.min(600, restAfterExercise + 15),
                ),
              () =>
                onUpdateTarget(
                  selectedExerciseLink.id,
                  "rest_after_exercise",
                  Math.max(0, restAfterExercise - 15),
                ),
            );
          }}
          disabled={isReadOnly}
        />
      </SettingRow>

      {/* 편측성 (좌우 구분) 설정 - 주변 스태퍼 UI 컴포넌트와 형식을 일치시킴 */}
      <SettingRow label="좌우 구분" icon={<Activity size={13} />}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <UnilateralStepper
            value={selectedExercise.is_unilateral}
            onChange={(value) =>
              updateExercise(selectedExercise.id, { is_unilateral: value })
            }
            valueRef={(element) => onSettingControlRef(4, element)}
            onValueKeyDown={(event) => {
              onSettingValueKeyDown(
                event,
                4,
                () =>
                  updateExercise(selectedExercise.id, {
                    is_unilateral: !selectedExercise.is_unilateral,
                  }),
                () =>
                  updateExercise(selectedExercise.id, {
                    is_unilateral: !selectedExercise.is_unilateral,
                  }),
              );
            }}
            disabled={!isCustom || isReadOnly}
          />
        </div>
      </SettingRow>
    </div>
  );
}
