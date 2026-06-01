import { test, expect } from '@playwright/test';

test.describe('Session Exercise Grouping (Superset/Alternating) E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Catch uncaught exceptions to fail the test immediately
    page.on('pageerror', (exception) => {
      throw new Error(`[BROWSER CRASH DETECTED] Uncaught exception: ${exception.message}\nStack:\n${exception.stack}`);
    });
  });

  test('should create an exercise group, synchronize target sets across grouped exercises, and cleanly delete the group', async ({ page }) => {
    // 1. Open home page
    await page.goto('/');

    // 2. Click on the Routine navigation tab
    const routineTabButton = page.locator('[data-tab-navigation="main"] [data-tab-id="routine"]');
    await routineTabButton.click();

    // 3. Confirm routine panel layout grid is painted
    await expect(page.locator('.routine-grid')).toBeVisible();

    // 4. Exercise list should contain catalog exercises
    const exerciseRows = page.locator('.routine-exercise-row');
    const count = await exerciseRows.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // 5. Remove seed groups so this test owns the group it creates
    const groupRow = page.locator('.routine-group-row');
    while (await groupRow.count() > 0) {
      const previousCount = await groupRow.count();
      await page.locator('button[aria-label*="그룹 삭제"]').first().click();
      await expect(groupRow).toHaveCount(previousCount - 1);
    }

    // 6. Ensure "그룹 추가" (Add Group) button is visible and click it
    const addGroupButton = page.locator('button:has-text("그룹 추가")');
    await expect(addGroupButton).toBeVisible();
    await expect(addGroupButton).toBeEnabled();
    await addGroupButton.click();

    // 7. Confirm AddExerciseGroupRow form is shown
    const groupNameInput = page.locator('input[aria-label="그룹 이름"]');
    await expect(groupNameInput).toBeVisible();

    // 8. Click on the "그룹 저장" (Save Group) button
    const saveGroupButton = page.locator('button[aria-label="그룹 저장"]');
    await saveGroupButton.click();

    // 9. Confirm the group bracket or group row is added
    await expect(groupRow.first()).toBeVisible();

    // Wait for framer-motion layout animations to settle
    await page.waitForTimeout(1000);

    // 10. Click the SECOND exercise directly to open settings panel (avoiding double-click deselect on the first exercise)
    const secondExerciseRow = page.locator('.routine-exercise-row').nth(1);
    await secondExerciseRow.click();

    // 11. Change target sets using stepper and confirm it increments
    const incrementSetsBtn = page.locator('button[aria-label="세트 늘리기"]');
    await expect(incrementSetsBtn).toBeVisible();
    
    // Check initial sets display text in exercise row 2
    const secondExerciseTarget = secondExerciseRow.locator('.routine-exercise-target').first();
    const initialText = await secondExerciseTarget.innerText();
    const initialSets = parseInt(initialText.replace('세트', '').trim(), 10) || 3;
    
    // Click increment button
    await incrementSetsBtn.click();
    
    // Ensure the second exercise row's sets display is updated in the list
    const expectedSetsText = `${initialSets + 1}세트`;
    await expect(secondExerciseTarget).toHaveText(expectedSetsText);

    // 12. Click the FIRST exercise in the group and check if its target sets is synchronized
    await page.waitForTimeout(500);
    const firstExerciseRow = page.locator('.routine-exercise-row').first();
    await firstExerciseRow.click();
    
    const firstExerciseTarget = firstExerciseRow.locator('.routine-exercise-target').first();
    await expect(firstExerciseTarget).toHaveText(expectedSetsText);

    // 13. Delete the created exercise group
    const deleteGroupBtn = page.locator('button[aria-label*="그룹 삭제"]').first();
    await expect(deleteGroupBtn).toBeVisible();
    await deleteGroupBtn.click();

    // 14. Confirm the group row is cleanly removed from the UI list
    await expect(groupRow).toHaveCount(0);
  });
});
