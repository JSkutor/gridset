export type ScrollWithinContainerOptions = {
  padding?: number;
  behavior?: ScrollBehavior;
};

/**
 * Scrolls a scrollable container by the minimum amount needed to reveal `element`.
 * Returns true when a scroll was applied.
 */
export function scrollElementWithinContainer(
  element: HTMLElement | null | undefined,
  container: HTMLElement | null | undefined,
  { padding = 8, behavior = 'smooth' }: ScrollWithinContainerOptions = {},
): boolean {
  if (!element || !container) return false;

  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const visibleTop = containerRect.top + padding;
  const visibleBottom = containerRect.bottom - padding;

  let scrollDelta = 0;

  if (elementRect.top < visibleTop) {
    scrollDelta = elementRect.top - visibleTop;
  } else if (elementRect.bottom > visibleBottom) {
    scrollDelta = elementRect.bottom - visibleBottom;
  }

  if (scrollDelta === 0) return false;

  container.scrollTo({
    top: container.scrollTop + scrollDelta,
    behavior,
  });
  return true;
}

/**
 * DOM 요소에 포커스 + 스크롤을 지연 실행하는 공통 헬퍼.
 * delay가 0이면 즉시 setTimeout(fn, 0) 큐에 등록된다.
 */
export function focusElement(element: HTMLElement | null | undefined, delay = 0): void {
  setTimeout(() => {
    element?.focus();
    element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, delay);
}

/**
 * 이미 setTimeout 콜백 안에서 호출할 때 사용하는 동기 버전.
 * focus + scrollIntoView를 즉시 실행한다.
 */
export function focusElementSync(element: HTMLElement | null | undefined): void {
  element?.focus();
  element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
