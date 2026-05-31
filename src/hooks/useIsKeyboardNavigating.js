import { useEffect, useState } from 'react';

/**
 * Tracks whether body.keyboard-navigating is currently set,
 * shared across all subscribers via a single MutationObserver.
 *
 * This avoids spawning one observer per ExerciseRow instance.
 */
let subscribers = new Set();
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
  const [isKeyboardNav, setIsKeyboardNav] = useState(() => currentValue);

  useEffect(() => {
    // Sync in case the class changed between render and effect
    setIsKeyboardNav(document.body.classList.contains('keyboard-navigating'));
    subscribers.add(setIsKeyboardNav);
    return () => {
      subscribers.delete(setIsKeyboardNav);
    };
  }, []);

  return isKeyboardNav;
}
