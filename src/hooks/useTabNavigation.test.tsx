// @ts-nocheck
import React, { useState } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { APP_NAV_TAB, APP_NAV_SHORTCUTS, APP_NAV_TAB_IDS } from '../constants/appNavTabs';
import { useTabNavigation } from './useTabNavigation.js';

const FOCUS_SCOPE_SELECTOR = '[data-tab-navigation="mock"]';
const getFocusTargetSelector = (tabId) =>
  `${FOCUS_SCOPE_SELECTOR} [data-tab-id="${tabId}"]`;

function TabNavigationMock() {
  const [activeTab, setActiveTab] = useState(APP_NAV_TAB.ROUTINE);

  useTabNavigation({
    tabIds: APP_NAV_TAB_IDS,
    shortcuts: APP_NAV_SHORTCUTS,
    activeTab,
    setActiveTab,
    focusScopeSelector: FOCUS_SCOPE_SELECTOR,
    focusTargetSelector: getFocusTargetSelector,
  });

  return (
    <div>
      <div data-testid="active-tab">{activeTab}</div>
      <button type="button" data-testid="outside-button">
        Outside
      </button>
      <input data-testid="editable" aria-label="editable" />
      <nav data-tab-navigation="mock">
        {APP_NAV_TAB_IDS.map((tabId) => (
          <button
            key={tabId}
            type="button"
            data-tab-id={tabId}
            onClick={() => setActiveTab(tabId)}
          >
            {tabId}
          </button>
        ))}
      </nav>
    </div>
  );
}

describe('useTabNavigation', () => {
  test('moves focus to the shortcut target when focus starts inside the same navigation', () => {
    render(React.createElement(TabNavigationMock));

    const routineTab = screen.getByRole('button', { name: APP_NAV_TAB.ROUTINE });
    const setTab = screen.getByRole('button', { name: APP_NAV_TAB.SET });

    routineTab.focus();
    expect(document.activeElement).toBe(routineTab);

    fireEvent.keyDown(routineTab, { code: 'KeyW', key: 'w' });

    expect(screen.getByTestId('active-tab').textContent).toBe(APP_NAV_TAB.SET);
    expect(document.activeElement).toBe(setTab);
  });

  test('does not steal focus from outside the navigation when using shortcuts', () => {
    render(React.createElement(TabNavigationMock));

    const outsideButton = screen.getByTestId('outside-button');

    outsideButton.focus();
    fireEvent.keyDown(outsideButton, { code: 'KeyE', key: 'e' });

    expect(screen.getByTestId('active-tab').textContent).toBe(APP_NAV_TAB.LOG);
    expect(document.activeElement).toBe(outsideButton);
  });

  test('ignores shortcuts while typing in editable fields', () => {
    const stopImmediatePropagation = vi.fn();
    render(React.createElement(TabNavigationMock));

    const input = screen.getByTestId('editable');

    input.focus();
    fireEvent.keyDown(input, {
      code: 'KeyW',
      key: 'w',
      stopImmediatePropagation,
    });

    expect(screen.getByTestId('active-tab').textContent).toBe(APP_NAV_TAB.ROUTINE);
    expect(stopImmediatePropagation).not.toHaveBeenCalled();
  });

  test('ignores shortcut when the target tab is already active', () => {
    const stopImmediatePropagationSpy = vi.spyOn(Event.prototype, 'stopImmediatePropagation');
    const preventDefaultSpy = vi.spyOn(Event.prototype, 'preventDefault');
    
    render(React.createElement(TabNavigationMock));

    const routineTab = screen.getByRole('button', { name: APP_NAV_TAB.ROUTINE });
    routineTab.focus();

    fireEvent.keyDown(routineTab, {
      code: 'KeyQ',
      key: 'q',
    });

    expect(screen.getByTestId('active-tab').textContent).toBe(APP_NAV_TAB.ROUTINE);
    
    expect(stopImmediatePropagationSpy).toHaveBeenCalled();
    expect(preventDefaultSpy).toHaveBeenCalled();

    stopImmediatePropagationSpy.mockRestore();
    preventDefaultSpy.mockRestore();
  });
});
