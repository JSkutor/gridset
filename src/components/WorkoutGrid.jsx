import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Plus, ChevronDown, Check } from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useGridNavigation, COLUMNS } from '../hooks/useGridNavigation';
import { useWorkoutDraft } from '../hooks/useWorkoutDraft';
import { getFormattedSessionName } from '../utils/sessionHelper';

// ─── SetRow ───────────────────────────────────────────────────────────────────

function SetRow({ row, getCellRef, handleKeyDown, updateRow, addRow, onExerciseFocus, onSetFocus, onCellFocus, onRepsTab, onFirstWeightTab }) {
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

      {COLUMNS.map(({ colIndex, field }) => (
        <td key={field} className="cell-input">
          <input
            ref={getCellRef(globalIndex, colIndex)}
            type="text"
            inputMode="decimal"
            value={row[field]}
            onChange={(e) => updateRow(blockIndex, rowIndex, field, e.target.value)}
            onKeyDown={(e) => {
              if (field === 'weight' && e.key === 'Tab' && !e.shiftKey) {
                onFirstWeightTab?.(row, e.currentTarget.value);
              }

              if (field === 'reps' && e.key === 'Tab' && !e.shiftKey) {
                onRepsTab?.(row, e.currentTarget.value);
              }

              handleKeyDown(e, globalIndex, colIndex, {
                onTabAtEnd: () => addRow(blockIndex),
              });
            }}
            onFocus={() => {
              onCellFocus?.(globalIndex, colIndex);
              onExerciseFocus?.(exerciseId);
              onSetFocus?.(blockIndex, rowIndex);
            }}
            placeholder="—"
          />
        </td>
      ))}
    </tr>
  );
}

// ─── WorkoutGrid ──────────────────────────────────────────────────────────────

const WorkoutGrid = forwardRef(function WorkoutGrid({ session, latestRoutineSessions = [], onSessionChange, onExerciseFocus, onRestStart, onSaveSuccess }, ref) {
  const sessions         = useWorkoutStore((state) => state.sessions);
  const sessionExercises = useWorkoutStore((state) => state.sessionExercises);
  const exercises        = useWorkoutStore((state) => state.exercises);
  const saveWorkoutLog   = useWorkoutStore((state) => state.saveWorkoutLog);

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
    saveWorkoutLog,
    onRestStart,
    onSaveSuccess,
  });

  const { getCellRef, handleKeyDown, requestFocus, isKeyboardActive, focusLastOrFirst, recordFocus } = useGridNavigation(totalRows + 1);

  const scrollContainerRef = useRef(null);
  const exerciseHeaderRefs = useRef(new Map());
  const lastScrolledBlockIndexRef = useRef(-1);
  const noteRef = useRef(null);

  // 포커스된 운동 종목(blockIndex)이 변경될 때 해당 종목 헤더로 부드럽게 스크롤 보정
  useEffect(() => {
    const blockIndex = focusedSet.blockIndex;
    if (blockIndex === undefined || blockIndex === null) return;

    if (blockIndex !== lastScrolledBlockIndexRef.current) {
      lastScrolledBlockIndexRef.current = blockIndex;

      const container = scrollContainerRef.current;
      const headerElement = exerciseHeaderRefs.current.get(blockIndex);

      if (container && headerElement) {
        const containerRect = container.getBoundingClientRect();
        const headerRect = headerElement.getBoundingClientRect();
        const relativeTop = headerRect.top - containerRect.top + container.scrollTop;

        // 24px 더 내려서 이전 운동 블록의 경계선(border)을 완벽하게 감추고 헤더 텍스트를 상단에 정렬
        const targetScrollTop = blockIndex === 0 ? 0 : Math.max(0, relativeTop + 24);

        container.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth',
        });
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
                    {latestRoutineSessions.map(s => {
                      const dayLetter = String.fromCharCode(65 + (latestRoutineSessions.indexOf(s) % 26));
                      return (
                        <option key={s.id} value={s.id} className="session-inline-option">
                          Day {dayLetter} : {s.name}
                        </option>
                      );
                    })}
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
                  {latestRoutineSessions.map(s => {
                    const dayLetter = String.fromCharCode(65 + (latestRoutineSessions.indexOf(s) % 26));
                    return (
                      <option key={s.id} value={s.id} className="session-inline-option">
                        Day {dayLetter} : {s.name}
                      </option>
                    );
                  })}
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
                    >
                      <td colSpan={3}>
                        {block.exercise_name}
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
                        addRow={(targetBlockIndex) => addRow(targetBlockIndex, requestFocus)}
                        onExerciseFocus={onExerciseFocus}
                        onSetFocus={handleSetFocus}
                        onCellFocus={recordFocus}
                        onRepsTab={handleRepsTab}
                        onFirstWeightTab={handleFirstWeightTab}
                      />
                    ))}

                    {/* Centered Add Set Button Row */}
                    <tr>
                      <td colSpan={3} className="workout-grid-table-cell-add-row">
                        <button
                          onClick={() => addRow(blockIndex, requestFocus)}
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
                    onKeyDown={(e) => {
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
        />
      </div>
    </div>
  );
});

export default WorkoutGrid;
