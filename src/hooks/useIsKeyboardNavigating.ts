import { useSyncExternalStore } from 'react';

/**
 * Tracks whether body.keyboard-navigating is currently set,
 * shared across all subscribers via a single MutationObserver.
 *
 * This avoids spawning one observer per ExerciseRow instance.
 */
type KeyboardNavigationSubscriber = () => void;

const subscribers = new Set<KeyboardNavigationSubscriber>();
let currentValue = document.body.classList.contains('keyboard-navigating');

const observer = new MutationObserver(() => {
  const next = document.body.classList.contains('keyboard-navigating');
  if (next !== currentValue) {
    currentValue = next;
    subscribers.forEach((notify) => notify());
  }
});

observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

export function useIsKeyboardNavigating(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      subscribers.add(onStoreChange);
      return () => {
        subscribers.delete(onStoreChange);
      };
    },
    () => currentValue,
    () => false,
  );
}
