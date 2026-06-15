// @ts-nocheck
import { describe, test, expect } from 'vitest';
import { scrollElementWithinContainer } from './focusUtils.ts';

function mockRect({ top, bottom, left = 0, right = 100, width = 100, height = bottom - top }) {
  return {
    top,
    bottom,
    left,
    right,
    width,
    height,
    x: left,
    y: top,
    toJSON() {
      return {};
    },
  };
}

describe('scrollElementWithinContainer', () => {
  test('returns false when element or container is missing', () => {
    expect(scrollElementWithinContainer(null, null)).toBe(false);
  });

  test('returns false when element is already fully visible', () => {
    const container = {
      scrollTop: 100,
      getBoundingClientRect: () => mockRect({ top: 0, bottom: 400 }),
      scrollTo: () => {},
    };
    const element = {
      getBoundingClientRect: () => mockRect({ top: 50, bottom: 80 }),
    };

    expect(scrollElementWithinContainer(element, container)).toBe(false);
  });

  test('scrolls down when element extends below the container', () => {
    let scrolledTo = null;
    const container = {
      scrollTop: 200,
      getBoundingClientRect: () => mockRect({ top: 0, bottom: 400 }),
      scrollTo: ({ top }) => {
        scrolledTo = top;
      },
    };
    const element = {
      getBoundingClientRect: () => mockRect({ top: 350, bottom: 430 }),
    };

    expect(scrollElementWithinContainer(element, container, { padding: 0 })).toBe(true);
    expect(scrolledTo).toBe(230);
  });

  test('scrolls up when element extends above the container', () => {
    let scrolledTo = null;
    const container = {
      scrollTop: 200,
      getBoundingClientRect: () => mockRect({ top: 100, bottom: 500 }),
      scrollTo: ({ top }) => {
        scrolledTo = top;
      },
    };
    const element = {
      getBoundingClientRect: () => mockRect({ top: 60, bottom: 90 }),
    };

    expect(scrollElementWithinContainer(element, container, { padding: 0 })).toBe(true);
    expect(scrolledTo).toBe(160);
  });
});
