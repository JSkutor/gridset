import { useEffect } from 'react';
import type { RefObject } from 'react';

const RETIRED_NAV_SHORTCUT_KEYS = new Set(['1', '2', '3']);

type WorkoutGridShortcutHandle = {
  focusGrid: () => void;
  focusNote: () => void;
  isNoteFocused: () => boolean;
};

type RoutineDetailShortcutHandle = {
  focusFirstSessionFirstExercise: () => void;
};

type GlobalShortcutOptions = {
  workoutGridRef: RefObject<WorkoutGridShortcutHandle | null>;
  routineDetailRef: RefObject<RoutineDetailShortcutHandle | null>;
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  return (
    target.isContentEditable ||
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select'
  );
}

export function useGlobalShortcuts({
  workoutGridRef,
  routineDetailRef,
}: GlobalShortcutOptions): void {
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Ignore all shortcuts if a help or auth modal is open.
      if (
        document.querySelector('.help-backdrop') ||
        document.querySelector('.auth-modal-backdrop')
      ) {
        return;
      }

      // ESC: blur any focused element so shortcuts become available again.
      if (event.key === 'Escape') {
        if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
          event.preventDefault();
          document.activeElement.blur();
        }
        return;
      }

      // ` / ₩ key: focus into grid / toggle grid ↔ memo / routine focus.
      const hasModifier = event.metaKey || event.ctrlKey || event.altKey;
      if (!hasModifier && event.code === 'Backquote') {
        event.preventDefault();
        event.stopImmediatePropagation();
        const grid = workoutGridRef.current;
        const routineDetail = routineDetailRef.current;
        if (grid) {
          const activeEl = document.activeElement;
          const isInGrid = activeEl instanceof HTMLElement && activeEl.closest('.spreadsheet');
          const isInNote = grid.isNoteFocused();
          if (isInNote) {
            grid.focusGrid();
          } else if (isInGrid) {
            grid.focusNote();
          } else {
            grid.focusGrid();
          }
        } else if (routineDetail) {
          routineDetail.focusFirstSessionFirstExercise();
        }
        return;
      }

      if (event.defaultPrevented || isEditableTarget(event.target)) return;

      // Silence retired 1 / 2 / 3 shortcuts.
      if (!hasModifier && RETIRED_NAV_SHORTCUT_KEYS.has(event.key)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  }, [workoutGridRef, routineDetailRef]);
}
