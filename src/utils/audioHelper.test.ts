// @ts-nocheck
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { playTimerNotificationSound } from "./audioHelper";

describe("audioHelper", () => {
  beforeEach(() => {
    vi.stubGlobal("AudioContext", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("plays sound if AudioContext is available", () => {
    const startSpy = vi.fn();
    const stopSpy = vi.fn();
    const connectSpy = vi.fn();
    const setValueAtTimeSpy = vi.fn();
    const linearRampToValueAtTimeSpy = vi.fn();
    const exponentialRampToValueAtTimeSpy = vi.fn();

    const mockOscillator = {
      type: "sine",
      frequency: {
        setValueAtTime: setValueAtTimeSpy,
      },
      connect: connectSpy,
      start: startSpy,
      stop: stopSpy,
    };

    const mockGain = {
      gain: {
        setValueAtTime: setValueAtTimeSpy,
        linearRampToValueAtTime: linearRampToValueAtTimeSpy,
        exponentialRampToValueAtTime: exponentialRampToValueAtTimeSpy,
      },
      connect: connectSpy,
    };

    const mockAudioContext = vi.fn().mockImplementation(() => ({
      currentTime: 100,
      destination: {},
      createOscillator: () => mockOscillator,
      createGain: () => mockGain,
    }));

    vi.stubGlobal("AudioContext", mockAudioContext);

    playTimerNotificationSound();

    expect(mockAudioContext).toHaveBeenCalled();
    expect(startSpy).toHaveBeenCalledTimes(2);
    expect(stopSpy).toHaveBeenCalledTimes(2);
  });
});
