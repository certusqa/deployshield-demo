import type { Locator, Page } from '@playwright/test';

export class InventoryPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;
  readonly cartItemName: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByTestId('title');
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.cartItemName = page.locator('.cart_item .inventory_item_name');
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
  }

  async addProductToCart(productTestId: string) {
    await this.page.getByTestId(`add-to-cart-${productTestId}`).click();
  }

  async removeProductFromCart(productTestId: string) {
    await this.page.getByTestId(`remove-${productTestId}`).click();
  }

  async openCart() {
    await this.cartLink.click();
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
  }
}
