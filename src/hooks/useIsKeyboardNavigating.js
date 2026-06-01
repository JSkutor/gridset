import { useSyncExternalStore } from 'react';

/**
 * Tracks whether body.keyboard-navigating is currently set,
 * shared across all subscribers via a single MutationObserver.
 *
 * This avoids spawning one observer per ExerciseRow instance.
 */
const subscribers = new Set();
let currentValue = document.body.classList.contains('keyboard-navigating');

const observer = new MutationObserver(() => {
  const next = document.body.classList.contains('keyboard-navigating');
  if (next !== currentValue) {
    currentValue = next;
    subscribers.forEach((fn) => fn(next));
  }
});

observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

export function useIsKeyboardNavigating() {
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
