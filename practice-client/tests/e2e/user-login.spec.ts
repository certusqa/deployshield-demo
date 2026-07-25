import { test, expect } from '@playwright/test';
import { users } from '../fixtures/test-users';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

test.describe('User login', () => {
  test('should log in with valid credentials and reach product catalog', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await test.step('open login page', async () => {
      await loginPage.goto();
    });
    await test.step('submit valid credentials', async () => {
      await loginPage.login(users.standard.username, users.standard.password);
    });
    await test.step('land on product catalog', async () => {
      await expect(inventoryPage.pageTitle).toHaveText('Products');
      await expect(page).toHaveURL(/.*inventory.html/);
    });
  });

  test('should show error for locked out user', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await test.step('open login page', async () => {
      await loginPage.goto();
    });
    await test.step('submit locked-out credentials', async () => {
      await loginPage.login(users.lockedOut.username, users.lockedOut.password);
    });
    await test.step('see locked-out error', async () => {
      await expect(loginPage.errorMessage).toContainText('Sorry, this user has been locked out');
    });
  });
});
