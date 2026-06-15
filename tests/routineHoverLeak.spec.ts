// @ts-nocheck
import { test, expect } from '@playwright/test';

/**
 * Routine page — hover-highlight leak regression tests.
 *
 * Bug: When the user presses an arrow key while the mouse cursor is hovering
 * over a routine row (session row or exercise row), the framer-motion
 * whileHover background colour was left painted on that row even though
 * focus had moved elsewhere.
 *
 * Fix: `body.keyboard-navigating` is added synchronously on keydown.
 * The shared `useIsKeyboardNavigating` hook (MutationObserver) causes every
 * motion.div to set whileHover={undefined}, clearing the painted value.
 * CSS-only hover rules (group bracket, group row) are similarly guarded with
 * `body:not(.keyboard-navigating)`.
 *
 * What we test here:
 *  - After an arrow key press, `body` carries the `keyboard-navigating` class.
 *  - Rows that were hovered before the key press no longer carry the hover
 *    background tint (alpha drops back to baseline level).
 *  - Moving the mouse afterwards removes the class (restores hover behaviour).
 */
test.describe('Routine page — hover highlight should not persist during keyboard navigation', () => {

  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (err) => {
      throw new Error(`[BROWSER ERROR] ${err.message}\n${err.stack}`);
    });

    await page.goto('/');

    // Navigate to the Routine tab
    await page.locator('[data-tab-navigation="main"] [data-tab-id="routine"]').click();
    await expect(page.locator('.routine-grid')).toBeVisible();
  });

  // ─── helpers ─────────────────────────────────────────────────────────────────

  /**
   * Returns the computed backgroundColor of an element.
   * framer-motion writes the hover colour as an inline style, so
   * getComputedStyle captures it correctly.
   */
  async function getBgColor(locator) {
    return locator.evaluate((el) => getComputedStyle(el).backgroundColor);
  }

  /**
   * Extracts the alpha channel from an rgba() string.
   * Returns 0 for "transparent" or unrecognised values.
   */
  function getAlpha(color) {
    const m = color.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/);
    return m ? parseFloat(m[1]) : 0;
  }

  // ─── Session rows ─────────────────────────────────────────────────────────────

  test('session row: hover background disappears when an arrow key is pressed', async ({ page }) => {
    const firstSessionRow = page.locator('.routine-session-row').first();
    await expect(firstSessionRow).toBeVisible();

    // 0. Record idle (pre-hover) background as baseline — mouse is away from the row
    await page.mouse.move(0, 0);
    await page.waitForTimeout(50);
    const bgBaseline = await getBgColor(firstSessionRow);
    const baselineAlpha = getAlpha(bgBaseline);

    // 1. Hover the session row so framer-motion applies the whileHover paint
    await firstSessionRow.hover();
    await page.waitForTimeout(200);
    const bgAfterHover = await getBgColor(firstSessionRow);
    const hoverAlpha = getAlpha(bgAfterHover);

    // If hover didn't raise alpha above baseline (e.g. row is already selected /
    // highlighted), we can't meaningfully test the paint removal, but we still
    // verify the keyboard-navigating class is set correctly.
    if (hoverAlpha <= baselineAlpha + 0.005) {
      await page.keyboard.press('ArrowDown');
      await expect(page.locator('body')).toHaveClass(/keyboard-navigating/);
      return;
    }

    // 2. Press ArrowDown — adds body.keyboard-navigating synchronously
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(150);

    // 3. body must carry the keyboard-navigating class
    await expect(page.locator('body')).toHaveClass(/keyboard-navigating/);

    // 4. The hover tint must be gone — alpha must have dropped back toward baseline
    const bgAfterKey = await getBgColor(firstSessionRow);
    const afterKeyAlpha = getAlpha(bgAfterKey);

    expect(afterKeyAlpha).toBeLessThan(hoverAlpha - 0.005);
  });

  test('session row: keyboard-navigating class is removed when mouse moves again', async ({ page }) => {
    const firstSessionRow = page.locator('.routine-session-row').first();
    await expect(firstSessionRow).toBeVisible();

    // Trigger keyboard-navigating state
    await firstSessionRow.hover();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('body')).toHaveClass(/keyboard-navigating/);

    // Move mouse anywhere to clear the class
    await page.mouse.move(10, 10);
    await page.waitForTimeout(50);

    await expect(page.locator('body')).not.toHaveClass(/keyboard-navigating/);
  });

  // ─── Exercise rows ────────────────────────────────────────────────────────────

  test('exercise row: hover background disappears when an arrow key is pressed', async ({ page }) => {
    const firstExerciseRow = page.locator('.routine-exercise-row').first();
    await expect(firstExerciseRow).toBeVisible();

    // 0. Baseline (pre-hover)
    await page.mouse.move(0, 0);
    await page.waitForTimeout(50);
    const bgBaseline = await getBgColor(firstExerciseRow);
    const baselineAlpha = getAlpha(bgBaseline);

    // 1. Hover the exercise row
    await firstExerciseRow.hover();
    await page.waitForTimeout(200);
    const bgAfterHover = await getBgColor(firstExerciseRow);
    const hoverAlpha = getAlpha(bgAfterHover);

    if (hoverAlpha <= baselineAlpha + 0.005) {
      await page.keyboard.press('ArrowDown');
      await expect(page.locator('body')).toHaveClass(/keyboard-navigating/);
      return;
    }

    // 2. Press ArrowDown
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(150);

    await expect(page.locator('body')).toHaveClass(/keyboard-navigating/);

    // 3. Hover tint must be gone
    const bgAfterKey = await getBgColor(firstExerciseRow);
    const afterKeyAlpha = getAlpha(bgAfterKey);

    expect(afterKeyAlpha).toBeLessThan(hoverAlpha - 0.005);
  });

  // ─── Group bracket (CSS-only hover) ──────────────────────────────────────────

  test('exercise group bracket: hover styles are suppressed during keyboard navigation', async ({ page }) => {
    // The group bracket only appears when at least one group exists.
    // Demo data may or may not have one, so skip gracefully if absent.
    const groupBracket = page.locator('.routine-exercise-group-bracket').first();
    const hasBracket = (await groupBracket.count()) > 0;

    if (!hasBracket) {
      test.skip(true, 'No exercise group brackets in demo data — skipping');
      return;
    }

    await page.mouse.move(0, 0);
    await page.waitForTimeout(50);
    const bgBaseline = await getBgColor(groupBracket);
    const baselineAlpha = getAlpha(bgBaseline);

    await groupBracket.hover();
    await page.waitForTimeout(150);
    const bgAfterHover = await getBgColor(groupBracket);
    const hoverAlpha = getAlpha(bgAfterHover);

    if (hoverAlpha <= baselineAlpha + 0.005) {
      await page.keyboard.press('ArrowDown');
      await expect(page.locator('body')).toHaveClass(/keyboard-navigating/);
      return;
    }

    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);

    await expect(page.locator('body')).toHaveClass(/keyboard-navigating/);

    const bgAfterKey = await getBgColor(groupBracket);
    const afterKeyAlpha = getAlpha(bgAfterKey);

    // CSS hover suppressed by body:not(.keyboard-navigating) — alpha must drop
    expect(afterKeyAlpha).toBeLessThan(hoverAlpha - 0.005);
  });

  // ─── Group row list (CSS-only hover) ─────────────────────────────────────────

  test('exercise group row: hover styles are suppressed during keyboard navigation', async ({ page }) => {
    const groupRow = page.locator('.routine-group-row').first();
    const hasGroupRow = (await groupRow.count()) > 0;

    if (!hasGroupRow) {
      test.skip(true, 'No exercise group rows in demo data — skipping');
      return;
    }

    await page.mouse.move(0, 0);
    await page.waitForTimeout(50);
    const bgBaseline = await getBgColor(groupRow);
    const baselineAlpha = getAlpha(bgBaseline);

    await groupRow.hover();
    await page.waitForTimeout(150);
    const bgAfterHover = await getBgColor(groupRow);
    const hoverAlpha = getAlpha(bgAfterHover);

    if (hoverAlpha <= baselineAlpha + 0.005) {
      await page.keyboard.press('ArrowDown');
      await expect(page.locator('body')).toHaveClass(/keyboard-navigating/);
      return;
    }

    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);

    await expect(page.locator('body')).toHaveClass(/keyboard-navigating/);

    const bgAfterKey = await getBgColor(groupRow);
    const afterKeyAlpha = getAlpha(bgAfterKey);

    expect(afterKeyAlpha).toBeLessThan(hoverAlpha - 0.005);
  });
});
