import React, { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useGridNavigation, COLUMNS } from '../hooks/useGridNavigation';

// ─── AddSetButton ─────────────────────────────────────────────────────────────

const ADD_BUTTON_STYLE = {
  position: 'absolute',
  bottom: '-10px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 10,
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  background: 'var(--bg-deep)',
  border: '1px solid var(--border)',
  color: 'var(--text-muted)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  padding: 0,
  transition: 'all 0.2s',
  opacity: 0.35,
};

function AddSetButton({ onClick }) {
  const onEnter = (e) =>
    Object.assign(e.currentTarget.style, {
      color: 'var(--text-bright)',
      borderColor: 'var(--accent)',
      opacity: '1',
      transform: 'translateX(-50%) scale(1.1)',
    });
  const onLeave = (e) =>
    Object.assign(e.currentTarget.style, {
      color: 'var(--text-muted)',
      borderColor: 'var(--border)',
      opacity: '0.35',
      transform: 'translateX(-50%) scale(1)',
    });

  return (
    <button
      onClick={onClick}
      style={ADD_BUTTON_STYLE}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      title="세트 추가"
    >
      <Plus size={10} />
    </button>
  );
}

// ─── SetRow ───────────────────────────────────────────────────────────────────

function SetRow({ row, getCellRef, handleKeyDown, updateRow, addRow, onExerciseFocus }) {
  const { globalIndex, blockIndex, rowIndex, set_number, isLastSet, exerciseId } = row;

  return (
    <tr>
      <td className="cell-set" style={{ position: 'relative' }}>
        {set_number}
        {isLastSet && <AddSetButton onClick={() => addRow(blockIndex)} />}
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

// ─── pure helpers ─────────────────────────────────────────────────────────────

const NUMERIC_RE = /^[0-9.]*$/;

/**
 * Build the initial block list from store data.
 * Pure function — no React dependencies.
 */
function buildInitialBlocks(session, sessionExercises, exercises) {
  if (!session) return [];
  return sessionExercises
    .filter((se) => se.session_id === session.id)
    .sort((a, b) => a.order - b.order)
    .map((se) => {
      const exercise = exercises.find((ex) => ex.id === se.exercise_id);
      const targetSets = se.target_sets || 3;
      return {
        id: se.id,
        exercise_id: se.exercise_id,
        exercise_name: exercise?.name ?? 'Unknown Exercise',
        sets: Array.from({ length: targetSets }, (_, i) => ({
          id: crypto.randomUUID(),
          set_number: i + 1,
          weight: '',
          reps: '',
        })),
      };
    });
}

/**
 * Flatten nested blocks → a single list of row descriptors with global indices.
 * This removes the IIFE + mutable counter pattern from the JSX.
 *
 * @param {Block[]} blocks
 * @returns {FlatRow[]}
 */
function flattenBlocks(blocks) {
  const rows = [];
  blocks.forEach((block, blockIndex) => {
    block.sets.forEach((set, rowIndex) => {
      rows.push({
        ...set,
        blockIndex,
        rowIndex,
        globalIndex: rows.length,
        isLastSet: rowIndex === block.sets.length - 1,
        exerciseId: block.exercise_id,
      });
    });
  });
  return rows;
}

/**
 * Compute the global row index that the new set will occupy after addRow.
 * Uses current (pre-mutation) blocks so it can be called before setBlocks.
 *
 * @param {Block[]} blocks - Current block array (before adding the new row).
 * @param {number}  blockIndex - Which block is receiving the new row.
 * @returns {number} Global index of the new row.
 */
function computeNewGlobalIndex(blocks, blockIndex) {
  let idx = 0;
  for (let i = 0; i < blockIndex; i++) idx += blocks[i].sets.length;
  return idx + blocks[blockIndex].sets.length; // current length = 0-based index after insert
}

// ─── SetGrid ──────────────────────────────────────────────────────────────────

export default function SetGrid({ session, onExerciseFocus }) {
  const sessionExercises = useWorkoutStore((state) => state.sessionExercises);
  const exercises        = useWorkoutStore((state) => state.exercises);

  const initialBlocks = useMemo(
    () => buildInitialBlocks(session, sessionExercises, exercises),
    [session, sessionExercises, exercises],
  );

  const [blocks, setBlocks] = useState([]);
  const [note,   setNote]   = useState('');

  useEffect(() => { setBlocks(initialBlocks); }, [initialBlocks]);

  // Flat row list — drives both the table render and totalRows for the hook.
  const flatRows  = useMemo(() => flattenBlocks(blocks), [blocks]);
  const totalRows = flatRows.length;

  const { getCellRef, handleKeyDown, requestFocus, isKeyboardActive } = useGridNavigation(totalRows);

  // ── mutations ──────────────────────────────────────────────────────────────

  const updateRow = (blockIndex, rowIndex, field, value) => {
    if (!NUMERIC_RE.test(value)) return;
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
          {session.name}
        </h2>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 20px 22px' }}>
        <div className="spreadsheet-wrap">
          <table className={`spreadsheet ${isKeyboardActive ? 'keyboard-navigating' : ''}`}>
            <thead>
              <tr>
                <th className="col-set">Set</th>
                {COLUMNS.map(({ field, header }) => (
                  <th key={field}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {flatRows.map((row) => (
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
            </tbody>
          </table>
        </div>
      </div>

      {/* Session note */}
      <div style={{ padding: '18px 22px', borderTop: '1px solid var(--border)' }}>
        <textarea
          className="note-textarea"
          placeholder="Add a note for this session..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
    </div>
  );
}
