import React, { useState, useMemo, useRef, useCallback, useImperativeHandle, forwardRef, useEffect } from 'react';
import { Plus, ChevronDown, Check } from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useGridNavigation, COLUMNS } from '../hooks/useGridNavigation';
import { getFormattedSessionName } from '../utils/sessionHelper';
import {
  buildInitialBlocks,
  computeNewGlobalIndex,
  fillExerciseWeightsFromFirstSet,
  flattenBlocks,
  getRestTimerPayloadForCompletedSet,
  getSetCompletionKey,
  isCompletedRepsValue,
  isNumericGridValue,
} from '../utils/setGridModel.js';

// ─── SetRow ───────────────────────────────────────────────────────────────────

function SetRow({ row, getCellRef, handleKeyDown, updateRow, addRow, onExerciseFocus, onSetFocus, onRepsTab, onFirstWeightTab }) {
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

// ─── SetGrid ──────────────────────────────────────────────────────────────────

const SetGrid = forwardRef(function SetGrid({ session, latestRoutineSessions = [], onSessionChange, onExerciseFocus, onRestStart, onSaveSuccess }, ref) {
  const sessions         = useWorkoutStore((state) => state.sessions);
  const sessionExercises = useWorkoutStore((state) => state.sessionExercises);
  const exercises        = useWorkoutStore((state) => state.exercises);
  const saveWorkoutLog   = useWorkoutStore((state) => state.saveWorkoutLog);

  const [startTime]      = useState(() => new Date().toISOString());
  const [blocks, setBlocks] = useState(() => buildInitialBlocks(session, sessionExercises, exercises));

  // 현재 포커스된 세트 위치 (blockIndex, rowIndex)
  const [focusedSet, setFocusedSet] = useState({ blockIndex: 0, rowIndex: 0 });

  const scrollContainerRef = useRef(null);
  const exerciseHeaderRefs = useRef(new Map());
  const lastScrolledBlockIndexRef = useRef(-1);

  // 현재 포커스된 세트의 memo를 파생해서 읽음
  const currentMemo = blocks[focusedSet.blockIndex]?.sets[focusedSet.rowIndex]?.memo ?? '';

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

  // Flat row list — drives both the table render and totalRows for the hook.
  const flatRows  = useMemo(() => flattenBlocks(blocks), [blocks]);
  const totalRows = flatRows.length;

  const { getCellRef, handleKeyDown, requestFocus, isKeyboardActive, focusLastOrFirst } = useGridNavigation(totalRows + 1);

  // Ref for the session note textarea (for C-key toggle)
  const noteRef = useRef(null);
  const completedSetSignaturesRef = useRef(new Map());

  // ── mutations ──────────────────────────────────────────────────────────────

  const updateRow = (blockIndex, rowIndex, field, value) => {
    if (!isNumericGridValue(value)) return;

    if (field === 'reps' && !isCompletedRepsValue(value)) {
      const block = blocks[blockIndex];
      const set = block?.sets?.[rowIndex];
      const completionKey = getSetCompletionKey(block, set);
      if (completionKey) completedSetSignaturesRef.current.delete(completionKey);
    }

    setBlocks((prev) =>
      prev.map((b, bi) =>
        bi !== blockIndex ? b : {
          ...b,
          sets: b.sets.map((s, si) =>
            si !== rowIndex ? s : { ...s, [field]: value },
          ),
        },
      ),
    );
  };

  // 현재 포커스된 세트의 memo 업데이트
  const updateMemo = (value) => {
    const { blockIndex, rowIndex } = focusedSet;
    setBlocks((prev) =>
      prev.map((b, bi) =>
        bi !== blockIndex ? b : {
          ...b,
          sets: b.sets.map((s, si) =>
            si !== rowIndex ? s : { ...s, memo: value },
          ),
        },
      ),
    );
  };

  const handleSetFocus = useCallback((blockIndex, rowIndex) => {
    setFocusedSet({ blockIndex, rowIndex });
  }, []);

  const handleFirstWeightTab = useCallback((row, value) => {
    setBlocks((prev) => fillExerciseWeightsFromFirstSet(prev, row.blockIndex, row.rowIndex, value));
  }, []);

  const handleRepsTab = useCallback((row, value) => {
    if (!isCompletedRepsValue(value)) return;

    const block = blocks[row.blockIndex];
    const set = block?.sets?.[row.rowIndex];
    const completionKey = getSetCompletionKey(block, set);
    const completionSignature = String(value).trim();

    if (!completionKey || completedSetSignaturesRef.current.get(completionKey) === completionSignature) return;

    completedSetSignaturesRef.current.set(completionKey, completionSignature);

    const restPayload = getRestTimerPayloadForCompletedSet({
      blocks,
      sessionExercises,
      blockIndex: row.blockIndex,
      rowIndex: row.rowIndex,
    });

    if (restPayload) {
      onRestStart?.(restPayload);
    }
  }, [blocks, onRestStart, sessionExercises]);

  const addRow = (blockIndex) => {
    // Compute the new row's global index *before* updating state so we can
    // call requestFocus in the same event-handler batch.
    const newGlobalIdx = computeNewGlobalIndex(blocks, blockIndex);
    const newRowIndex  = blocks[blockIndex].sets.length; // 추가될 행의 rowIndex
    const isUnilateral = blocks[blockIndex].is_unilateral;

    setBlocks((prev) =>
      prev.map((b, i) => {
        if (i !== blockIndex) return b;

        const maxSetNumber = b.sets.length > 0 ? Math.max(...b.sets.map((s) => s.set_number)) : 0;
        const nextSetNumber = maxSetNumber + 1;

        const newSets = isUnilateral
          ? [
              { id: crypto.randomUUID(), set_number: nextSetNumber, side: 'L', weight: '', reps: '', memo: '' },
              { id: crypto.randomUUID(), set_number: nextSetNumber, side: 'R', weight: '', reps: '', memo: '' },
            ]
          : [
              { id: crypto.randomUUID(), set_number: nextSetNumber, side: 'both', weight: '', reps: '', memo: '' },
            ];

        return {
          ...b,
          sets: [...b.sets, ...newSets],
        };
      })
    );

    setFocusedSet({ blockIndex, rowIndex: newRowIndex });
    requestFocus(newGlobalIdx);
  };

  // Expose imperative methods to parent (for ` / ₩ key focus toggle)
  useImperativeHandle(ref, () => ({
    focusGrid: () => focusLastOrFirst(),
    focusNote: () => noteRef.current?.focus(),
    isNoteFocused: () => document.activeElement === noteRef.current,
  }), [focusLastOrFirst]);

  const hasEnteredData = useMemo(() => {
    return blocks.some((block) =>
      block.sets.some((set) =>
        String(set.reps ?? '').trim() !== ''
      )
    );
  }, [blocks]);

  const handleSaveWorkout = () => {
    if (!hasEnteredData) return;
    saveWorkoutLog(session.id, blocks, startTime);
    if (onSaveSuccess) {
      onSaveSuccess();
    }
  };


  // ── render ─────────────────────────────────────────────────────────────────

  if (!session) {
    return (
      <div
        className="glass-panel--strong"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--text-muted)',
        }}
      >
        세션을 선택해주세요
      </div>
    );
  }

  return (
    <div
      className="glass-panel--strong"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
    >
      {/* Header */}
      <div style={{ padding: '20px 22px 0 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: 'var(--text-bright)' }}>
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
        <div style={{ display: 'flex', width: '100%', height: '38px', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: '60px', display: 'flex', justifyContent: 'center' }}>
            <span className="grid-header-badge">Set</span>
          </div>
          {COLUMNS.map(({ field, header }) => (
            <div key={field} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <span className="grid-header-badge grid-header-badge--accent">
                {header}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div
        ref={scrollContainerRef}
        style={{ flex: 1, overflowY: 'auto', padding: '0 22px 20px 22px' }}
      >
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
                    >
                      <td
                        colSpan={3}
                        style={{
                          textAlign: 'left',
                          padding: isFirst ? '20px 14px 10px 14px' : '40px 14px 10px 14px',
                          color: 'var(--text-bright)',
                          fontWeight: '600',
                          fontSize: '14px',
                          borderBottom: 'none',
                          letterSpacing: '-0.02em',
                        }}
                      >
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
                        addRow={addRow}
                        onExerciseFocus={onExerciseFocus}
                        onSetFocus={handleSetFocus}
                        onRepsTab={handleRepsTab}
                        onFirstWeightTab={handleFirstWeightTab}
                      />
                    ))}

                    {/* Centered Add Set Button Row */}
                    <tr>
                      <td
                        colSpan={3}
                        style={{
                          textAlign: 'center',
                          height: '36px',
                          padding: 0,
                          borderBottom: '1px solid var(--border)',
                          verticalAlign: 'middle',
                        }}
                      >
                        <button
                          onClick={() => addRow(blockIndex)}
                          className="add-set-row-btn-minimal"
                          type="button"
                          title="세트 추가"
                        >
                          <Plus size={12} style={{ marginRight: '4px' }} />
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
                    onClick={handleSaveWorkout}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveWorkout();
                        return;
                      }
                      handleKeyDown(e, totalRows, 0);
                    }}
                    className="workout-complete-row-btn"
                    disabled={!hasEnteredData}
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
      <div style={{ padding: '18px 22px', borderTop: '1px solid var(--border)' }}>
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

export default SetGrid;
