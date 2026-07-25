import { test, expect } from '@playwright/test';
import { users, checkout } from '../fixtures/test-users';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CheckoutPage } from '../pages/CheckoutPage';

test.describe('Product checkout', () => {
  test('should complete checkout for a single product', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    const checkoutPage = new CheckoutPage(page);

    await test.step('log in as standard user', async () => {
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      await expect(inventoryPage.pageTitle).toHaveText('Products');
    });
    await test.step('add backpack to cart', async () => {
      await inventoryPage.addProductToCart('sauce-labs-backpack');
    });
    await test.step('open cart and start checkout', async () => {
      await inventoryPage.openCart();
      await inventoryPage.proceedToCheckout();
    });
    await test.step('fill shipping info', async () => {
      await checkoutPage.fillShippingInfo(checkout.firstName, checkout.lastName, checkout.postalCode);
    });
    await test.step('confirm overview line item', async () => {
      await expect(checkoutPage.overviewItemName).toHaveText('Sauce Labs Backpack');
      await expect(checkoutPage.overviewItemPrice).toHaveText('$29.99');
    });
    await test.step('finish order', async () => {
      await checkoutPage.completeOrder();
    });
    await test.step('see order confirmation', async () => {
      await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
    });
  });

  test('should show error when postal code is missing', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    const checkoutPage = new CheckoutPage(page);

    await test.step('log in and add backpack', async () => {
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      await inventoryPage.addProductToCart('sauce-labs-backpack');
    });
    await test.step('open cart and start checkout', async () => {
      await inventoryPage.openCart();
      await inventoryPage.proceedToCheckout();
    });
    await test.step('submit shipping without postal code', async () => {
      await checkoutPage.fillShippingInfo(checkout.firstName, checkout.lastName, '');
    });
    await test.step('see postal code required error', async () => {
      await expect(checkoutPage.errorMessage).toContainText('Postal Code is required');
    });
  });
});
