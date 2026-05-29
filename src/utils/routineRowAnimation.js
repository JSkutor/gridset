const HIGHLIGHT_SHADOW = '0 12px 28px rgba(0, 0, 0, 0.45), 0 0 14px rgba(122, 162, 247, 0.22)';
const IDLE_SHADOW = '0 0 0px rgba(0,0,0,0)';
const HIGHLIGHT_BACKGROUND = 'rgba(22, 26, 42, 0.88)';
const IDLE_BACKGROUND = 'rgba(22, 26, 42, 0)';
const HOVER_BACKGROUND = 'rgba(255, 255, 255, 0.03)';

export const ROUTINE_ROW_LAYOUT_TRANSITION = {
  type: 'spring',
  stiffness: 350,
  damping: 30,
  layout: { type: 'spring', stiffness: 460, damping: 36 },
};

export function getRoutineRowAnimation(isHighlighted) {
  return {
    scale: isHighlighted ? 1.025 : 1,
    y: isHighlighted ? -2 : 0,
    boxShadow: isHighlighted ? HIGHLIGHT_SHADOW : IDLE_SHADOW,
    zIndex: isHighlighted ? 10 : 1,
    borderColor: isHighlighted ? 'var(--border-focus)' : 'transparent',
    backgroundColor: isHighlighted ? HIGHLIGHT_BACKGROUND : IDLE_BACKGROUND,
  };
}

export function getRoutineRowHoverAnimation(isHighlighted) {
  return isHighlighted ? undefined : { backgroundColor: HOVER_BACKGROUND };
}
