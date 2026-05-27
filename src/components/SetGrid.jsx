import React, { useState, useRef, useEffect } from 'react'
import { Plus } from 'lucide-react'

export default function SetGrid() {
  const [rows, setRows] = useState([
    { id: 1, set: 1, weight: '', reps: '' },
    { id: 2, set: 2, weight: '', reps: '' },
    { id: 3, set: 3, weight: '', reps: '' },
  ])
  const [note, setNote] = useState('')
  const gridRefs = useRef([])

  useEffect(() => {
    gridRefs.current = gridRefs.current.slice(0, rows.length);
    for (let i = 0; i < rows.length; i++) {
      if (!gridRefs.current[i]) gridRefs.current[i] = [];
    }
  }, [rows])

  const addRow = () => {
    setRows([...rows, { id: Date.now(), set: rows.length + 1, weight: '', reps: '' }])
  }

  const handleKeyDown = (e, rowIndex, colIndex) => {
    const numRows = rows.length;
    const numCols = 2;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (rowIndex > 0) gridRefs.current[rowIndex - 1][colIndex]?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (rowIndex < numRows - 1) gridRefs.current[rowIndex + 1][colIndex]?.focus();
        break;
      case 'Enter':
        e.preventDefault();
        if (rowIndex < numRows - 1) gridRefs.current[rowIndex + 1][colIndex]?.focus();
        else addRow();
        break;
      case 'Tab':
        e.preventDefault();
        if (!e.shiftKey) {
          if (colIndex < numCols - 1) gridRefs.current[rowIndex][colIndex + 1]?.focus();
          else if (rowIndex < numRows - 1) gridRefs.current[rowIndex + 1][0]?.focus();
          else addRow();
        } else {
          if (colIndex > 0) gridRefs.current[rowIndex][colIndex - 1]?.focus();
          else if (rowIndex > 0) gridRefs.current[rowIndex - 1][numCols - 1]?.focus();
        }
        break;
      case 'ArrowLeft':
        if (e.target.selectionStart === 0) {
          e.preventDefault();
          if (colIndex > 0) gridRefs.current[rowIndex][colIndex - 1]?.focus();
          else if (rowIndex > 0) gridRefs.current[rowIndex - 1][numCols - 1]?.focus();
        }
        break;
      case 'ArrowRight':
        if (e.target.selectionEnd === e.target.value.length) {
          e.preventDefault();
          if (colIndex < numCols - 1) gridRefs.current[rowIndex][colIndex + 1]?.focus();
          else if (rowIndex < numRows - 1) gridRefs.current[rowIndex + 1][0]?.focus();
        }
        break;
      default:
        break;
    }
  }

  const updateRow = (index, field, value) => {
    if (/^[0-9.]*$/.test(value)) {
      const newRows = [...rows]
      newRows[index][field] = value
      setRows(newRows)
    }
  }

  return (
    <div className="glass-panel--strong" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* 고정 헤더 영역 (스크롤 외부) */}
      <div style={{ padding: '20px 22px 0 22px' }}>
        <div className="spreadsheet-wrap" style={{ borderBottom: '1px solid var(--border-strong)' }}>
          <table className="spreadsheet">
            <thead>
              <tr>
                <th className="col-set" style={{ borderBottom: 'none' }}>Set</th>
                <th style={{ borderBottom: 'none' }}>kg</th>
                <th style={{ borderBottom: 'none' }}>Reps</th>
              </tr>
            </thead>
          </table>
        </div>
      </div>

      {/* 스크롤 가능한 데이터 영역 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 20px 22px' }}>
        <div className="spreadsheet-wrap">
          <table className="spreadsheet">
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={row.id}>
                  <td className="cell-set">{row.set}</td>
                  <td className="cell-input">
                    <input
                      ref={el => {
                        if (!gridRefs.current[rowIndex]) gridRefs.current[rowIndex] = [];
                        gridRefs.current[rowIndex][0] = el;
                      }}
                      type="text"
                      inputMode="decimal"
                      value={row.weight}
                      onChange={(e) => updateRow(rowIndex, 'weight', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, rowIndex, 0)}
                      placeholder="—"
                    />
                  </td>
                  <td className="cell-input">
                    <input
                      ref={el => {
                        if (!gridRefs.current[rowIndex]) gridRefs.current[rowIndex] = [];
                        gridRefs.current[rowIndex][1] = el;
                      }}
                      type="text"
                      inputMode="decimal"
                      value={row.reps}
                      onChange={(e) => updateRow(rowIndex, 'reps', e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, rowIndex, 1)}
                      placeholder="—"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button onClick={addRow} className="add-row-btn">
          <Plus size={14} /> Add Set
        </button>
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
