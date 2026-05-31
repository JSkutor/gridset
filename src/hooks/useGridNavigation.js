import { useRef, useState, useEffect, useCallback } from "react";

/**
 * Column descriptors for the set-entry grid.
 * Add an entry here (and update your DB / state) to introduce a new column —
 * the header, cell rendering, and navigation will all adapt automatically.
 *
 * @type {{ colIndex: number; field: string; header: string }[]}
 */
export const COLUMNS = [
  { colIndex: 0, field: "weight", header: "kg" },
  { colIndex: 1, field: "reps", header: "Reps" },
];

/** Derived from COLUMNS so NUM_COLS is always in sync with the column definitions. */
export const NUM_COLS = COLUMNS.length;

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Manages keyboard navigation and DOM ref registration for a 2-D grid of
 * <input> cells laid out as (totalRows × NUM_COLS).
 *
 * Supports:
 *  • ArrowUp / ArrowDown  — move between rows, same column
 *  • ArrowLeft / ArrowRight — wrap to adjacent cell when cursor is at edge
 *  • Enter                 — move down one row
 *  • Tab / Shift+Tab       — move forward / backward through all cells
 *
 * @param {number} totalRows - Total input rows currently rendered.
 * @returns {{ getCellRef, handleKeyDown, requestFocus, recordFocus }}
 */
export function useGridNavigation(totalRows) {
  /** gridRefs.current[rowIndex][colIndex] → <input> DOM node */
  const gridRefs = useRef([]);

  /**
   * Index of the row that should receive focus after the next render.
   * Set via requestFocus(); cleared once the element is found in the DOM.
   */
  const [pendingFocusIndex, setPendingFocusIndex] = useState(null);

  /** Track if user is navigating using the keyboard to temporarily suppress hover styles */
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);

  /** Track the last focused cell so we can restore focus with the C key */
  const lastFocusedCell = useRef({ row: 0, col: 0 });

  // Keep the refs array sized to the current row count.
  useEffect(() => {
    gridRefs.current = gridRefs.current.slice(0, totalRows);
    for (let i = 0; i < totalRows; i++) {
      if (!gridRefs.current[i]) gridRefs.current[i] = [];
    }
  }, [totalRows]);

  // After a new row is added (totalRows grows), focus the pending cell.
  useEffect(() => {
    if (
      pendingFocusIndex !== null &&
      gridRefs.current[pendingFocusIndex]?.[0]
    ) {
      gridRefs.current[pendingFocusIndex][0].focus({ preventScroll: true });
      setPendingFocusIndex(null);
    }
  }, [pendingFocusIndex, totalRows]);

  // Listen for mouse interaction to restore hover styles.
  // Both mousemove and mousedown reset isKeyboardActive so clicking
  // a cell (without moving the mouse) also clears the keyboard-nav
  // state and lets :focus-within highlight show unimpeded.
  useEffect(() => {
    if (!isKeyboardActive) return;

    const handleMouseInteraction = () => {
      setIsKeyboardActive(false);
    };

    window.addEventListener("mousemove", handleMouseInteraction);
    window.addEventListener("mousedown", handleMouseInteraction);
    return () => {
      window.removeEventListener("mousemove", handleMouseInteraction);
      window.removeEventListener("mousedown", handleMouseInteraction);
    };
  }, [isKeyboardActive]);

  // ── internals ───────────────────────────────────────────────────────────────

  const recordFocus = useCallback((row, col) => {
    lastFocusedCell.current = { row, col };
  }, []);

  const focusCell = useCallback(
    (row, col) => {
      const el = gridRefs.current[row]?.[col];
      if (el) {
        el.focus({ preventScroll: true });
        recordFocus(row, col);
      }
    },
    [recordFocus],
  );

  // ── public API ──────────────────────────────────────────────────────────────

  /**
   * Returns a ref callback that registers the DOM <input> at (rowIndex, colIndex).
   * Usage: <input ref={getCellRef(globalRowIndex, colIndex)} />
   */
  const getCellRef = useCallback(
    (rowIndex, colIndex) => (el) => {
      if (!gridRefs.current[rowIndex]) gridRefs.current[rowIndex] = [];
      gridRefs.current[rowIndex][colIndex] = el;
    },
    [],
  );

  /**
   * Keyboard handler to attach to every grid <input>.
   *
   * @param {React.KeyboardEvent} e
   * @param {number} rowIndex     Global (flattened) row index of the focused cell.
   * @param {number} colIndex     Column index of the focused cell.
   */
  const handleKeyDown = useCallback(
    (e, rowIndex, colIndex) => {
      // Mark keyboard navigation active before moving focus, so the
      // keyboard-navigating CSS class is applied on the next render and
      // prevents hover styles from leaking on the row under the mouse cursor.
      setIsKeyboardActive(true);

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          if (rowIndex > 0) focusCell(rowIndex - 1, colIndex);
          break;

        case "ArrowDown":
          e.preventDefault();
          if (rowIndex < totalRows - 1) focusCell(rowIndex + 1, colIndex);
          break;

        case "Enter":
          e.preventDefault();
          if (rowIndex < totalRows - 1) focusCell(rowIndex + 1, colIndex);
          break;

        case "Tab":
          e.preventDefault();
          if (!e.shiftKey) {
            if (colIndex < NUM_COLS - 1) focusCell(rowIndex, colIndex + 1);
            else if (rowIndex < totalRows - 1) focusCell(rowIndex + 1, 0);
          } else {
            if (colIndex > 0) focusCell(rowIndex, colIndex - 1);
            else if (rowIndex > 0) focusCell(rowIndex - 1, NUM_COLS - 1);
          }
          break;

        case "ArrowLeft":
          if (e.target.selectionStart === 0) {
            e.preventDefault();
            if (colIndex > 0) focusCell(rowIndex, colIndex - 1);
            else if (rowIndex > 0) focusCell(rowIndex - 1, NUM_COLS - 1);
          }
          break;

        case "ArrowRight":
          if (e.target.selectionEnd === e.target.value.length) {
            e.preventDefault();
            if (colIndex < NUM_COLS - 1) focusCell(rowIndex, colIndex + 1);
            else if (rowIndex < totalRows - 1) focusCell(rowIndex + 1, 0);
          }
          break;

        default:
          break;
      }
    },
    [focusCell, totalRows],
  );

  /**
   * Schedule focus on the first column of `rowIndex` after the next render.
   * Call this right after appending a new row to `blocks`.
   *
   * @param {number} rowIndex - Global row index of the row to focus.
   */
  const requestFocus = useCallback((rowIndex) => {
    setPendingFocusIndex(rowIndex);
  }, []);

  /**
   * Focus the last-interacted cell, or (0, 0) if none.
   * Used by the "C" shortcut to jump into the grid.
   */
  const focusLastOrFirst = useCallback(() => {
    const { row, col } = lastFocusedCell.current;
    const el = gridRefs.current[row]?.[col];
    if (el) {
      el.focus({ preventScroll: true });
    } else {
      // fallback: focus first available cell
      gridRefs.current[0]?.[0]?.focus({ preventScroll: true });
    }
  }, []);

  return {
    getCellRef,
    handleKeyDown,
    requestFocus,
    isKeyboardActive,
    focusLastOrFirst,
    recordFocus,
  };
}
