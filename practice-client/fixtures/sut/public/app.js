'use strict';

/** Shared cart/session helpers for the hermetic demo SUT. */
(function () {
  const PRODUCT = {
    id: 'sauce-labs-backpack',
    name: 'Sauce Labs Backpack',
    price: '$29.99',
  };

  function getCart() {
    try {
      return JSON.parse(sessionStorage.getItem('cart') || '[]');
    } catch {
      return [];
    }
  }

  function setCart(items) {
    sessionStorage.setItem('cart', JSON.stringify(items));
  }

  function requireLogin() {
    if (sessionStorage.getItem('loggedIn') !== '1') {
      window.location.href = '/';
      return false;
    }
    return true;
  }

  window.DemoSut = {
    PRODUCT,
    getCart,
    setCart,
    requireLogin,
    addProduct(id) {
      if (id !== PRODUCT.id) return;
      const cart = getCart();
      if (!cart.some((i) => i.id === id)) {
        cart.push({ id: PRODUCT.id, name: PRODUCT.name, price: PRODUCT.price });
        setCart(cart);
      }
    },
    removeProduct(id) {
      setCart(getCart().filter((i) => i.id !== id));
    },
    cartCount() {
      return getCart().length;
    },
  };
})();
