import React, { useState, useMemo, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Plus } from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useGridNavigation, COLUMNS } from '../hooks/useGridNavigation';
import { getFormattedSessionName } from '../utils/sessionHelper';
import {
  buildInitialBlocks,
  computeNewGlobalIndex,
  flattenBlocks,
  isNumericGridValue,
} from '../utils/setGridModel.js';

// ─── SetRow ───────────────────────────────────────────────────────────────────

function SetRow({ row, getCellRef, handleKeyDown, updateRow, addRow, onExerciseFocus }) {
  const { globalIndex, blockIndex, rowIndex, set_number, exerciseId } = row;

  return (
    <tr>
      <td className="cell-set">
        {set_number}
      </td>

      {COLUMNS.map(({ colIndex, field }) => (
        <td key={field} className="cell-input">
          <input
            ref={getCellRef(globalIndex, colIndex)}
            type="text"
            inputMode="decimal"
            value={row[field]}
            onChange={(e) => updateRow(blockIndex, rowIndex, field, e.target.value)}
            onKeyDown={(e) =>
              handleKeyDown(e, globalIndex, colIndex, {
                onTabAtEnd: () => addRow(blockIndex),
              })
            }
            onFocus={() => onExerciseFocus?.(exerciseId)}
            placeholder="—"
          />
        </td>
      ))}
    </tr>
  );
}

// ─── SetGrid ──────────────────────────────────────────────────────────────────

const SetGrid = forwardRef(function SetGrid({ session, onExerciseFocus }, ref) {
  const sessions         = useWorkoutStore((state) => state.sessions);
  const sessionExercises = useWorkoutStore((state) => state.sessionExercises);
  const exercises        = useWorkoutStore((state) => state.exercises);

  const [blocks, setBlocks] = useState(() => buildInitialBlocks(session, sessionExercises, exercises));
  const [note,   setNote]   = useState('');

  // Flat row list — drives both the table render and totalRows for the hook.
  const flatRows  = useMemo(() => flattenBlocks(blocks), [blocks]);
  const totalRows = flatRows.length;

  const { getCellRef, handleKeyDown, requestFocus, isKeyboardActive, focusLastOrFirst } = useGridNavigation(totalRows);

  // Ref for the session note textarea (for C-key toggle)
  const noteRef = useRef(null);

  // ── mutations ──────────────────────────────────────────────────────────────

  const updateRow = (blockIndex, rowIndex, field, value) => {
    if (!isNumericGridValue(value)) return;
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

  const addRow = (blockIndex) => {
    // Compute the new row's global index *before* updating state so we can
    // call requestFocus in the same event-handler batch.
    const newGlobalIdx = computeNewGlobalIndex(blocks, blockIndex);

    setBlocks((prev) =>
      prev.map((b, i) =>
        i !== blockIndex ? b : {
          ...b,
          sets: [
            ...b.sets,
            {
              id: crypto.randomUUID(),
              set_number: b.sets.length + 1,
              weight: '',
              reps: '',
            },
          ],
        },
      ),
    );

    requestFocus(newGlobalIdx);
  };

  // Expose imperative methods to parent (for ` / ₩ key focus toggle)
  useImperativeHandle(ref, () => ({
    focusGrid: () => focusLastOrFirst(),
    focusNote: () => noteRef.current?.focus(),
    isNoteFocused: () => document.activeElement === noteRef.current,
  }), [focusLastOrFirst]);

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
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          {getFormattedSessionName(session, sessions)}
        </h2>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 20px 22px' }}>
        <div className="spreadsheet-wrap">
          <table className={`spreadsheet ${isKeyboardActive ? 'keyboard-navigating' : ''}`}>
            <thead>
              <tr>
                <th className="col-set">
                  <span className="grid-header-badge">Set</span>
                </th>
                {COLUMNS.map(({ field, header }) => (
                  <th key={field}>
                    <span className="grid-header-badge grid-header-badge--accent">
                      {header}
                    </span>
                  </th>
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
                    <tr>
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
            </tbody>
          </table>
        </div>
      </div>

      {/* Session note */}
      <div style={{ padding: '18px 22px', borderTop: '1px solid var(--border)' }}>
        <textarea
          ref={noteRef}
          className="note-textarea"
          placeholder="Add a note for this session..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
    </div>
  );
});

export default SetGrid;
