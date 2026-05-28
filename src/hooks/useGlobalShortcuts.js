import { useEffect } from 'react';

const RETIRED_NAV_SHORTCUT_KEYS = new Set(['1', '2', '3']);

function isEditableTarget(target) {
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
  NAV_TAB_IDS,
  setActiveTab,
  setGridRef,
  routineDetailRef,
}) {
  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      // ESC: blur any focused element so shortcuts become available again.
      if (event.key === 'Escape') {
        if (document.activeElement && document.activeElement !== document.body) {
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
        const grid = setGridRef.current;
        const routineDetail = routineDetailRef.current;
        if (grid) {
          const activeEl = document.activeElement;
          const isInGrid = activeEl && activeEl.closest && activeEl.closest('.spreadsheet');
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
        return;
      }

      // Cmd/Ctrl + Arrow: cycle through top-level tabs.
      if ((event.metaKey || event.ctrlKey) && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        setActiveTab((currentTab) => {
          const currentIndex = Math.max(0, NAV_TAB_IDS.indexOf(currentTab));
          const direction = event.key === 'ArrowRight' ? 1 : -1;
          const nextIndex = (currentIndex + direction + NAV_TAB_IDS.length) % NAV_TAB_IDS.length;
          return NAV_TAB_IDS[nextIndex];
        });
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  }, [NAV_TAB_IDS, setActiveTab, setGridRef, routineDetailRef]);
}
