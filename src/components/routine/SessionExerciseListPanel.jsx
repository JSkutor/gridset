import { useRef } from "react";
import { LayoutGroup } from "framer-motion";
import { ListPlus } from "lucide-react";
import AddExerciseGroupRow from "./AddExerciseGroupRow";
import AddExerciseRow from "./AddExerciseRow";
import ExerciseGroupBracket from "./ExerciseGroupBracket";
import ExerciseGroupRow from "./ExerciseGroupRow";
import ExerciseRow from "./ExerciseRow";
import RoutineAddButton from "./RoutineAddButton";
import { isTemporarySession } from "../../utils/sessionHelper";
import {
  MAX_GROUPS_PER_SESSION,
  getLargestAvailableGroupSize,
} from "../../utils/sessionExerciseGroups";

export default function SessionExerciseListPanel({
  session,
  dayLetter,
  sessionExercises,
  exerciseGroups = [],
  exercises,
  selectedExerciseId,
  selectedExerciseGroupId = null,
  isPanelFocused,
  isGroupPanelFocused = false,
  isAddingExerciseRow,
  isAddingExerciseGroupRow = false,
  addExerciseBtnRef,
  addGroupBtnRef,
  onExerciseKeyDown,
  onAddExerciseButtonKeyDown,
  onAddGroupButtonKeyDown,
  onExerciseGroupKeyDown,
  onExerciseRef,
  onExerciseGroupRef,
  onExerciseGroupRowRef,
  onSelectExercise,
  onSelectExerciseGroup,
  onDeleteExercise,
  onDeleteExerciseGroup,
  onAddExercise,
  onAddExerciseGroup,
  onStartAddingExercise,
  onStartAddingExerciseGroup,
  onCancelAddingExercise,
  onCancelAddingExerciseGroup,
  onPanelFocus,
  onGroupPanelFocus,
  onGroupRowFocus,
  onGroupAddButtonFocus,
  isReadOnly,
}) {
  const scrollContainerRef = useRef(null);
  const isTemporary = isTemporarySession(session);
  const hasGroups = exerciseGroups.length > 0;
  const largestAvailableGroupSize = getLargestAvailableGroupSize(
    sessionExercises.length,
    exerciseGroups,
  );
  const canAddExerciseGroup =
    exerciseGroups.length < MAX_GROUPS_PER_SESSION &&
    largestAvailableGroupSize >= 2;
  const groupAddDisabledReason =
    exerciseGroups.length >= MAX_GROUPS_PER_SESSION
      ? "그룹은 세션당 최대 4개까지 만들 수 있습니다."
      : largestAvailableGroupSize < 2
        ? "겹치지 않게 묶을 수 있는 연속 운동이 2개 이상 필요합니다."
        : undefined;

  const scrollAddRowToTop = () => {
    const scheduleNext = (fn) => {
      if (typeof requestAnimationFrame === "function") requestAnimationFrame(fn);
      else setTimeout(fn, 16);
    };

    const tryScroll = (triesLeft) => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const addRow = container.querySelector(".routine-add-row");
      if (!addRow) {
        if (triesLeft > 0) {
          scheduleNext(() => tryScroll(triesLeft - 1));
        }
        return;
      }

      // If the panel doesn't have enough content to create scroll range,
      // create temporary space at the bottom so the add-row can be aligned to the top.
      const spacer = container.querySelector(".routine-add-row-spacer");
      if (spacer) {
        const containerHeight = container.clientHeight || 0;
        const rowHeight = addRow.getBoundingClientRect().height || addRow.offsetHeight || 0;
        const needed = Math.max(0, containerHeight - rowHeight - 8);
        const current = parseFloat(spacer.style.height || "0") || 0;
        if (Math.abs(current - needed) >= 1) {
          spacer.style.height = `${needed}px`;
        }
      }

      // 1) Prefer standards-based alignment to the top of the scroll container.
      // This scrolls the nearest scrollable ancestor (the container), not the whole page.
      addRow.scrollIntoView({ block: "start", behavior: "smooth" });

      // 2) Some layouts/positioning can make `scrollIntoView` land "near" the top.
      // Normalize so the add-row's top edge matches the container's top edge.
      const containerRect = container.getBoundingClientRect();
      const rowRect = addRow.getBoundingClientRect();
      const delta = rowRect.top - containerRect.top;
      if (Math.abs(delta) >= 2) {
        container.scrollTo({ top: container.scrollTop + delta, behavior: "smooth" });
      }
    };

    // Wait for the row to mount and layout to settle.
    setTimeout(() => tryScroll(6), 0);
  };

  return (
    <div
      className="glass-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 20px 10px",
          fontSize: "11px",
          fontWeight: "600",
          letterSpacing: "0.05em",
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span>
          {session ? (
            isTemporary ? (
              <>
                <span className="routine-session-temp-badge">임시</span>
                <span style={{ margin: "0 6px", opacity: 0.5 }}>:</span>
                <span>{session.name}</span>
              </>
            ) : (
              <>
                <span style={{ color: "var(--accent)", fontWeight: "700" }}>
                  Day {dayLetter}
                </span>
                <span style={{ margin: "0 6px", opacity: 0.5 }}>:</span>
                <span>{session.name}</span>
              </>
            )
          ) : (
            "운동"
          )}
        </span>
      </div>

      <div
        ref={scrollContainerRef}
        className="exercise-scroll-container"
        style={{ flex: 1, overflowY: "auto", padding: "8px 8px 16px" }}
      >
        {!session ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "13px",
              opacity: 0.5,
            }}
          >
            세션을 선택하세요
          </div>
        ) : (
          <>
            {sessionExercises.length === 0 ? null : (
              <LayoutGroup id={`session-exercises-${session.id}`}>
                <div
                  className={`routine-exercise-grid ${hasGroups ? "routine-exercise-grid--with-groups" : ""}`}
                  style={{
                    gridTemplateRows: `repeat(${sessionExercises.length}, minmax(58px, auto))`,
                  }}
                >
                  {sessionExercises.map((sessionExercise, index) => {
                    const exercise = exercises.find(
                      (item) => item.id === sessionExercise.exercise_id,
                    );
                    if (!exercise) return null;

                    const isSelected =
                      sessionExercise.id === selectedExerciseId;
                    return (
                      <div
                        key={sessionExercise.id}
                        className="routine-exercise-row-slot"
                        style={{ gridRow: index + 1 }}
                      >
                        <ExerciseRow
                          refCallback={(element) =>
                            onExerciseRef(sessionExercise.id, element)
                          }
                          sessionExercise={sessionExercise}
                          exercise={exercise}
                          index={index}
                          isSelected={isSelected}
                          isHighlighted={isSelected && isPanelFocused}
                          onKeyDown={onExerciseKeyDown}
                          onFocus={onPanelFocus}
                          onSelect={onSelectExercise}
                          onDelete={onDeleteExercise}
                          isReadOnly={isReadOnly}
                        />
                      </div>
                    );
                  })}

                  {hasGroups &&
                    exerciseGroups.map((group, index) => {
                      const isSelected = group.id === selectedExerciseGroupId;
                      return (
                        <ExerciseGroupBracket
                          key={group.id}
                          refCallback={(element) =>
                            onExerciseGroupRef(group.id, element)
                          }
                          group={group}
                          index={index}
                          exerciseCount={sessionExercises.length}
                          isSelected={isSelected}
                          isHighlighted={isSelected && isGroupPanelFocused}
                          onKeyDown={onExerciseGroupKeyDown}
                          onFocus={onGroupPanelFocus}
                          onSelect={onSelectExerciseGroup}
                        />
                      );
                    })}
                </div>
              </LayoutGroup>
            )}

            {sessionExercises.length === 0 && !isAddingExerciseRow && (
              <div
                style={{
                  padding: "30px 20px 20px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "13px",
                  opacity: 0.5,
                }}
              >
                <ListPlus
                  size={24}
                  style={{
                    marginBottom: "6px",
                    display: "block",
                    margin: "0 auto 6px",
                  }}
                />
                등록된 운동이 없습니다
              </div>
            )}

            {isAddingExerciseRow && (
              <>
                <AddExerciseRow
                  index={sessionExercises.length}
                  onAddExercise={(exercise) => {
                    onAddExercise(exercise);
                    onCancelAddingExercise(false);
                  }}
                  onCancel={() => onCancelAddingExercise(true)}
                />
                <div
                  className="routine-add-row-spacer"
                  aria-hidden="true"
                  style={{ height: 0 }}
                />
              </>
            )}

            {!isAddingExerciseRow && !isReadOnly && (
              <>
                <RoutineAddButton
                  ref={addExerciseBtnRef}
                  label="운동 추가"
                  onFocus={() => {
                    onPanelFocus();
                    onSelectExercise(null);
                    onSelectExerciseGroup(null);
                  }}
                  onClick={() => {
                    onStartAddingExercise();
                    scrollAddRowToTop();
                  }}
                  onKeyDown={onAddExerciseButtonKeyDown}
                />

                {!isAddingExerciseGroupRow && (
                  <RoutineAddButton
                    ref={addGroupBtnRef}
                    label="그룹 추가"
                    disabled={!canAddExerciseGroup}
                    title={groupAddDisabledReason}
                    onFocus={() => {
                      onGroupAddButtonFocus();
                    }}
                    onClick={() => {
                      onStartAddingExerciseGroup();
                    }}
                    onKeyDown={onAddGroupButtonKeyDown}
                  />
                )}

                {isAddingExerciseGroupRow && (
                  <AddExerciseGroupRow
                    exerciseCount={largestAvailableGroupSize}
                    groupCount={exerciseGroups.length}
                    onAddGroup={(groupDraft) => {
                      if (onAddExerciseGroup(groupDraft)) {
                        onCancelAddingExerciseGroup(false);
                      }
                    }}
                    onCancel={() => onCancelAddingExerciseGroup(true)}
                  />
                )}

                {exerciseGroups.length > 0 && (
                  <div className="routine-group-row-list">
                    {exerciseGroups.map((group, index) => {
                      const isSelected = group.id === selectedExerciseGroupId;
                      return (
                        <ExerciseGroupRow
                          key={group.id}
                          refCallback={(element) =>
                            onExerciseGroupRowRef(group.id, element)
                          }
                          group={group}
                          index={index}
                          exerciseCount={sessionExercises.length}
                          isSelected={isSelected}
                          isHighlighted={isSelected && isGroupPanelFocused}
                          onKeyDown={onExerciseGroupKeyDown}
                          onFocus={onGroupRowFocus}
                          onSelect={onSelectExerciseGroup}
                          onDelete={onDeleteExerciseGroup}
                          isReadOnly={isReadOnly}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
