import { vi } from 'vitest';

const canvasContextMock = {
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  restore: vi.fn(),
  rotate: vi.fn(),
  save: vi.fn(),
  scale: vi.fn(),
  translate: vi.fn(),
};

if (typeof HTMLCanvasElement !== 'undefined') {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: vi.fn((contextType) => {
      if (contextType === '2d') {
        return canvasContextMock;
      }
      return null;
    }),
  });
}
