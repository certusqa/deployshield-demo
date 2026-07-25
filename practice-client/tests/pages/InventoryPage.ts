import type { Locator, Page } from '@playwright/test';

export class InventoryPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('.title');
    this.cartLink = page.locator('.shopping_cart_link');
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
  }

  async addProductToCart(productTestId: string) {
    await this.page.locator(`[data-test="add-to-cart-${productTestId}"]`).click();
  }

  async removeProductFromCart(productTestId: string) {
    await this.page.locator(`[data-test="remove-${productTestId}"]`).click();
  }

  async openCart() {
    await this.cartLink.click();
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
  }
}
