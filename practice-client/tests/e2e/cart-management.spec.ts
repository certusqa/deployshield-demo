import { test, expect } from '@playwright/test';
import { users } from '../fixtures/test-users';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

test.describe('Cart management', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);
  });

  test('should add item to cart and show cart badge', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await test.step('add backpack to cart', async () => {
      await inventoryPage.addProductToCart('sauce-labs-backpack');
    });
    await test.step('cart badge shows one item', async () => {
      await expect(inventoryPage.cartBadge).toHaveText('1');
    });
  });

  test('should remove item from cart', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await test.step('add backpack to cart', async () => {
      await inventoryPage.addProductToCart('sauce-labs-backpack');
    });
    await test.step('remove backpack from cart', async () => {
      await inventoryPage.removeProductFromCart('sauce-labs-backpack');
    });
    await test.step('cart badge is gone', async () => {
      await expect(inventoryPage.cartBadge).toHaveCount(0);
    });
  });
});
