type ViewTransitionDirection = 'forward' | 'backward';

type DocumentWithViewTransition = Document & {
  startViewTransition?: (options: {
    update: () => void;
    types: ViewTransitionDirection[];
  }) => unknown;
};

/**
 * Wraps a DOM update callback in a View Transition for smooth directional
 * page transitions. Falls back to an immediate call when the API is
 * unavailable, so it is safe to call unconditionally.
 */
export function startViewTransition(
  updateDOM: () => void,
  direction: ViewTransitionDirection,
): void {
  const transitionDocument = document as DocumentWithViewTransition;
  if (!transitionDocument.startViewTransition) {
    updateDOM();
    return;
  }

  transitionDocument.startViewTransition({
    update: updateDOM,
    types: [direction],
  });
}
