/**
 * DOM 요소에 포커스 + 스크롤을 지연 실행하는 공통 헬퍼.
 * delay가 0이면 즉시 setTimeout(fn, 0) 큐에 등록된다.
 */
export function focusElement(element, delay = 0) {
  setTimeout(() => {
    element?.focus();
    element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, delay);
}

/**
 * 이미 setTimeout 콜백 안에서 호출할 때 사용하는 동기 버전.
 * focus + scrollIntoView를 즉시 실행한다.
 */
export function focusElementSync(element) {
  element?.focus();
  element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
