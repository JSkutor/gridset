import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Plus } from 'lucide-react'
import { useWorkoutStore } from '../store/useWorkoutStore'

export default function SetGrid({ routine, onExerciseFocus }) {
  const routineExercises = useWorkoutStore(state => state.routineExercises);
  const exercises = useWorkoutStore(state => state.exercises);

  const initialBlocks = useMemo(() => {
    if (!routine) return [];
    const rExercises = routineExercises
      .filter(re => re.routine_id === routine.id)
      .sort((a, b) => a.order - b.order);
      
    return rExercises.map(re => {
      const exercise = exercises.find(ex => ex.id === re.exercise_id);
      const targetSets = re.target_sets || 3;
      const sets = Array.from({ length: targetSets }).map((_, i) => ({
        id: crypto.randomUUID(),
        set_number: i + 1,
        weight: '',
        reps: ''
      }));
      return {
        id: re.id,
        exercise_id: re.exercise_id,
        exercise_name: exercise ? exercise.name : 'Unknown Exercise',
        sets
      };
    });
  }, [routine, routineExercises, exercises]);

  const [blocks, setBlocks] = useState([]);
  const [note, setNote] = useState('');
  const [pendingFocusIndex, setPendingFocusIndex] = useState(null);

  const totalSetsCount = useMemo(() => {
    return blocks.reduce((sum, block) => sum + block.sets.length, 0);
  }, [blocks]);

  const gridRefs = useRef([]);

  useEffect(() => {
    gridRefs.current = gridRefs.current.slice(0, totalSetsCount);
    for (let i = 0; i < totalSetsCount; i++) {
      if (!gridRefs.current[i]) gridRefs.current[i] = [];
    }
  }, [totalSetsCount]);

  useEffect(() => {
    if (pendingFocusIndex !== null && gridRefs.current[pendingFocusIndex]?.[0]) {
      gridRefs.current[pendingFocusIndex][0].focus();
      setPendingFocusIndex(null);
    }
  }, [blocks, pendingFocusIndex]);

  const handleKeyDown = (e, globalRowIndex, colIndex, blockIndex) => {
    const numRows = totalSetsCount;
    const numCols = 2;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (globalRowIndex > 0) {
          gridRefs.current[globalRowIndex - 1]?.[colIndex]?.focus();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (globalRowIndex < numRows - 1) {
          gridRefs.current[globalRowIndex + 1]?.[colIndex]?.focus();
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (globalRowIndex < numRows - 1) {
          gridRefs.current[globalRowIndex + 1]?.[colIndex]?.focus();
        }
        break;
      case 'Tab':
        e.preventDefault();
        if (!e.shiftKey) {
          if (colIndex < numCols - 1) {
            gridRefs.current[globalRowIndex]?.[colIndex + 1]?.focus();
          } else if (globalRowIndex < numRows - 1) {
            gridRefs.current[globalRowIndex + 1]?.[0]?.focus();
          } else {
            addRow(blockIndex);
          }
        } else {
          if (colIndex > 0) {
            gridRefs.current[globalRowIndex]?.[colIndex - 1]?.focus();
          } else if (globalRowIndex > 0) {
            gridRefs.current[globalRowIndex - 1]?.[numCols - 1]?.focus();
          }
        }
        break;
      case 'ArrowLeft':
        if (e.target.selectionStart === 0) {
          e.preventDefault();
          if (colIndex > 0) {
            gridRefs.current[globalRowIndex]?.[colIndex - 1]?.focus();
          } else if (globalRowIndex > 0) {
            gridRefs.current[globalRowIndex - 1]?.[numCols - 1]?.focus();
          }
        }
        break;
      case 'ArrowRight':
        if (e.target.selectionEnd === e.target.value.length) {
          e.preventDefault();
          if (colIndex < numCols - 1) {
            gridRefs.current[globalRowIndex]?.[colIndex + 1]?.focus();
          } else if (globalRowIndex < numRows - 1) {
            gridRefs.current[globalRowIndex + 1]?.[0]?.focus();
          }
        }
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    setBlocks(initialBlocks);
  }, [initialBlocks]);

  const updateRow = (blockIndex, setIndex, field, value) => {
    if (/^[0-9.]*$/.test(value)) {
      const newBlocks = [...blocks];
      newBlocks[blockIndex].sets[setIndex][field] = value;
      setBlocks(newBlocks);
    }
  };

  const addRow = (blockIndex) => {
    const newBlocks = [...blocks];
    const block = newBlocks[blockIndex];
    block.sets.push({
      id: crypto.randomUUID(),
      set_number: block.sets.length + 1,
      weight: '',
      reps: ''
    });
    setBlocks(newBlocks);

    let globalIndex = 0;
    for (let i = 0; i < blockIndex; i++) {
      globalIndex += newBlocks[i].sets.length;
    }
    globalIndex += block.sets.length - 1;
    setPendingFocusIndex(globalIndex);
  };

  if (!routine) {
    return (
      <div className="glass-panel--strong" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
        루틴을 선택해주세요
      </div>
    );
  }

  return (
    <div className="glass-panel--strong" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ padding: '20px 22px 0 22px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>{routine.name}</h2>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 20px 22px' }}>
        <div className="spreadsheet-wrap">
          <table className="spreadsheet">
            <thead>
              <tr>
                <th className="col-set">Set</th>
                <th>kg</th>
                <th>Reps</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                let globalRowIndex = 0;
                return blocks.map((block, blockIndex) => (
                  <React.Fragment key={block.id}>
                    {block.sets.map((row, rowIndex, arr) => {
                      const isLastSet = rowIndex === arr.length - 1;
                      const currentGlobalIndex = globalRowIndex++;
                      return (
                        <tr key={row.id}>
                          <td className="cell-set" style={{ position: 'relative' }}>
                            {row.set_number}
                            {isLastSet && (
                              <button 
                                onClick={() => addRow(blockIndex)}
                                style={{
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
                                  opacity: 0.35
                                }}
                                onMouseEnter={e => { 
                                  e.currentTarget.style.color = 'var(--text-bright)'; 
                                  e.currentTarget.style.borderColor = 'var(--accent)'; 
                                  e.currentTarget.style.opacity = '1';
                                  e.currentTarget.style.transform = 'translateX(-50%) scale(1.1)';
                                }}
                                onMouseLeave={e => { 
                                  e.currentTarget.style.color = 'var(--text-muted)'; 
                                  e.currentTarget.style.borderColor = 'var(--border)'; 
                                  e.currentTarget.style.opacity = '0.35';
                                  e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
                                }}
                                title="세트 추가"
                              >
                                <Plus size={10} />
                              </button>
                            )}
                          </td>
                          <td className="cell-input">
                            <input
                              ref={el => {
                                if (!gridRefs.current[currentGlobalIndex]) {
                                  gridRefs.current[currentGlobalIndex] = [];
                                }
                                gridRefs.current[currentGlobalIndex][0] = el;
                              }}
                              type="text"
                              inputMode="decimal"
                              value={row.weight}
                              onChange={(e) => updateRow(blockIndex, rowIndex, 'weight', e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, currentGlobalIndex, 0, blockIndex)}
                              onFocus={() => onExerciseFocus && onExerciseFocus(block.exercise_id)}
                              placeholder="—"
                            />
                          </td>
                          <td className="cell-input">
                            <input
                              ref={el => {
                                if (!gridRefs.current[currentGlobalIndex]) {
                                  gridRefs.current[currentGlobalIndex] = [];
                                }
                                gridRefs.current[currentGlobalIndex][1] = el;
                              }}
                              type="text"
                              inputMode="decimal"
                              value={row.reps}
                              onChange={(e) => updateRow(blockIndex, rowIndex, 'reps', e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, currentGlobalIndex, 1, blockIndex)}
                              onFocus={() => onExerciseFocus && onExerciseFocus(block.exercise_id)}
                              placeholder="—"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ padding: '18px 22px', borderTop: '1px solid var(--border)' }}>
        <textarea
          className="note-textarea"
          placeholder="Add a note for this session..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
    </div>
  )
}
