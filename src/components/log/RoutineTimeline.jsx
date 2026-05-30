import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatDate } from "../../utils/logFormatters";
import { EmptyState } from "./LogSharedComponents";

// ─── Branch SVG Layout Constants ─────────────────────────────

const BRANCH_VIEWBOX_WIDTH = 1000;
const BRANCH_VIEWBOX_HEIGHT = 150;
const BRANCH_LAYOUT_FALLBACK = {
  sourceX: BRANCH_VIEWBOX_WIDTH / 2,
  sourceY: 12,
  targets: [{ x: BRANCH_VIEWBOX_WIDTH / 2, y: 138 }],
};

function clampBranchX(x) {
  const edge = 24;
  return Math.min(Math.max(Math.round(x), edge), BRANCH_VIEWBOX_WIDTH - edge);
}

function clampBranchY(y) {
  return Math.min(Math.max(Math.round(y), 4), BRANCH_VIEWBOX_HEIGHT - 4);
}

function getBranchPath(sourceX, sourceY, targetX, targetY) {
  const jointY = sourceY + (targetY - sourceY) * 0.4;
  const spreadY = sourceY + (targetY - sourceY) * 0.74;
  return [
    `M ${sourceX} ${sourceY}`,
    `C ${sourceX} ${sourceY + 16}, ${sourceX} ${jointY - 10}, ${sourceX} ${jointY}`,
    `C ${sourceX} ${spreadY}, ${targetX} ${spreadY}, ${targetX} ${targetY}`,
  ].join(" ");
}

function mapPointToViewBox(pointRect, stageRect, svgRect) {
  const x =
    ((pointRect.left + pointRect.width / 2 - stageRect.left) / stageRect.width) *
    BRANCH_VIEWBOX_WIDTH;
  const y =
    ((pointRect.top + pointRect.height / 2 - svgRect.top) / svgRect.height) *
    BRANCH_VIEWBOX_HEIGHT;
  return { x: clampBranchX(x), y: clampBranchY(y) };
}

function branchLayoutsEqual(previous, next) {
  if (
    previous.sourceX !== next.sourceX ||
    previous.sourceY !== next.sourceY ||
    previous.targets.length !== next.targets.length
  ) {
    return false;
  }

  return previous.targets.every(
    (target, index) =>
      target.x === next.targets[index].x && target.y === next.targets[index].y,
  );
}

// ─── Branch Card Data Builder ────────────────────────────────

function buildBranches(selectedEvent, selectedSessions) {
  if (selectedSessions.length > 0) {
    return selectedSessions.map((session) => ({
      id: session.id,
      title: session.name,
      detail: session.lastDate
        ? `${formatDate(session.lastDate, { month: "short", day: "numeric" })} 최근`
        : "수행 기록 없음",
      meta: `${session.logCount}회 · ${session.exercises.length}종목`,
      exercises: session.exercises,
      color: session.color,
      type: "session",
    }));
  }

  if (selectedEvent) {
    return [
      {
        id: `${selectedEvent.id}-empty-session`,
        title: "세션 없음",
        detail: "루틴 구성 필요",
        meta: "0종목",
        exercises: [],
        color: "#6B7394",
        type: "empty",
      },
    ];
  }

  return [];
}

// ─── Scroll & Branch Source Tracking Hooks ────────────────────

function useBranchLayout(
  activeCommitRef,
  branchStageRef,
  branchLinesRef,
  pinRefs,
  branchCount,
) {
  const [branchLayout, setBranchLayout] = useState(BRANCH_LAYOUT_FALLBACK);

  const updateBranchLayout = useCallback(() => {
    const branchStage = branchStageRef.current;
    const branchLines = branchLinesRef.current;
    if (!branchStage || !branchLines) return;

    const stageRect = branchStage.getBoundingClientRect();
    const svgRect = branchLines.getBoundingClientRect();
    if (!stageRect.width || !svgRect.height) return;

    const activeCommit = activeCommitRef.current;
    const sourceAnchor =
      activeCommit?.querySelector(".log-routine-commit-dot") ?? activeCommit;
    const sourcePoint = sourceAnchor
      ? mapPointToViewBox(
          sourceAnchor.getBoundingClientRect(),
          stageRect,
          svgRect,
        )
      : {
          x: BRANCH_LAYOUT_FALLBACK.sourceX,
          y: BRANCH_LAYOUT_FALLBACK.sourceY,
        };

    const targets = pinRefs.current
      .slice(0, branchCount)
      .filter(Boolean)
      .map((pin) =>
        mapPointToViewBox(pin.getBoundingClientRect(), stageRect, svgRect),
      );

    const nextLayout = {
      sourceX: sourcePoint.x,
      sourceY: sourcePoint.y,
      targets:
        targets.length > 0 ? targets : BRANCH_LAYOUT_FALLBACK.targets,
    };

    setBranchLayout((previous) =>
      branchLayoutsEqual(previous, nextLayout) ? previous : nextLayout,
    );
  }, [activeCommitRef, branchLinesRef, branchStageRef, pinRefs, branchCount]);

  return { branchLayout, updateBranchLayout };
}

function useScrollIntoView(
  selectedEvent,
  latestEventId,
  activeCommitRef,
  updateBranchLayout,
) {
  useEffect(() => {
    if (!selectedEvent) return undefined;

    let secondFrame = null;
    const firstFrame = window.requestAnimationFrame(() => {
      activeCommitRef.current?.scrollIntoView({
        block: "nearest",
        inline: selectedEvent.id === latestEventId ? "end" : "center",
        behavior: "auto",
      });

      secondFrame = window.requestAnimationFrame(updateBranchLayout);
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame !== null) window.cancelAnimationFrame(secondFrame);
    };
  }, [latestEventId, selectedEvent, activeCommitRef, updateBranchLayout]);
}

function useHorizontalScroll(timelineScrollRef, updateBranchLayout) {
  useEffect(() => {
    const scrollNode = timelineScrollRef.current;
    if (!scrollNode) return undefined;

    let frameId = null;
    const scheduleBranchUpdate = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        updateBranchLayout();
      });
    };

    const handleWheel = (event) => {
      if (scrollNode.scrollWidth <= scrollNode.clientWidth) return;

      const delta =
        Math.abs(event.deltaY) >= Math.abs(event.deltaX)
          ? event.deltaY
          : event.deltaX;
      if (delta === 0) return;

      event.preventDefault();
      scrollNode.scrollLeft += delta;
      scheduleBranchUpdate();
    };

    scrollNode.addEventListener("wheel", handleWheel, { passive: false });
    scrollNode.addEventListener("scroll", scheduleBranchUpdate, {
      passive: true,
    });
    window.addEventListener("resize", scheduleBranchUpdate);

    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      scrollNode.removeEventListener("wheel", handleWheel);
      scrollNode.removeEventListener("scroll", scheduleBranchUpdate);
      window.removeEventListener("resize", scheduleBranchUpdate);
    };
  }, [timelineScrollRef, updateBranchLayout]);
}

function useBranchLayoutSync(branchStageRef, updateBranchLayout, syncKey) {
  useEffect(() => {
    let frameId = window.requestAnimationFrame(updateBranchLayout);
    const branchStage = branchStageRef.current;
    if (!branchStage) {
      return () => window.cancelAnimationFrame(frameId);
    }

    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateBranchLayout);
    });
    observer.observe(branchStage);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [branchStageRef, updateBranchLayout, syncKey]);
}

// ─── Main Component ──────────────────────────────────────────

export default function RoutineTimeline({ routineSummaries }) {
  const [selectedEventId, setSelectedEventId] = useState(null);
  const timelineScrollRef = useRef(null);
  const activeCommitRef = useRef(null);
  const branchStageRef = useRef(null);
  const branchLinesRef = useRef(null);
  const pinRefs = useRef([]);

  const setPinRef = useCallback((index) => {
    return (node) => {
      pinRefs.current[index] = node;
    };
  }, []);

  const timelineEvents = useMemo(() => {
    return routineSummaries
      .map((routine) => {
        const uniqueExercises = new Map();
        routine.sessions.forEach((session) => {
          session.exercises.forEach((exercise) =>
            uniqueExercises.set(exercise.id, exercise),
          );
        });

        return {
          ...routine,
          type: "routine",
          title: routine.name,
          exercises: [...uniqueExercises.values()].sort((a, b) =>
            a.name.localeCompare(b.name, "ko"),
          ),
        };
      })
      .sort((a, b) => {
        const dateA = a.firstDate?.getTime() || 0;
        const dateB = b.firstDate?.getTime() || 0;
        return dateA - dateB;
      });
  }, [routineSummaries]);

  const latestEventId = timelineEvents[timelineEvents.length - 1]?.id || null;
  const selectedEvent =
    timelineEvents.find((event) => event.id === selectedEventId) ||
    timelineEvents[timelineEvents.length - 1] ||
    null;
  const selectedSessions =
    selectedEvent?.type === "routine" ? selectedEvent.sessions : [];
  const selectedBranches = buildBranches(selectedEvent, selectedSessions);
  const branchCount = Math.max(1, selectedBranches.length);

  const { branchLayout, updateBranchLayout } = useBranchLayout(
    activeCommitRef,
    branchStageRef,
    branchLinesRef,
    pinRefs,
    branchCount,
  );

  useScrollIntoView(
    selectedEvent,
    latestEventId,
    activeCommitRef,
    updateBranchLayout,
  );
  useHorizontalScroll(timelineScrollRef, updateBranchLayout);
  const branchLayoutKey = `${selectedEvent?.id ?? "none"}:${branchCount}:${selectedBranches.map((branch) => branch.id).join("|")}`;
  useBranchLayoutSync(branchStageRef, updateBranchLayout, branchLayoutKey);

  return (
    <section className="log-panel log-routine-panel">
      <div className="log-panel-header">
        <div>
          <span className="log-kicker">Routine Graph</span>
          <h2>루틴</h2>
        </div>
        {timelineEvents.length > 0 && (
          <span className="log-subtle-chip">{timelineEvents.length} 시점</span>
        )}
      </div>

      {timelineEvents.length === 0 ? (
        <div className="log-routine-workspace">
          <EmptyState
            title="루틴 로그가 없습니다"
            body="루틴을 만들고 운동을 기록하면 시작 시점과 구성 운동이 정리됩니다."
          />
        </div>
      ) : (
        <div
          className="log-routine-graph-shell"
          style={{
            "--commit-count": timelineEvents.length,
            "--branch-count": branchCount,
            "--stage-columns": timelineEvents.length,
          }}
        >
          {/* ── Commit Track (horizontal scrollable) ── */}
          <div className="log-routine-graph-scroll" ref={timelineScrollRef}>
            <div className="log-routine-stage">
              <div
                className="log-routine-track"
                role="tablist"
                aria-label="루틴 변경 지점"
              >
                <div className="log-routine-track-line" />
                {timelineEvents.map((event) => {
                  const isActive = event.id === selectedEvent?.id;
                  const firstDateLabel = event.firstDate
                    ? formatDate(event.firstDate, {
                        month: "short",
                        day: "numeric",
                      })
                    : "기록 전";

                  return (
                    <button
                      key={event.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`log-routine-commit ${isActive ? "is-active" : ""} ${event.type === "free" ? "is-muted" : ""}`}
                      style={{
                        "--event-color":
                          event.type === "free" ? "#9AA4BC" : "#7AA2F7",
                      }}
                      ref={isActive ? activeCommitRef : null}
                      onClick={() => setSelectedEventId(event.id)}
                    >
                      <span className="log-routine-commit-label">
                        <strong>{event.title}</strong>
                        <i>{firstDateLabel}</i>
                      </span>
                      <span className="log-routine-commit-dot" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Branch SVG + Session Cards ── */}
          {selectedEvent && (
            <div className="log-routine-branch-stage" ref={branchStageRef}>
              <svg
                ref={branchLinesRef}
                className="log-routine-branch-lines"
                viewBox={`0 0 ${BRANCH_VIEWBOX_WIDTH} ${BRANCH_VIEWBOX_HEIGHT}`}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {selectedBranches.map((branch, index) => {
                  const target = branchLayout.targets[index];
                  if (!target) return null;
                  return (
                    <path
                      key={branch.id}
                      className="log-routine-branch-curve"
                      d={getBranchPath(
                        branchLayout.sourceX,
                        branchLayout.sourceY,
                        target.x,
                        target.y,
                      )}
                      style={{ "--session-color": branch.color }}
                    />
                  );
                })}
                <circle
                  className="log-routine-branch-origin"
                  cx={branchLayout.sourceX}
                  cy={branchLayout.sourceY}
                  r="5.5"
                />
                {selectedBranches.map((branch, index) => {
                  const target = branchLayout.targets[index];
                  if (!target) return null;
                  return (
                    <circle
                      key={`${branch.id}-end`}
                      className="log-routine-branch-end"
                      cx={target.x}
                      cy={target.y}
                      r="4.5"
                      style={{ "--session-color": branch.color }}
                    />
                  );
                })}
              </svg>

              <div className="log-routine-branch-map">
                {selectedBranches.map((branch, index) => (
                  <article
                    key={branch.id}
                    className={`log-routine-branch-card ${branch.type === "free" ? "log-routine-branch-card--free" : ""} ${branch.type === "empty" ? "is-muted" : ""}`}
                    style={{ "--session-color": branch.color }}
                  >
                    <span
                      ref={setPinRef(index)}
                      className="log-routine-branch-pin"
                      aria-hidden="true"
                    />
                    <div className="log-routine-branch-head">
                      <div>
                        <strong>{branch.title}</strong>
                        <span>{branch.detail}</span>
                      </div>
                      <b>{branch.meta}</b>
                    </div>
                    <ul className="log-routine-exercise-list">
                      {branch.exercises.length === 0 ? (
                        <li className="is-muted">운동 없음</li>
                      ) : (
                        branch.exercises.map((exercise) => (
                          <li key={exercise.id}>{exercise.name}</li>
                        ))
                      )}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
