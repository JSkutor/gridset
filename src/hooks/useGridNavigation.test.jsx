// eslint-disable-next-line no-unused-vars
import React from 'react';
import { test, describe, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useGridNavigation, resolveBlockJumpTarget } from './useGridNavigation.js';

// Mock component to bind the hook
function GridMock({ totalRows, shouldSkipCellForTab, resolveBlockJump, onFocusCell }) {
  const { getCellRef, handleKeyDown, focusLastOrFirst, isKeyboardActive, recordFocus } = useGridNavigation(
    totalRows,
    { shouldSkipCellForTab, resolveBlockJump, onFocusCell },
  );

  return (
    <div>
      <div data-testid="keyboard-status">{isKeyboardActive ? 'active' : 'inactive'}</div>
      <button data-testid="focus-shortcut" onClick={focusLastOrFirst}>C</button>
      <table>
        <tbody>
          {Array.from({ length: totalRows }, (_, rowIndex) => (
            <tr key={rowIndex}>
              <td>
                <input
                  data-testid={`input-${rowIndex}-0`}
                  ref={getCellRef(rowIndex, 0)}
                  onKeyDown={(e) => handleKeyDown(e, rowIndex, 0)}
                  onFocus={() => recordFocus(rowIndex, 0)}
                  defaultValue=""
                />
              </td>
              <td>
                <input
                  data-testid={`input-${rowIndex}-1`}
                  ref={getCellRef(rowIndex, 1)}
                  onKeyDown={(e) => handleKeyDown(e, rowIndex, 1)}
                  onFocus={() => recordFocus(rowIndex, 1)}
                  defaultValue=""
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

describe('useGridNavigation Keyboard Navigation Hook', () => {
  test('initial render registers DOM elements in refs and allows normal focus', async () => {
    render(<GridMock totalRows={3} />);

    const cell00 = screen.getByTestId('input-0-0');
    const cell01 = screen.getByTestId('input-0-1');

    cell00.focus();
    expect(document.activeElement).toBe(cell00);

    cell01.focus();
    expect(document.activeElement).toBe(cell01);
  });

  test('ArrowDown and Enter keys move focus down to the next row', async () => {
    const user = userEvent.setup();
    render(<GridMock totalRows={3} />);

    const cell00 = screen.getByTestId('input-0-0');
    const cell10 = screen.getByTestId('input-1-0');
    const cell20 = screen.getByTestId('input-2-0');

    cell00.focus();
    expect(document.activeElement).toBe(cell00);

    // Press ArrowDown
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(cell10);

    // Press Enter
    await user.keyboard('{Enter}');
    expect(document.activeElement).toBe(cell20);
  });

  test('ArrowUp key moves focus up to the previous row', async () => {
    const user = userEvent.setup();
    render(<GridMock totalRows={3} />);

    const cell10 = screen.getByTestId('input-1-0');
    const cell00 = screen.getByTestId('input-0-0');

    cell10.focus();
    await user.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(cell00);
  });

  test('Tab key wraps within row or shifts to the next row first cell', async () => {
    const user = userEvent.setup();
    render(<GridMock totalRows={3} />);

    const cell00 = screen.getByTestId('input-0-0');
    const cell01 = screen.getByTestId('input-0-1');
    const cell10 = screen.getByTestId('input-1-0');

    cell00.focus();
    await user.keyboard('{Tab}');
    expect(document.activeElement).toBe(cell01);

    await user.keyboard('{Tab}');
    expect(document.activeElement).toBe(cell10);
  });

  test('Shift+Tab moves backward across cells', async () => {
    const user = userEvent.setup();
    render(<GridMock totalRows={3} />);

    const cell10 = screen.getByTestId('input-1-0');
    const cell01 = screen.getByTestId('input-0-1');
    const cell00 = screen.getByTestId('input-0-0');

    cell10.focus();
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toBe(cell01);

    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toBe(cell00);
  });

  test('Tab on final cell does not append or leave the grid', async () => {
    const user = userEvent.setup();
    render(<GridMock totalRows={2} />);

    const lastCell = screen.getByTestId('input-1-1');

    lastCell.focus();
    await user.keyboard('{Tab}');

    expect(document.activeElement).toBe(lastCell);
  });

  test('LeftArrow/RightArrow wrap when cursor is at edge', async () => {
    const user = userEvent.setup();
    render(<GridMock totalRows={2} />);

    const cell00 = screen.getByTestId('input-0-0');
    const cell01 = screen.getByTestId('input-0-1');
    const cell10 = screen.getByTestId('input-1-0');

    cell00.focus();
    // In empty inputs, selectionStart is 0, so ArrowLeft wraps to previous cell if it exists.
    // cell00 has no previous cell, but ArrowRight wraps to next cell cell01 (selectionEnd === value.length)
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(cell01);

    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(cell10);

    // ArrowLeft wraps back to cell01 from cell10 (cursor at 0)
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(cell01);
  });

  test('focusLastOrFirst shortcut restores focus to last active cell', async () => {
    const user = userEvent.setup();
    render(<GridMock totalRows={3} />);

    const cell00 = screen.getByTestId('input-0-0');
    const cell10 = screen.getByTestId('input-1-0');
    const cell11 = screen.getByTestId('input-1-1');
    const focusBtn = screen.getByTestId('focus-shortcut');

    // Focus cell00 first
    cell00.focus();
    expect(document.activeElement).toBe(cell00);

    // Navigate to cell10 via ArrowDown
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(cell10);

    // Navigate to cell11 via Tab
    await user.keyboard('{Tab}');
    expect(document.activeElement).toBe(cell11);

    // Focus away (e.g. to the shortcut button)
    focusBtn.focus();
    expect(document.activeElement).toBe(focusBtn);

    // Click focusBtn to trigger focusLastOrFirst
    await user.click(focusBtn);
    expect(document.activeElement).toBe(cell11);
  });

  test('Tab skips cells marked by shouldSkipCellForTab', async () => {
    const user = userEvent.setup();
    const shouldSkipCellForTab = (_rowIndex, colIndex) => colIndex === 0;

    render(<GridMock totalRows={2} shouldSkipCellForTab={shouldSkipCellForTab} />);

    const cell01 = screen.getByTestId('input-0-1');
    const cell11 = screen.getByTestId('input-1-1');

    cell01.focus();
    await user.keyboard('{Tab}');
    expect(document.activeElement).toBe(cell11);
  });

  test('Shift+Tab skips cells marked by shouldSkipCellForTab', async () => {
    const user = userEvent.setup();
    const shouldSkipCellForTab = (_rowIndex, colIndex) => colIndex === 0;

    render(<GridMock totalRows={2} shouldSkipCellForTab={shouldSkipCellForTab} />);

    const cell11 = screen.getByTestId('input-1-1');
    const cell01 = screen.getByTestId('input-0-1');

    cell11.focus();
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toBe(cell01);
  });

  test('ArrowDown still focuses skipped Tab cells in the same column', async () => {
    const user = userEvent.setup();
    const shouldSkipCellForTab = (_rowIndex, colIndex) => colIndex === 0;

    render(<GridMock totalRows={2} shouldSkipCellForTab={shouldSkipCellForTab} />);

    const cell00 = screen.getByTestId('input-0-0');
    const cell10 = screen.getByTestId('input-1-0');

    cell00.focus();
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(cell10);
  });

  test('Meta+ArrowDown jumps to the last row of the exercise block', async () => {
    const user = userEvent.setup();
    const resolveBlockJump = (rowIndex, colIndex, direction) =>
      resolveBlockJumpTarget(rowIndex, colIndex, direction, { start: 0, end: 2 });

    render(<GridMock totalRows={4} resolveBlockJump={resolveBlockJump} />);

    const cell00 = screen.getByTestId('input-0-0');
    const cell20 = screen.getByTestId('input-2-0');

    cell00.focus();
    await user.keyboard('{Meta>}{ArrowDown}{/Meta}');
    expect(document.activeElement).toBe(cell20);
  });

  test('Meta+ArrowUp jumps to the first row of the exercise block', async () => {
    const user = userEvent.setup();
    const resolveBlockJump = (rowIndex, colIndex, direction) =>
      resolveBlockJumpTarget(rowIndex, colIndex, direction, { start: 1, end: 3 });

    render(<GridMock totalRows={4} resolveBlockJump={resolveBlockJump} />);

    const cell30 = screen.getByTestId('input-3-1');
    const cell10 = screen.getByTestId('input-1-1');

    cell30.focus();
    await user.keyboard('{Meta>}{ArrowUp}{/Meta}');
    expect(document.activeElement).toBe(cell10);
  });

  test('Meta+ArrowDown at block bottom moves to the next row like ArrowDown', async () => {
    const user = userEvent.setup();
    const resolveBlockJump = (rowIndex, colIndex, direction) =>
      resolveBlockJumpTarget(rowIndex, colIndex, direction, { start: 0, end: 2 });

    render(<GridMock totalRows={4} resolveBlockJump={resolveBlockJump} />);

    const cell20 = screen.getByTestId('input-2-0');
    const cell30 = screen.getByTestId('input-3-0');

    cell20.focus();
    await user.keyboard('{Meta>}{ArrowDown}{/Meta}');
    expect(document.activeElement).toBe(cell30);
  });

  test('Meta+ArrowUp at block top moves to the previous row like ArrowUp', async () => {
    const user = userEvent.setup();
    const resolveBlockJump = (rowIndex, colIndex, direction) =>
      resolveBlockJumpTarget(rowIndex, colIndex, direction, { start: 1, end: 3 });

    render(<GridMock totalRows={4} resolveBlockJump={resolveBlockJump} />);

    const cell10 = screen.getByTestId('input-1-0');
    const cell00 = screen.getByTestId('input-0-0');

    cell10.focus();
    await user.keyboard('{Meta>}{ArrowUp}{/Meta}');
    expect(document.activeElement).toBe(cell00);
  });

  test('Meta+ArrowLeft jumps to the leftmost column when not already there', async () => {
    const user = userEvent.setup();
    const resolveBlockJump = (rowIndex, colIndex, direction) =>
      resolveBlockJumpTarget(rowIndex, colIndex, direction, { start: 0, end: 2 });

    render(<GridMock totalRows={3} resolveBlockJump={resolveBlockJump} />);

    const cell01 = screen.getByTestId('input-1-1');
    const cell10 = screen.getByTestId('input-1-0');

    cell01.focus();
    await user.keyboard('{Meta>}{ArrowLeft}{/Meta}');
    expect(document.activeElement).toBe(cell10);
  });

  test('Meta+ArrowRight at row right edge moves to the next cell like ArrowRight', async () => {
    const user = userEvent.setup();
    const resolveBlockJump = (rowIndex, colIndex, direction) =>
      resolveBlockJumpTarget(rowIndex, colIndex, direction, { start: 0, end: 2 });

    render(<GridMock totalRows={3} resolveBlockJump={resolveBlockJump} />);

    const cell01 = screen.getByTestId('input-1-1');
    const cell20 = screen.getByTestId('input-2-0');

    cell01.focus();
    await user.keyboard('{Meta>}{ArrowRight}{/Meta}');
    expect(document.activeElement).toBe(cell20);
  });

  test('resolveBlockJumpTarget skips disabled weight column on vertical jumps', () => {
    const shouldSkipCellForTab = (_rowIndex, colIndex) => colIndex === 0;

    expect(
      resolveBlockJumpTarget(2, 0, 'up', { start: 0, end: 2 }, shouldSkipCellForTab),
    ).toEqual({ row: 0, col: 1 });

    expect(
      resolveBlockJumpTarget(0, 1, 'down', { start: 0, end: 2 }, shouldSkipCellForTab),
    ).toEqual({ row: 2, col: 1 });
  });

  test('focusLastOrFirst remembers cells focused without keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<GridMock totalRows={3} />);

    const cell10 = screen.getByTestId('input-1-0');
    const focusBtn = screen.getByTestId('focus-shortcut');

    cell10.focus();
    expect(document.activeElement).toBe(cell10);

    focusBtn.focus();
    expect(document.activeElement).toBe(focusBtn);

    await user.click(focusBtn);
    expect(document.activeElement).toBe(cell10);
  });
});
