import { useEffect } from 'react';

/**
 * Checks whether the keyboard event target is an editable element
 * (input, textarea, select, or contenteditable).
 *
 * @param {EventTarget} target
 * @returns {boolean}
 */
function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    target.isContentEditable ||
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select'
  );
}

/**
 * Attaches a global `keydown` listener that maps keyboard shortcuts to tab IDs.
 *
 * Features:
 *  - Ignores events originating from editable elements.
 *  - Ignores events when any modifier key (Meta / Ctrl / Alt) is held.
 *  - Optionally guards the whole hook behind an `isActive` flag so shortcuts
 *    only fire while the relevant parent page/context is visible.
 *
 * @param {{
 *   tabIds: string[],
 *   shortcuts: Record<string, string>,
 *   setActiveTab: (id: string) => void,
 *   isActive?: boolean,
 * }} options
 *
 * @example
 * // Top-level app navigation: Q → R, W → S, E → L
 * useTabNavigation({
 *   tabIds: ['R', 'S', 'L'],
 *   shortcuts: { KeyQ: 'R', KeyW: 'S', KeyE: 'L' },
 *   setActiveTab: setActiveTab,
 * });
 *
 * @example
 * // Log page sub-navigation: A → daily, S → exercise, D → routine
 * // Only active while the Log tab is visible.
 * useTabNavigation({
 *   tabIds: ['daily', 'exercise', 'routine'],
 *   shortcuts: { KeyA: 'daily', KeyS: 'exercise', KeyD: 'routine' },
 *   setActiveTab: setActiveView,
 *   isActive: activeTab === 'L',
 * });
 */
export function useTabNavigation({ tabIds, shortcuts, setActiveTab, isActive = true }) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event) => {
      // Ignore when a modifier key is held.
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      // Ignore when typing in an editable element.
      if (isEditableTarget(event.target)) return;

      const targetTab = shortcuts[event.code];
      if (!targetTab) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      setActiveTab(targetTab);
    };

    // Use capture phase so this fires before child handlers.
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isActive, shortcuts, setActiveTab, tabIds]);
}
