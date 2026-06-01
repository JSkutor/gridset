import { useRef, useState, useEffect, useCallback } from "react";
import type { KeyboardEvent } from "react";

type GridColumnField = "weight" | "reps";

type GridColumn = {
  colIndex: number;
  field: GridColumnField;
  header: string;
};

type GridCellPosition = {
  row: number;
  col: number;
};

export type BlockJumpDirection = "up" | "down" | "left" | "right";

/**
 * Column descriptors for the set-entry grid.
 * Add an entry here (and update your DB / state) to introduce a new column —
 * the header, cell rendering, and navigation will all adapt automatically.
 *
 */
export const COLUMNS: GridColumn[] = [
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
 *  • Cmd/Ctrl + arrows     — jump to block edge (via resolveBlockJump)
 *
 */
type UseGridNavigationOptions = {
  /** When true, Tab / Shift+Tab skip this cell (arrow keys may still focus it). */
  shouldSkipCellForTab?: (rowIndex: number, colIndex: number) => boolean;
  /**
   * Cmd/Ctrl + arrow: jump to the edge of the current exercise block.
   * Return null to fall through to default arrow handling.
   */
  resolveBlockJump?: (
    rowIndex: number,
    colIndex: number,
    direction: BlockJumpDirection,
  ) => GridCellPosition | null;
  /** Called after programmatic focus (e.g. scroll correction). */
  onFocusCell?: (element: HTMLInputElement) => void;
};

function leftmostFocusableCol(
  rowIndex: number,
  shouldSkipCellForTab?: (rowIndex: number, colIndex: number) => boolean,
): number {
  for (let col = 0; col < NUM_COLS; col += 1) {
    if (!shouldSkipCellForTab?.(rowIndex, col)) return col;
  }
  return 0;
}

function rightmostFocusableCol(
  rowIndex: number,
  shouldSkipCellForTab?: (rowIndex: number, colIndex: number) => boolean,
): number {
  for (let col = NUM_COLS - 1; col >= 0; col -= 1) {
    if (!shouldSkipCellForTab?.(rowIndex, col)) return col;
  }
  return NUM_COLS - 1;
}

function focusableColOrFallback(
  rowIndex: number,
  colIndex: number,
  shouldSkipCellForTab?: (rowIndex: number, colIndex: number) => boolean,
): number {
  if (!shouldSkipCellForTab?.(rowIndex, colIndex)) return colIndex;
  return leftmostFocusableCol(rowIndex, shouldSkipCellForTab);
}

/**
 * Jump target within a single exercise block (inclusive row range).
 */
export function resolveBlockJumpTarget(
  rowIndex: number,
  colIndex: number,
  direction: BlockJumpDirection,
  blockRowRange: { start: number; end: number },
  shouldSkipCellForTab?: (rowIndex: number, colIndex: number) => boolean,
): GridCellPosition {
  const { start, end } = blockRowRange;

  switch (direction) {
    case "up":
      return {
        row: start,
        col: focusableColOrFallback(start, colIndex, shouldSkipCellForTab),
      };
    case "down":
      return {
        row: end,
        col: focusableColOrFallback(end, colIndex, shouldSkipCellForTab),
      };
    case "left":
      return {
        row: rowIndex,
        col: leftmostFocusableCol(rowIndex, shouldSkipCellForTab),
      };
    case "right":
      return {
        row: rowIndex,
        col: rightmostFocusableCol(rowIndex, shouldSkipCellForTab),
      };
    default:
      return { row: rowIndex, col: colIndex };
  }
}

function findAdjacentCell(
  rowIndex: number,
  colIndex: number,
  totalRows: number,
  direction: 1 | -1,
  shouldSkipCellForTab?: (rowIndex: number, colIndex: number) => boolean,
): GridCellPosition | null {
  let row = rowIndex;
  let col = colIndex;

  for (let attempts = 0; attempts < totalRows * NUM_COLS; attempts += 1) {
    if (direction > 0) {
      if (col < NUM_COLS - 1) col += 1;
      else if (row < totalRows - 1) {
        row += 1;
        col = 0;
      } else return null;
    } else if (col > 0) {
      col -= 1;
    } else if (row > 0) {
      row -= 1;
      col = NUM_COLS - 1;
    } else {
      return null;
    }

    if (!shouldSkipCellForTab?.(row, col)) {
      return { row, col };
    }
  }

  return null;
}

export function useGridNavigation(
  totalRows: number,
  { shouldSkipCellForTab, resolveBlockJump, onFocusCell }: UseGridNavigationOptions = {},
) {
  /** gridRefs.current[rowIndex][colIndex] → <input> DOM node */
  const gridRefs = useRef<Array<Array<HTMLInputElement | null>>>([]);

  /**
   * Index of the row that should receive focus after the next render.
   * Set via requestFocus(); cleared once the element is found in the DOM.
   */
  const [pendingFocus, setPendingFocus] = useState<GridCellPosition | null>(null);

  /** Track if user is navigating using the keyboard to temporarily suppress hover styles */
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);

  /** Track the last focused cell so we can restore focus with the C key */
  const lastFocusedCell = useRef<GridCellPosition>({ row: 0, col: 0 });

  const recordFocus = useCallback((row: number, col: number) => {
    lastFocusedCell.current = { row, col };
  }, []);

  // Keep the refs array sized to the current row count.
  useEffect(() => {
    gridRefs.current = gridRefs.current.slice(0, totalRows);
    for (let i = 0; i < totalRows; i++) {
      if (!gridRefs.current[i]) gridRefs.current[i] = [];
    }
  }, [totalRows]);

  // After a new row is added (totalRows grows), focus the pending cell.
  useEffect(() => {
    if (pendingFocus === null) return;

    const { row, col } = pendingFocus;
    const el = gridRefs.current[row]?.[col];
    if (el) {
      el.focus({ preventScroll: true });
      recordFocus(row, col);
      onFocusCell?.(el);
      setPendingFocus(null);
    }
  }, [onFocusCell, pendingFocus, totalRows, recordFocus]);

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

  const focusCell = useCallback(
    (row: number, col: number) => {
      const el = gridRefs.current[row]?.[col];
      if (el) {
        el.focus({ preventScroll: true });
        recordFocus(row, col);
        onFocusCell?.(el);
      }
    },
    [onFocusCell, recordFocus],
  );

  // ── public API ──────────────────────────────────────────────────────────────

  /**
   * Returns a ref callback that registers the DOM <input> at (rowIndex, colIndex).
   * Usage: <input ref={getCellRef(globalRowIndex, colIndex)} />
   */
  const getCellRef = useCallback(
    (rowIndex: number, colIndex: number) => (el: HTMLInputElement | null) => {
      if (!gridRefs.current[rowIndex]) gridRefs.current[rowIndex] = [];
      gridRefs.current[rowIndex][colIndex] = el;
    },
    [],
  );

  /**
   * Keyboard handler to attach to every grid <input>.
   *
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
      // Mark keyboard navigation active before moving focus, so the
      // keyboard-navigating CSS class is applied on the next render and
      // prevents hover styles from leaking on the row under the mouse cursor.
      setIsKeyboardActive(true);

      const isBlockJump =
        (e.metaKey || e.ctrlKey) &&
        !e.altKey &&
        (e.key === "ArrowUp" ||
          e.key === "ArrowDown" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight");

      if (isBlockJump && resolveBlockJump) {
        const direction: BlockJumpDirection =
          e.key === "ArrowUp"
            ? "up"
            : e.key === "ArrowDown"
              ? "down"
              : e.key === "ArrowLeft"
                ? "left"
                : "right";
        const target = resolveBlockJump(rowIndex, colIndex, direction);
        const isAlreadyAtBlockEdge =
          target != null && target.row === rowIndex && target.col === colIndex;

        if (target && !isAlreadyAtBlockEdge) {
          e.preventDefault();
          focusCell(target.row, target.col);
          return;
        }
        // At block edge: fall through to normal arrow-key navigation.
      }

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

        case "Tab": {
          e.preventDefault();
          const direction = e.shiftKey ? -1 : 1;
          const next = findAdjacentCell(
            rowIndex,
            colIndex,
            totalRows,
            direction,
            shouldSkipCellForTab,
          );
          if (next) focusCell(next.row, next.col);
          break;
        }

        case "ArrowLeft":
          if (e.currentTarget.selectionStart === 0) {
            e.preventDefault();
            if (colIndex > 0) focusCell(rowIndex, colIndex - 1);
            else if (rowIndex > 0) focusCell(rowIndex - 1, NUM_COLS - 1);
          }
          break;

        case "ArrowRight":
          if (e.currentTarget.selectionEnd === e.currentTarget.value.length) {
            e.preventDefault();
            if (colIndex < NUM_COLS - 1) focusCell(rowIndex, colIndex + 1);
            else if (rowIndex < totalRows - 1) focusCell(rowIndex + 1, 0);
          }
          break;

        default:
          break;
      }
    },
    [focusCell, resolveBlockJump, shouldSkipCellForTab, totalRows],
  );

  /**
   * Schedule focus on the first column of `rowIndex` after the next render.
   * Call this right after appending a new row to `blocks`.
   *
   */
  const requestFocus = useCallback((rowIndex: number, colIndex = 0) => {
    setPendingFocus({ row: rowIndex, col: colIndex });
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
