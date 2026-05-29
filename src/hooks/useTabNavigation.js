import { useEffect } from 'react';
import { startViewTransition } from './useViewTransition';

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

function focusNavigationTarget(targetTab, focusScopeSelector, focusTargetSelector) {
  if (!focusTargetSelector) return;

  const activeElement = document.activeElement;
  if (focusScopeSelector) {
    if (!(activeElement instanceof HTMLElement)) return;
    if (!activeElement.closest(focusScopeSelector)) return;
  }

  const selector =
    typeof focusTargetSelector === 'function'
      ? focusTargetSelector(targetTab)
      : focusTargetSelector;
  const targetElement = document.querySelector(selector);

  if (targetElement instanceof HTMLElement) {
    targetElement.focus({ preventScroll: true });
  }
}

/**
 * Attaches a global `keydown` listener that maps keyboard shortcuts to tab IDs.
 *
 * Features:
 *  - Ignores events originating from editable elements.
 *  - Ignores events when any modifier key (Meta / Ctrl / Alt) is held.
 *  - Optionally guards the whole hook behind an `isActive` flag so shortcuts
 *    only fire while the relevant parent page/context is visible.
 *  - Wraps tab changes in a View Transition for smooth directional animation.
 *
 * @param {{
 *   tabIds: string[],
 *   shortcuts: Record<string, string>,
 *   activeTab: string,
 *   setActiveTab: (id: string) => void,
 *   isActive?: boolean,
 *   focusScopeSelector?: string,
 *   focusTargetSelector?: string | ((id: string) => string),
 * }} options
 *
 * @example
 * // Top-level app navigation: Q → R, W → S, E → L
 * useTabNavigation({
 *   tabIds: ['R', 'S', 'L'],
 *   shortcuts: { KeyQ: 'R', KeyW: 'S', KeyE: 'L' },
 *   activeTab,
 *   setActiveTab: setActiveTab,
 * });
 *
 * @example
 * // Log page sub-navigation: A → daily, S → exercise, D → routine
 * // Only active while the Log tab is visible.
 * useTabNavigation({
 *   tabIds: ['daily', 'exercise', 'routine'],
 *   shortcuts: { KeyA: 'daily', KeyS: 'exercise', KeyD: 'routine' },
 *   activeTab: activeView,
 *   setActiveTab: setActiveView,
 *   isActive: activeTab === 'L',
 * });
 */
export function useTabNavigation({
  tabIds,
  shortcuts,
  activeTab,
  setActiveTab,
  isActive = true,
  focusScopeSelector,
  focusTargetSelector,
  disableTransition = false,
}) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event) => {
      // Ignore all shortcuts if a help or auth modal is open.
      if (
        document.querySelector('.help-backdrop') || 
        document.querySelector('.auth-modal-backdrop')
      ) {
        return;
      }

      // Ignore when a modifier key is held.
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      // Ignore when typing in an editable element.
      if (isEditableTarget(event.target)) return;

      const targetTab = shortcuts[event.code];
      if (!targetTab) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      if (targetTab === activeTab) return;

      // Determine direction from tab index order.
      const currentIdx = tabIds.indexOf(activeTab);
      const targetIdx = tabIds.indexOf(targetTab);
      const direction = targetIdx > currentIdx ? 'forward' : 'backward';

      if (disableTransition) {
        setActiveTab(targetTab);
        focusNavigationTarget(targetTab, focusScopeSelector, focusTargetSelector);
      } else {
        startViewTransition(() => {
          setActiveTab(targetTab);
          focusNavigationTarget(targetTab, focusScopeSelector, focusTargetSelector);
        }, direction);
      }
    };

    // Use capture phase so this fires before child handlers.
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [activeTab, focusScopeSelector, focusTargetSelector, isActive, shortcuts, setActiveTab, tabIds, disableTransition]);
}
