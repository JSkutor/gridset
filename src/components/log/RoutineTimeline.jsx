import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatDate } from "../../utils/logFormatters";
import { EmptyState } from "./LogSharedComponents";

// ─── Branch SVG Layout Constants ─────────────────────────────

const BRANCH_VIEWBOX_WIDTH = 1000;
const BRANCH_VIEWBOX_HEIGHT = 150;
const BRANCH_START_Y = 12;
const BRANCH_JOINT_Y = 60;
const BRANCH_END_Y = 132;

function getTimelineX(index, count) {
  if (count <= 0) return BRANCH_VIEWBOX_WIDTH / 2;
  return Math.round(((index + 0.5) / count) * BRANCH_VIEWBOX_WIDTH);
}

function getBranchPath(sourceX, targetX) {
  return [
    `M ${sourceX} ${BRANCH_START_Y}`,
    `C ${sourceX} ${BRANCH_JOINT_Y - 30}, ${sourceX} ${BRANCH_JOINT_Y - 10}, ${sourceX} ${BRANCH_JOINT_Y}`,
    `C ${sourceX} ${BRANCH_JOINT_Y + 42}, ${targetX} ${BRANCH_JOINT_Y + 42}, ${targetX} ${BRANCH_END_Y}`,
  ].join(" ");
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

function useBranchSourceTracking(activeCommitRef, branchStageRef) {
  const [branchSourceX, setBranchSourceX] = useState(BRANCH_VIEWBOX_WIDTH / 2);

  const updateBranchSource = useCallback(() => {
    const activeCommit = activeCommitRef.current;
    const branchStage = branchStageRef.current;
    if (!activeCommit || !branchStage) return;

    const activeRect = activeCommit.getBoundingClientRect();
    const stageRect = branchStage.getBoundingClientRect();
    if (!stageRect.width) return;

    const centerX = activeRect.left + activeRect.width / 2 - stageRect.left;
    const clampedX = Math.min(Math.max(centerX, 24), stageRect.width - 24);
    setBranchSourceX(
      Math.round((clampedX / stageRect.width) * BRANCH_VIEWBOX_WIDTH),
    );
  }, [activeCommitRef, branchStageRef]);

  return { branchSourceX, updateBranchSource };
}

function useScrollIntoView(
  selectedEvent,
  latestEventId,
  activeCommitRef,
  updateBranchSource,
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

      secondFrame = window.requestAnimationFrame(updateBranchSource);
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame !== null) window.cancelAnimationFrame(secondFrame);
    };
  }, [latestEventId, selectedEvent, activeCommitRef, updateBranchSource]);
}

function useHorizontalScroll(timelineScrollRef, updateBranchSource) {
  useEffect(() => {
    const scrollNode = timelineScrollRef.current;
    if (!scrollNode) return undefined;

    let frameId = null;
    const scheduleBranchUpdate = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        updateBranchSource();
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
  }, [timelineScrollRef, updateBranchSource]);
}

// ─── Main Component ──────────────────────────────────────────

export default function RoutineTimeline({ routineSummaries }) {
  const [selectedEventId, setSelectedEventId] = useState(null);
  const timelineScrollRef = useRef(null);
  const activeCommitRef = useRef(null);
  const branchStageRef = useRef(null);

  const { branchSourceX, updateBranchSource } = useBranchSourceTracking(
    activeCommitRef,
    branchStageRef,
  );

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

  useScrollIntoView(
    selectedEvent,
    latestEventId,
    activeCommitRef,
    updateBranchSource,
  );
  useHorizontalScroll(timelineScrollRef, updateBranchSource);

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
                className="log-routine-branch-lines"
                viewBox={`0 0 ${BRANCH_VIEWBOX_WIDTH} ${BRANCH_VIEWBOX_HEIGHT}`}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {selectedBranches.map((branch, index) => {
                  const targetX = getTimelineX(index, branchCount);
                  return (
                    <path
                      key={branch.id}
                      className="log-routine-branch-curve"
                      d={getBranchPath(branchSourceX, targetX)}
                      style={{ "--session-color": branch.color }}
                    />
                  );
                })}
                <circle
                  className="log-routine-branch-origin"
                  cx={branchSourceX}
                  cy={BRANCH_START_Y}
                  r="5.5"
                />
                {selectedBranches.map((branch, index) => (
                  <circle
                    key={`${branch.id}-end`}
                    className="log-routine-branch-end"
                    cx={getTimelineX(index, branchCount)}
                    cy={BRANCH_END_Y}
                    r="4.5"
                    style={{ "--session-color": branch.color }}
                  />
                ))}
              </svg>

              <div className="log-routine-branch-map">
                {selectedBranches.map((branch) => (
                  <article
                    key={branch.id}
                    className={`log-routine-branch-card ${branch.type === "free" ? "log-routine-branch-card--free" : ""} ${branch.type === "empty" ? "is-muted" : ""}`}
                    style={{ "--session-color": branch.color }}
                  >
                    <span
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
