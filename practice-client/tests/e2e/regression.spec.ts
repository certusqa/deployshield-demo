import { test, expect, type Locator, type Page } from '@playwright/test';

// Page objects inline for local Node 23 compatibility.
// Mirror copies live in tests/pages/ for client repo template (CI uses Node 20).

const users = {
  standard: { username: 'standard_user', password: 'secret_sauce' },
  lockedOut: { username: 'locked_out_user', password: 'secret_sauce' },
};

const checkout = {
  firstName: 'Deploy',
  lastName: 'Shield',
  postalCode: '94105',
};

class LoginPage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(private page: Page) {
    this.usernameInput = page.getByPlaceholder('Username');
    this.passwordInput = page.getByPlaceholder('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page.locator('[data-test="error"]');
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}

class InventoryPage {
  readonly pageTitle: Locator;
  readonly cartLink: Locator;
  readonly checkoutButton: Locator;

  constructor(private page: Page) {
    this.pageTitle = page.locator('.title');
    this.cartLink = page.locator('.shopping_cart_link');
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
  }

  async addProductToCart(productTestId: string) {
    await this.page.locator(`[data-test="add-to-cart-${productTestId}"]`).click();
  }

  async openCart() {
    await this.cartLink.click();
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
  }
}

class CheckoutPage {
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly finishButton: Locator;
  readonly completeHeader: Locator;

  constructor(private page: Page) {
    this.firstNameInput = page.getByPlaceholder('First Name');
    this.lastNameInput = page.getByPlaceholder('Last Name');
    this.postalCodeInput = page.getByPlaceholder('Zip/Postal Code');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.finishButton = page.getByRole('button', { name: 'Finish' });
    this.completeHeader = page.locator('.complete-header');
  }

  async fillShippingInfo(firstName: string, lastName: string, postalCode: string) {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.postalCodeInput.fill(postalCode);
    await this.continueButton.click();
  }

  async completeOrder() {
    await this.finishButton.click();
  }
}

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
    await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
  });

  test('should remove item from cart', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.addProductToCart('sauce-labs-backpack');
    await page.locator('[data-test="remove-sauce-labs-backpack"]').click();
    await expect(page.locator('.shopping_cart_badge')).toHaveCount(0);
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
});
