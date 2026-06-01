import React, { useRef, useImperativeHandle, forwardRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, ChevronDown, Check } from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useGridNavigation, COLUMNS, resolveBlockJumpTarget } from '../hooks/useGridNavigation';
import { useWorkoutDraft } from '../hooks/useWorkoutDraft';
import { getFormattedSessionName, isTemporarySession } from '../utils/sessionHelper';
import { isBodyweightEquipment } from '../utils/logFormatters';
import { scrollElementWithinContainer } from '../utils/focusUtils';

// ─── SetRow ───────────────────────────────────────────────────────────────────

const NAVIGATION_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Shift',
  'Home', 'End', 'Escape',
]);

function SetRow({
  row,
  getCellRef,
  handleKeyDown,
  updateRow,
  onExerciseFocus,
  onSetFocus,
  onCellFocus,
  onRepsTab,
  onFirstWeightTab,
  isScrolling,
  weightDisabled,
  onScrollCellIntoView,
}) {
  const { globalIndex, blockIndex, rowIndex, set_number, exerciseId, side } = row;

  return (
    <tr>
      <td className="cell-set">
        {set_number}
        {side && side !== 'both' && (
          <span className={`side-badge side-badge--${side.toLowerCase()}`}>
            {side}
          </span>
        )}
      </td>

      {COLUMNS.map(({ colIndex, field }) => {
        const isWeightCell = field === 'weight';
        const isDisabledWeight = isWeightCell && weightDisabled;

        return (
          <td
            key={field}
            className={`cell-input${isDisabledWeight ? ' cell-input--weight-disabled' : ''}`}
          >
            <input
              ref={getCellRef(globalIndex, colIndex)}
              type="text"
              inputMode="decimal"
              value={row[field]}
              readOnly={isDisabledWeight}
              tabIndex={isDisabledWeight ? -1 : undefined}
              aria-disabled={isDisabledWeight || undefined}
              onChange={(e) => {
                if (isDisabledWeight) return;
                updateRow(blockIndex, rowIndex, field, e.target.value);
              }}
              maxLength={10}
              onKeyDown={(e) => {
                if (
                  isScrolling &&
                  ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) &&
                  !e.metaKey &&
                  !e.ctrlKey
                ) {
                  e.preventDefault();
                  return;
                }

                if (isDisabledWeight && !NAVIGATION_KEYS.has(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
                  e.preventDefault();
                  return;
                }

                if (field === 'weight' && e.key === 'Tab' && !e.shiftKey && !isDisabledWeight) {
                  onFirstWeightTab?.(row, e.currentTarget.value);
                }

                if (field === 'reps' && e.key === 'Tab' && !e.shiftKey) {
                  onRepsTab?.(row, e.currentTarget.value);
                }

                handleKeyDown(e, globalIndex, colIndex);
              }}
              onFocus={(e) => {
                onCellFocus?.(globalIndex, colIndex);
                onExerciseFocus?.(exerciseId);
                onSetFocus?.(blockIndex, rowIndex);
                onScrollCellIntoView?.(e.currentTarget);
              }}
              placeholder="—"
            />
          </td>
        );
      })}
    </tr>
  );
}

// ─── WorkoutGrid ──────────────────────────────────────────────────────────────

const WorkoutGrid = forwardRef(function WorkoutGrid({ session, latestRoutineSessions = [], onSessionChange, onExerciseFocus, onRestStart, onSaveSuccess }, ref) {
  const sessions              = useWorkoutStore((state) => state.sessions);
  const sessionExercises      = useWorkoutStore((state) => state.sessionExercises);
  const sessionExerciseGroups = useWorkoutStore((state) => state.sessionExerciseGroups);
  const exercises             = useWorkoutStore((state) => state.exercises);
  const saveWorkoutLog        = useWorkoutStore((state) => state.saveWorkoutLog);

  const {
    blocks,
    focusedSet,
    currentMemo,
    flatRows,
    totalRows,
    canSaveWorkout,
    updateRow,
    updateMemo,
    handleSetFocus,
    handleFirstWeightTab,
    handleRepsTab,
    addRow,
    saveWorkout,
  } = useWorkoutDraft({
    session,
    sessionExercises,
    exercises,
    sessionExerciseGroups,
    saveWorkoutLog,
    onRestStart,
    onSaveSuccess,
  });

  const exerciseById = useMemo(
    () => new Map(exercises.map((exercise) => [exercise.id, exercise])),
    [exercises],
  );

  const isWeightDisabledForRow = useCallback((globalIndex) => {
    const row = flatRows[globalIndex];
    if (!row?.exerciseId) return false;
    return isBodyweightEquipment(exerciseById.get(row.exerciseId));
  }, [exerciseById, flatRows]);

  const shouldSkipCellForTab = useCallback(
    (rowIndex, colIndex) => colIndex === 0 && isWeightDisabledForRow(rowIndex),
    [isWeightDisabledForRow],
  );

  const scrollContainerRef = useRef(null);

  const blockRowRangeByGlobalIndex = useMemo(() => {
    const ranges = [];
    let start = 0;

    for (let i = 0; i < flatRows.length; i += 1) {
      const isBlockEnd =
        i === flatRows.length - 1 ||
        flatRows[i + 1].blockIndex !== flatRows[i].blockIndex;

      if (isBlockEnd) {
        for (let j = start; j <= i; j += 1) {
          ranges[j] = { start, end: i };
        }
        start = i + 1;
      }
    }

    return ranges;
  }, [flatRows]);

  const scrollFocusedCellIntoView = useCallback((element) => {
    scrollElementWithinContainer(element, scrollContainerRef.current, { padding: 12 });
  }, []);

  const resolveBlockJump = useCallback(
    (rowIndex, colIndex, direction) => {
      const range = blockRowRangeByGlobalIndex[rowIndex];
      if (!range) return null;
      return resolveBlockJumpTarget(
        rowIndex,
        colIndex,
        direction,
        range,
        shouldSkipCellForTab,
      );
    },
    [blockRowRangeByGlobalIndex, shouldSkipCellForTab],
  );

  const { getCellRef, handleKeyDown, requestFocus, isKeyboardActive, focusLastOrFirst, recordFocus } = useGridNavigation(
    totalRows + 1,
    {
      shouldSkipCellForTab,
      resolveBlockJump,
      onFocusCell: scrollFocusedCellIntoView,
    },
  );

  const requestFocusForRow = useCallback((globalIndex) => {
    requestFocus(globalIndex, isWeightDisabledForRow(globalIndex) ? 1 : 0);
  }, [isWeightDisabledForRow, requestFocus]);

  const exerciseHeaderRefs = useRef(new Map());
  const lastScrolledBlockIndexRef = useRef(-1);
  const noteRef = useRef(null);

  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);
  const regularSessionOptions = latestRoutineSessions.filter((item) => !isTemporarySession(item));
  const temporarySessionOption = latestRoutineSessions.find((item) => isTemporarySession(item));

  const renderSessionOptions = () => (
    <>
      {regularSessionOptions.length > 0 && (
        <optgroup label="정규 세션">
          {regularSessionOptions.map(s => (
            <option key={s.id} value={s.id} className="session-inline-option">
              {getFormattedSessionName(s, sessions)}
            </option>
          ))}
        </optgroup>
      )}
      {temporarySessionOption && (
        <optgroup label="임시 세션">
          <option value={temporarySessionOption.id} className="session-inline-option">
            {getFormattedSessionName(temporarySessionOption, sessions)}
          </option>
        </optgroup>
      )}
    </>
  );

  // 포커스된 운동 종목(blockIndex)이 변경될 때 해당 종목 헤더로 부드럽게 스크롤 보정
  useEffect(() => {
    const blockIndex = focusedSet.blockIndex;
    if (blockIndex === undefined || blockIndex === null) return;

    if (blockIndex !== lastScrolledBlockIndexRef.current) {
      const isFirstScroll = lastScrolledBlockIndexRef.current === -1;
      lastScrolledBlockIndexRef.current = blockIndex;

      const container = scrollContainerRef.current;
      const headerElement = exerciseHeaderRefs.current.get(blockIndex);

      if (container && headerElement) {
        // Calculate static relative top offset of headerElement inside container,
        // completely independent of current scroll position or active scroll animations.
        let headerOffsetTop = 0;
        let curr = headerElement;
        while (curr) {
          headerOffsetTop += curr.offsetTop;
          curr = curr.offsetParent;
        }

        let containerOffsetTop = 0;
        let temp = container;
        while (temp) {
          containerOffsetTop += temp.offsetTop;
          temp = temp.offsetParent;
        }

        const relativeTop = headerOffsetTop - containerOffsetTop;

        // 24px 더 내려서 이전 운동 블록의 경계선(border)을 완벽하게 감추고 헤더 텍스트를 상단에 정렬
        const targetScrollTop = blockIndex === 0 ? 0 : Math.max(0, relativeTop + 24);

        // Lock inputs and key navigation only on actual block transition scrolls (not on initial mount scroll)
        if (!isFirstScroll) {
          setIsScrolling(true);
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
          }
          scrollTimeoutRef.current = setTimeout(() => {
            setIsScrolling(false);
          }, 150);
        }

        container.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth',
        });

        // Header scroll is async; re-check that the focused cell is still visible afterward.
        const revealFocusedCell = () => {
          const active = document.activeElement;
          if (active instanceof HTMLElement && container.contains(active)) {
            scrollElementWithinContainer(active, container, { padding: 12 });
          }
        };

        if (isFirstScroll) {
          requestAnimationFrame(revealFocusedCell);
        } else {
          window.setTimeout(revealFocusedCell, 160);
        }
      }
    }
  }, [focusedSet.blockIndex]);

  // Expose imperative methods to parent (for ` / ₩ key focus toggle)
  useImperativeHandle(ref, () => ({
    focusGrid: () => focusLastOrFirst(),
    focusNote: () => noteRef.current?.focus(),
    isNoteFocused: () => document.activeElement === noteRef.current,
  }), [focusLastOrFirst]);


  // ── render ─────────────────────────────────────────────────────────────────

  if (!session) {
    return (
      <div className="glass-panel--strong workout-grid-container workout-grid-empty-state">
        {/* Header */}
        <div className="workout-grid-header">
          <div className="workout-grid-header-title-row">
            <div className="workout-grid-header-selector-group">
              <h2 className="workout-grid-session-title" style={{ color: 'var(--text-muted)' }}>
                세션 없음
              </h2>
              
              {latestRoutineSessions && latestRoutineSessions.length > 0 && (
                <div className="session-dropdown-wrapper">
                  <select
                    value=""
                    onChange={(e) => onSessionChange?.(e.target.value)}
                    className="session-inline-select"
                  >
                    <option value="" disabled className="session-inline-option">
                      세션 선택...
                    </option>
                    {renderSessionOptions()}
                  </select>
                  <div className="session-dropdown-arrow">
                    <ChevronDown size={13} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Unified fixed handwriting header bar */}
          <div className="workout-grid-header-bar">
            <div className="workout-grid-header-col-set">
              <span className="grid-header-badge">Set</span>
            </div>
            {COLUMNS.map(({ field, header }) => (
              <div key={field} className="workout-grid-header-col-metric">
                <span className="grid-header-badge grid-header-badge--accent">
                  {header}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Empty scroll area placeholder */}
        <div className="workout-grid-scroll-area empty-state-scroll">
          <div className="workout-grid-empty-placeholder">
            <p>세션을 선택해주세요</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel--strong workout-grid-container">
      {/* Header */}
      <div className="workout-grid-header">
        <div className="workout-grid-header-title-row">
          <div className="workout-grid-header-selector-group">
            <h2 className="workout-grid-session-title">
              {getFormattedSessionName(session, sessions)}
            </h2>
            
            {latestRoutineSessions && latestRoutineSessions.length > 0 && (
              <div className="session-dropdown-wrapper">
                <select
                  value={session?.id || ''}
                  onChange={(e) => onSessionChange?.(e.target.value)}
                  className="session-inline-select"
                >
                  {renderSessionOptions()}
                </select>
                <div className="session-dropdown-arrow">
                  <ChevronDown size={13} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Unified fixed handwriting header bar */}
        <div className="workout-grid-header-bar">
          <div className="workout-grid-header-col-set">
            <span className="grid-header-badge">Set</span>
          </div>
          {COLUMNS.map(({ field, header }) => (
            <div key={field} className="workout-grid-header-col-metric">
              <span className="grid-header-badge grid-header-badge--accent">
                {header}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div ref={scrollContainerRef} className="workout-grid-scroll-area">
        <div className="spreadsheet-wrap">
          <table className={`spreadsheet ${isKeyboardActive ? 'keyboard-navigating' : ''}`}>
            <thead>
              <tr style={{ height: 0 }}>
                <th className="col-set" style={{ height: 0, padding: 0, border: 'none' }}></th>
                {COLUMNS.map(({ field }) => (
                  <th key={field} style={{ height: 0, padding: 0, border: 'none' }}></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {blocks.map((block, blockIndex) => {
                const blockRows = flatRows.filter((r) => r.blockIndex === blockIndex);
                const isFirst = blockIndex === 0;

                return (
                  <React.Fragment key={block.id}>
                    {/* Exercise Subheader Row */}
                    <tr
                      ref={(el) => {
                        if (el) {
                          exerciseHeaderRefs.current.set(blockIndex, el);
                        } else {
                          exerciseHeaderRefs.current.delete(blockIndex);
                        }
                      }}
                      className={`workout-grid-table-row-exercise-header ${
                        isFirst
                          ? 'workout-grid-table-row-exercise-header--first'
                          : 'workout-grid-table-row-exercise-header--subsequent'
                      }`}
                      style={block.is_group ? { '--group-color': block.group_color || '#7aa2f7' } : {}}
                    >
                      <td colSpan={3}>
                        {block.is_group ? (
                          <>
                            <span className="workout-grid-group-name-highlight">
                              {block.group_name}
                            </span>
                            <span className="workout-grid-group-exercises-label">
                              {` (${block.group_exercises.map(e => e.name).join(' + ')})`}
                            </span>
                          </>
                        ) : (
                          block.exercise_name
                        )}
                      </td>
                    </tr>

                    {/* Set Rows for this Exercise */}
                    {blockRows.map((row) => (
                      <SetRow
                        key={row.id}
                        row={row}
                        getCellRef={getCellRef}
                        handleKeyDown={handleKeyDown}
                        updateRow={updateRow}
                        onExerciseFocus={onExerciseFocus}
                        onSetFocus={handleSetFocus}
                        onCellFocus={recordFocus}
                        onRepsTab={handleRepsTab}
                        onFirstWeightTab={handleFirstWeightTab}
                        isScrolling={isScrolling}
                        weightDisabled={isWeightDisabledForRow(row.globalIndex)}
                        onScrollCellIntoView={scrollFocusedCellIntoView}
                      />
                    ))}

                    {/* Centered Add Set Button Row */}
                    <tr>
                      <td colSpan={3} className="workout-grid-table-cell-add-row">
                        <button
                          onClick={() => addRow(blockIndex, requestFocusForRow)}
                          className="add-set-row-btn-minimal"
                          type="button"
                          title="세트 추가"
                        >
                          <Plus size={12} className="workout-grid-add-set-icon" />
                          세트 추가
                        </button>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}

              {/* 맨 마지막 행으로 운동 완료 버튼 추가 */}
              <tr className="workout-complete-tr">
                <td colSpan={3} className="workout-complete-td">
                  <button
                    ref={(el) => {
                      getCellRef(totalRows, 0)(el);
                      getCellRef(totalRows, 1)(el);
                    }}
                    onClick={saveWorkout}
                    onFocus={(e) => {
                      recordFocus(totalRows, 0);
                      scrollFocusedCellIntoView(e.currentTarget);
                    }}
                    onKeyDown={(e) => {
                      if (
                        isScrolling &&
                        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) &&
                        !e.metaKey &&
                        !e.ctrlKey
                      ) {
                        e.preventDefault();
                        return;
                      }
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        saveWorkout();
                        return;
                      }
                      handleKeyDown(e, totalRows, 0);
                    }}
                    className="workout-complete-row-btn"
                    disabled={!canSaveWorkout}
                    type="button"
                    title="운동 완료 저장"
                  >
                    <Check size={14} />
                    운동 완료 (Save) ⚡
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Set memo — 현재 포커스된 세트의 메모 */}
      <div className="workout-grid-memo-container">
        <textarea
          ref={noteRef}
          className="note-textarea"
          placeholder="이 세트에 대한 메모..."
          value={currentMemo}
          onChange={(e) => updateMemo(e.target.value)}
          maxLength={1000}
        />
      </div>
    </div>
  );
});

export default WorkoutGrid;
