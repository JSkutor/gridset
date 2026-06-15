// @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe('Gridset Navigation & Rendering E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // 1. Hook up to the page error event to catch ANY uncaught JavaScript exceptions.
    // If a component crashes or throws an exception, the test will fail immediately.
    page.on('pageerror', (exception) => {
      throw new Error(`[BROWSER CRASH DETECTED] Uncaught exception: ${exception.message}\nStack:\n${exception.stack}`);
    });
  });

  test('should navigate between Routine, Set, and Log pages using tabs without runtime errors or blank screens', async ({ page }) => {
    // 2. Open the homepage (the base URL is configured as http://localhost:5173 in playwright.config.js)
    await page.goto('/');

    // 3. Confirm that the main navigation container is visible.
    const mainNav = page.locator('[data-tab-navigation="main"]');
    await expect(mainNav).toBeVisible();

    // 4. By default, the app active tab is "set" (Set page).
    // Let's assert that the characteristic Set page elements exist and are painted.
    const workoutCompleteButton = page.locator('button:has-text("운동 완료")');
    await expect(workoutCompleteButton).toBeVisible();

    // 5. Navigate to the Routine tab by clicking the button.
    const routineTabButton = page.locator('[data-tab-navigation="main"] [data-tab-id="routine"]');
    await routineTabButton.click();

    await expect(routineTabButton).toHaveAttribute('data-tab-id', 'routine');
    
    // Assert that RoutineDetail's layout grid is visible.
    const routineGrid = page.locator('.routine-grid');
    await expect(routineGrid).toBeVisible();

    // 6. Navigate to the Log tab by clicking the button.
    const logTabButton = page.locator('[data-tab-navigation="main"] [data-tab-id="log"]');
    await logTabButton.click();

    await expect(logTabButton).toHaveAttribute('data-tab-id', 'log');

    // Assert that Log page sidebar/layout is loaded.
    const logSidebar = page.locator('[data-tab-navigation="log"]');
    await expect(logSidebar).toBeVisible();
    await expect(page.locator('text=일일')).toBeVisible();
  });

  test('should support keyboard navigation shortcuts (Q, W, E) for seamless tab switching', async ({ page }) => {
    await page.goto('/');

    // Make sure we started on the Set page (default)
    const workoutCompleteButton = page.locator('button:has-text("운동 완료")');
    await expect(workoutCompleteButton).toBeVisible();

    // 1. Press 'Q' key to switch to the Routine page.
    await page.keyboard.press('q');
    const routineGrid = page.locator('.routine-grid');
    await expect(routineGrid).toBeVisible();

    // 2. Press 'E' key to switch to the Log page.
    await page.keyboard.press('e');
    const logSidebar = page.locator('[data-tab-navigation="log"]');
    await expect(logSidebar).toBeVisible();

    // 3. Press 'W' key to switch back to the Set page.
    await page.keyboard.press('w');
    await expect(workoutCompleteButton).toBeVisible();
  });
});
