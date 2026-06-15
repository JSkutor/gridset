// @ts-nocheck
import { afterEach, describe, expect, test, vi } from 'vitest';
import { startViewTransition } from './useViewTransition';

describe('startViewTransition', () => {
  afterEach(() => {
    delete document.startViewTransition;
    vi.restoreAllMocks();
  });

  test('runs the DOM update immediately when the browser API is unavailable', () => {
    const updateDOM = vi.fn();

    startViewTransition(updateDOM, 'forward');

    expect(updateDOM).toHaveBeenCalledTimes(1);
  });

  test('wraps the DOM update with the requested transition direction', () => {
    const updateDOM = vi.fn();
    const start = vi.fn(({ update, types }) => {
      update();
      return { finished: Promise.resolve(), ready: Promise.resolve(), updateCallbackDone: Promise.resolve(), types };
    });
    document.startViewTransition = start;

    startViewTransition(updateDOM, 'backward');

    expect(start).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledWith({
      update: updateDOM,
      types: ['backward'],
    });
    expect(updateDOM).toHaveBeenCalledTimes(1);
  });
});
