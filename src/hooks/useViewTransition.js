/**
 * Wraps a DOM update callback in a View Transition for smooth directional
 * page transitions.  Falls back to an immediate call when the API is
 * unavailable, so it is safe to call unconditionally.
 *
 * @param {() => void} updateDOM  — callback that mutates React state (e.g. setActiveTab)
 * @param {'forward' | 'backward'} direction — visual slide direction
 */
export function startViewTransition(updateDOM, direction) {
  if (!document.startViewTransition) {
    updateDOM();
    return;
  }

  document.startViewTransition({
    update: updateDOM,
    types: [direction],
  });
}
