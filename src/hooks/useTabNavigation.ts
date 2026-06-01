import { useEffect } from 'react';
import { startViewTransition } from './useViewTransition';

type TabNavigationOptions<TTabId extends string> = {
  tabIds: TTabId[];
  shortcuts: Record<string, TTabId>;
  activeTab: TTabId;
  setActiveTab: (id: TTabId) => void;
  isActive?: boolean;
  focusScopeSelector?: string;
  focusTargetSelector?: string | ((id: TTabId) => string);
  disableTransition?: boolean;
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    target.isContentEditable ||
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select'
  );
}

function focusNavigationTarget<TTabId extends string>(
  targetTab: TTabId,
  focusScopeSelector: string | undefined,
  focusTargetSelector: string | ((id: TTabId) => string) | undefined,
): void {
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
 * @example
 * // Top-level app navigation: Q → routine, W → set, E → log
 * useTabNavigation({
 *   tabIds: APP_NAV_TAB_IDS,
 *   shortcuts: APP_NAV_SHORTCUTS,
 *   activeTab,
 *   setActiveTab: setActiveTab,
 * });
 *
 * @example
 * // Log page sub-navigation: A → daily, S → exercise, D → routine
 * // Only active while the Log page is visible.
 * useTabNavigation({
 *   tabIds: ['daily', 'exercise', 'routine'],
 *   shortcuts: { KeyA: 'daily', KeyS: 'exercise', KeyD: 'routine' },
 *   activeTab: activeView,
 *   setActiveTab: setActiveView,
 *   isActive: activeTab === APP_NAV_TAB.LOG,
 * });
 */
export function useTabNavigation<TTabId extends string>({
  tabIds,
  shortcuts,
  activeTab,
  setActiveTab,
  isActive = true,
  focusScopeSelector,
  focusTargetSelector,
  disableTransition = false,
}: TabNavigationOptions<TTabId>): void {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
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
