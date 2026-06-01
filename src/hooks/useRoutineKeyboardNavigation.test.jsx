import { renderHook } from '@testing-library/react';
import { useRoutineKeyboardNavigation } from './useRoutineKeyboardNavigation.js';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useRoutineKeyboardNavigation', () => {
  let sessionRefs;
  let exerciseRefs;
  let exerciseGroupRefs;
  let settingControlRefs;
  let addSessionBtnRef;
  let addExerciseBtnRef;
  let addGroupBtnRef;

  let reorderSessionsMock;
  let reorderSessionExercisesMock;
  let onSelectSessionMock;
  let setSelectedSessionIdMock;
  let setSelectedExerciseIdMock;
  let setSelectedExerciseGroupIdMock;
  let setIsAddingExerciseRowMock;
  let setFocusedRoutinePanelMock;
  let onFocusExerciseSettingsMock;

  const makeMockDomElement = () => {
    const el = document.createElement('button');
    el.scrollIntoView = vi.fn(); // Stub scrollIntoView which is missing in jsdom
    vi.spyOn(el, 'focus');
    vi.spyOn(el, 'scrollIntoView');
    document.body.appendChild(el);
    return el;
  };

  beforeEach(() => {
    vi.useFakeTimers();

    // Create real DOM elements appended to document.body so document.body.contains returns true
    sessionRefs = {
      current: {
        'session-1': makeMockDomElement(),
        'session-2': makeMockDomElement(),
      },
    };

    exerciseRefs = {
      current: {
        'ex-1': makeMockDomElement(),
        'ex-2': makeMockDomElement(),
      },
    };

    exerciseGroupRefs = {
      current: {
        'group-1': makeMockDomElement(),
      },
    };

    settingControlRefs = {
      current: [
        makeMockDomElement(),
        makeMockDomElement(),
      ],
    };

    addSessionBtnRef = {
      current: makeMockDomElement(),
    };

    addExerciseBtnRef = {
      current: makeMockDomElement(),
    };

    addGroupBtnRef = {
      current: makeMockDomElement(),
    };

    reorderSessionsMock = vi.fn();
    reorderSessionExercisesMock = vi.fn();
    onSelectSessionMock = vi.fn();
    setSelectedSessionIdMock = vi.fn();
    setSelectedExerciseIdMock = vi.fn();
    setSelectedExerciseGroupIdMock = vi.fn();
    setIsAddingExerciseRowMock = vi.fn();
    setFocusedRoutinePanelMock = vi.fn();
    onFocusExerciseSettingsMock = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  test('moving focus within columns via Arrow keys calls .focus() on corresponding element refs', () => {
    const { result } = renderHook(() =>
      useRoutineKeyboardNavigation({
        effectiveRoutineId: 'routine-1',
        effectiveSessionId: 'session-1',
        temporarySessionId: null,
        effectiveRoutineSessions: [{ id: 'session-1' }, { id: 'session-2' }],
        activeSessionExercises: [{ id: 'ex-1' }, { id: 'ex-2' }],
        sessionExercises: [],
        selectedExerciseId: 'ex-1',
        isAddingExerciseRow: false,
        sessionRefs,
        exerciseRefs,
        exerciseGroupRefs,
        settingControlRefs,
        addSessionBtnRef,
        addExerciseBtnRef,
        addGroupBtnRef,
        reorderSessions: reorderSessionsMock,
        reorderSessionExercises: reorderSessionExercisesMock,
        onSelectSession: onSelectSessionMock,
        onFocusExerciseSettings: onFocusExerciseSettingsMock,
        setSelectedSessionId: setSelectedSessionIdMock,
        setSelectedExerciseId: setSelectedExerciseIdMock,
        setSelectedExerciseGroupId: setSelectedExerciseGroupIdMock,
        setIsAddingExerciseRow: setIsAddingExerciseRowMock,
        setFocusedRoutinePanel: setFocusedRoutinePanelMock,
        isReadOnly: false,
      })
    );

    // 1. Session Navigation: ArrowDown from session 0 to session 1
    const sessionEvent = {
      key: 'ArrowDown',
      preventDefault: vi.fn(),
      metaKey: false,
      ctrlKey: false,
    };
    result.current.handleSessionKeyDown(sessionEvent, 0);

    expect(sessionEvent.preventDefault).toHaveBeenCalled();
    expect(onSelectSessionMock).toHaveBeenCalledWith('session-2');
    
    // Flush timers for focusElement setTimeout
    vi.runAllTimers();
    expect(sessionRefs.current['session-2'].focus).toHaveBeenCalled();
    expect(sessionRefs.current['session-2'].scrollIntoView).toHaveBeenCalled();

    // 2. Exercise Navigation: ArrowDown from exercise 0 to exercise 1
    const exerciseEvent = {
      key: 'ArrowDown',
      preventDefault: vi.fn(),
      metaKey: false,
      ctrlKey: false,
    };
    result.current.handleExerciseKeyDown(exerciseEvent, 0);

    expect(exerciseEvent.preventDefault).toHaveBeenCalled();
    expect(setSelectedExerciseIdMock).toHaveBeenCalledWith('ex-2');
    
    vi.runAllTimers();
    expect(exerciseRefs.current['ex-2'].focus).toHaveBeenCalled();

    // 3. Settings Control Navigation: ArrowDown from control 0 to control 1
    const controlEvent = {
      key: 'ArrowDown',
      preventDefault: vi.fn(),
      metaKey: false,
      ctrlKey: false,
    };
    result.current.handleSettingValueKeyDown(controlEvent, 0, vi.fn(), vi.fn());

    expect(controlEvent.preventDefault).toHaveBeenCalled();
    vi.runAllTimers();
    expect(settingControlRefs.current[1].focus).toHaveBeenCalled();
  });

  test('ArrowRight moves from grouped exercises to group brackets and ungrouped exercises to settings', () => {
    const { result } = renderHook(() =>
      useRoutineKeyboardNavigation({
        effectiveRoutineId: 'routine-1',
        effectiveSessionId: 'session-1',
        temporarySessionId: null,
        effectiveRoutineSessions: [{ id: 'session-1' }],
        activeSessionExercises: [
          { id: 'ex-1', session_id: 'session-1', order: 1 },
          { id: 'ex-2', session_id: 'session-1', order: 2 },
        ],
        activeSessionExerciseGroups: [
          { id: 'group-1', session_id: 'session-1', start_order: 1, size: 1 },
        ],
        sessionExercises: [],
        selectedExerciseId: 'ex-1',
        isAddingExerciseRow: false,
        sessionRefs,
        exerciseRefs,
        exerciseGroupRefs,
        settingControlRefs,
        addSessionBtnRef,
        addExerciseBtnRef,
        addGroupBtnRef,
        reorderSessions: reorderSessionsMock,
        reorderSessionExercises: reorderSessionExercisesMock,
        onSelectSession: onSelectSessionMock,
        onFocusExerciseSettings: onFocusExerciseSettingsMock,
        setSelectedSessionId: setSelectedSessionIdMock,
        setSelectedExerciseId: setSelectedExerciseIdMock,
        setSelectedExerciseGroupId: setSelectedExerciseGroupIdMock,
        setIsAddingExerciseRow: setIsAddingExerciseRowMock,
        setFocusedRoutinePanel: setFocusedRoutinePanelMock,
        isReadOnly: false,
      })
    );

    const groupedEvent = {
      key: 'ArrowRight',
      preventDefault: vi.fn(),
    };
    result.current.handleExerciseKeyDown(groupedEvent, 0);

    expect(groupedEvent.preventDefault).toHaveBeenCalled();
    expect(setSelectedExerciseGroupIdMock).toHaveBeenCalledWith('group-1');
    vi.runOnlyPendingTimers();
    expect(exerciseGroupRefs.current['group-1'].focus).toHaveBeenCalled();
    expect(onFocusExerciseSettingsMock).not.toHaveBeenCalled();

    const ungroupedEvent = {
      key: 'ArrowRight',
      preventDefault: vi.fn(),
    };
    result.current.handleExerciseKeyDown(ungroupedEvent, 1);

    expect(ungroupedEvent.preventDefault).toHaveBeenCalled();
    expect(onFocusExerciseSettingsMock).toHaveBeenCalled();
    vi.runOnlyPendingTimers();
    expect(settingControlRefs.current[0].focus).toHaveBeenCalled();
  });

  test('key combos with Ctrl/Meta (Meta + ArrowDown, Meta + ArrowUp) trigger callbacks reorderSessions and reorderSessionExercises with spied array swaps', () => {
    const { result } = renderHook(() =>
      useRoutineKeyboardNavigation({
        effectiveRoutineId: 'routine-1',
        effectiveSessionId: 'session-1',
        temporarySessionId: null,
        effectiveRoutineSessions: [{ id: 'session-1' }, { id: 'session-2' }],
        activeSessionExercises: [{ id: 'ex-1' }, { id: 'ex-2' }],
        sessionExercises: [],
        selectedExerciseId: 'ex-1',
        isAddingExerciseRow: false,
        sessionRefs,
        exerciseRefs,
        settingControlRefs,
        addSessionBtnRef,
        addExerciseBtnRef,
        reorderSessions: reorderSessionsMock,
        reorderSessionExercises: reorderSessionExercisesMock,
        onSelectSession: onSelectSessionMock,
        setSelectedSessionId: setSelectedSessionIdMock,
        setSelectedExerciseId: setSelectedExerciseIdMock,
        setIsAddingExerciseRow: setIsAddingExerciseRowMock,
        setFocusedRoutinePanel: setFocusedRoutinePanelMock,
        isReadOnly: false,
      })
    );

    // Reorder Sessions: Meta + ArrowDown on session index 0
    const sessionEvent = {
      key: 'ArrowDown',
      preventDefault: vi.fn(),
      metaKey: true,
      ctrlKey: false,
    };
    result.current.handleSessionKeyDown(sessionEvent, 0);

    expect(sessionEvent.preventDefault).toHaveBeenCalled();
    expect(reorderSessionsMock).toHaveBeenCalledWith('routine-1', ['session-2', 'session-1']);

    // Reorder Exercises: Meta + ArrowDown on exercise index 0
    const exerciseEvent = {
      key: 'ArrowDown',
      preventDefault: vi.fn(),
      metaKey: true,
      ctrlKey: false,
    };
    result.current.handleExerciseKeyDown(exerciseEvent, 0);

    expect(exerciseEvent.preventDefault).toHaveBeenCalled();
    expect(reorderSessionExercisesMock).toHaveBeenCalledWith('session-1', ['ex-2', 'ex-1']);
  });

  test('focusFirstSessionFirstExercise focuses the first exercise of the active session, not always session 1', () => {
    exerciseRefs.current['ex-3'] = makeMockDomElement();

    const { result } = renderHook(() =>
      useRoutineKeyboardNavigation({
        effectiveRoutineId: 'routine-1',
        effectiveSessionId: 'session-2',
        temporarySessionId: null,
        effectiveRoutineSessions: [{ id: 'session-1' }, { id: 'session-2' }],
        activeSessionExercises: [{ id: 'ex-3' }],
        sessionExercises: [
          { id: 'ex-1', session_id: 'session-1', order: 1 },
          { id: 'ex-2', session_id: 'session-1', order: 2 },
          { id: 'ex-3', session_id: 'session-2', order: 1 },
        ],
        selectedExerciseId: null,
        isAddingExerciseRow: false,
        sessionRefs,
        exerciseRefs,
        exerciseGroupRefs,
        settingControlRefs,
        addSessionBtnRef,
        addExerciseBtnRef,
        addGroupBtnRef,
        reorderSessions: reorderSessionsMock,
        reorderSessionExercises: reorderSessionExercisesMock,
        onSelectSession: onSelectSessionMock,
        onFocusExerciseSettings: onFocusExerciseSettingsMock,
        setSelectedSessionId: setSelectedSessionIdMock,
        setSelectedExerciseId: setSelectedExerciseIdMock,
        setSelectedExerciseGroupId: setSelectedExerciseGroupIdMock,
        setIsAddingExerciseRow: setIsAddingExerciseRowMock,
        setFocusedRoutinePanel: setFocusedRoutinePanelMock,
        isReadOnly: false,
      })
    );

    result.current.focusFirstSessionFirstExercise();

    expect(setSelectedSessionIdMock).toHaveBeenCalledWith('session-2');
    expect(setSelectedExerciseIdMock).toHaveBeenCalledWith(null);
    vi.runAllTimers();
    expect(setSelectedExerciseIdMock).toHaveBeenCalledWith('ex-3');
    expect(exerciseRefs.current['ex-3'].focus).toHaveBeenCalled();
    expect(exerciseRefs.current['ex-1'].focus).not.toHaveBeenCalled();
  });

  test('reading only mode (isReadOnly = true) correctly skips/blocks reordering callbacks on ArrowDown/Up', () => {
    const { result } = renderHook(() =>
      useRoutineKeyboardNavigation({
        effectiveRoutineId: 'routine-1',
        effectiveSessionId: 'session-1',
        temporarySessionId: null,
        effectiveRoutineSessions: [{ id: 'session-1' }, { id: 'session-2' }],
        activeSessionExercises: [{ id: 'ex-1' }, { id: 'ex-2' }],
        sessionExercises: [],
        selectedExerciseId: 'ex-1',
        isAddingExerciseRow: false,
        sessionRefs,
        exerciseRefs,
        settingControlRefs,
        addSessionBtnRef,
        addExerciseBtnRef,
        reorderSessions: reorderSessionsMock,
        reorderSessionExercises: reorderSessionExercisesMock,
        onSelectSession: onSelectSessionMock,
        setSelectedSessionId: setSelectedSessionIdMock,
        setSelectedExerciseId: setSelectedExerciseIdMock,
        setIsAddingExerciseRow: setIsAddingExerciseRowMock,
        setFocusedRoutinePanel: setFocusedRoutinePanelMock,
        isReadOnly: true, // Read-only mode active
      })
    );

    // Try reordering sessions: Meta + ArrowDown
    const sessionEvent = {
      key: 'ArrowDown',
      preventDefault: vi.fn(),
      metaKey: true,
      ctrlKey: false,
    };
    result.current.handleSessionKeyDown(sessionEvent, 0);
    expect(reorderSessionsMock).not.toHaveBeenCalled();

    // Try reordering exercises: Meta + ArrowDown
    const exerciseEvent = {
      key: 'ArrowDown',
      preventDefault: vi.fn(),
      metaKey: true,
      ctrlKey: false,
    };
    result.current.handleExerciseKeyDown(exerciseEvent, 0);
    expect(reorderSessionExercisesMock).not.toHaveBeenCalled();
  });
});
