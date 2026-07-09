import type { Locator, Page } from 'playwright';

export class InventoryPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly cartLink: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
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
