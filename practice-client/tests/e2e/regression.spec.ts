import { test, expect } from '@playwright/test';
import { users, checkout } from '../fixtures/test-users';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CheckoutPage } from '../pages/CheckoutPage';

test.describe('User login', () => {
  test('should log in with valid credentials and reach product catalog', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);
    await expect(inventoryPage.pageTitle).toHaveText('Products');
    await expect(page).toHaveURL(/.*inventory.html/);
  });

  test('should show error for locked out user', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login(users.lockedOut.username, users.lockedOut.password);
    await expect(loginPage.errorMessage).toContainText('Sorry, this user has been locked out');
  });
});

test.describe('Cart management', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);
  });

  test('should add item to cart and show cart badge', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.addProductToCart('sauce-labs-backpack');
    await expect(inventoryPage.cartBadge).toHaveText('1');
  });

  test('should remove item from cart', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.addProductToCart('sauce-labs-backpack');
    await inventoryPage.removeProductFromCart('sauce-labs-backpack');
    await expect(inventoryPage.cartBadge).toHaveCount(0);
  });
});

test.describe('Product checkout', () => {
  test('should complete checkout for a single product', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    const checkoutPage = new CheckoutPage(page);

    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);
    await expect(inventoryPage.pageTitle).toHaveText('Products');

    await inventoryPage.addProductToCart('sauce-labs-backpack');
    await inventoryPage.openCart();
    await inventoryPage.proceedToCheckout();

    await checkoutPage.fillShippingInfo(checkout.firstName, checkout.lastName, checkout.postalCode);
    await checkoutPage.completeOrder();

    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
  });

  test('should show error when postal code is missing', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    const checkoutPage = new CheckoutPage(page);

    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);

    await inventoryPage.addProductToCart('sauce-labs-backpack');
    await inventoryPage.openCart();
    await inventoryPage.proceedToCheckout();

    await checkoutPage.fillShippingInfo(checkout.firstName, checkout.lastName, '');
    await expect(checkoutPage.errorMessage).toContainText('Postal Code is required');
  });
});
