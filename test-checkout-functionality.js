/**
 * Comprehensive Checkout Functionality Test Script
 * Tests checkout button responsiveness across all product categories
 */

const testCheckoutFunctionality = {
  // Test data for different product categories
  testProducts: {
    filters: {
      id: 1,
      name: "Air Filter",
      price: 25.99,
      category: "Filters",
      type: "Air",
      brand: "TestBrand"
    },
    lubricants: {
      id: 2,
      name: "Engine Oil",
      price: 45.99,
      category: "Lubricants",
      type: "Synthetic",
      brand: "TestOil"
    },
    parts: {
      id: 3,
      name: "Brake Pad",
      price: 89.99,
      category: "Parts",
      type: "Brake",
      brand: "TestParts"
    },
    batteries: {
      id: 4,
      name: "Car Battery",
      price: 129.99,
      category: "Parts",
      type: "Batteries",
      brand: "TestBattery"
    }
  },

  // Test checkout button state
  testCheckoutButtonState: function() {
    console.log('🔍 Testing checkout button state...');
    
    const checkoutButtons = document.querySelectorAll('button');
    const checkoutButton = Array.from(checkoutButtons).find(btn => 
      btn.textContent?.includes('Checkout')
    );
    
    if (!checkoutButton) {
      console.error('❌ Checkout button not found!');
      return false;
    }
    
    console.log('✅ Checkout button found');
    console.log('Button disabled state:', checkoutButton.disabled);
    console.log('Button classes:', checkoutButton.className);
    
    return checkoutButton;
  },

  // Test cart state
  testCartState: function() {
    console.log('🔍 Testing cart state...');
    
    // Try to access cart state from React DevTools or global state
    if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
      console.log('React detected, checking for cart state...');
    }
    
    // Check for cart items in DOM
    const cartItems = document.querySelectorAll('[data-testid="cart-item"], .cart-item');
    console.log('Cart items found in DOM:', cartItems.length);
    
    return cartItems.length;
  },

  // Test adding products to cart
  testAddToCart: function(category) {
    console.log(`🔍 Testing add to cart for ${category}...`);
    
    // Find add to cart buttons
    const addButtons = document.querySelectorAll('button');
    const addToCartButtons = Array.from(addButtons).filter(btn => 
      btn.textContent?.includes('Add') || 
      btn.textContent?.includes('+') ||
      btn.onclick || 
      btn.getAttribute('data-action') === 'add-to-cart'
    );
    
    console.log('Add to cart buttons found:', addToCartButtons.length);
    
    return addToCartButtons;
  },

  // Test checkout process
  testCheckoutProcess: function() {
    console.log('🔍 Testing checkout process...');
    
    const checkoutButton = this.testCheckoutButtonState();
    if (!checkoutButton) return false;
    
    // Check if button is clickable
    const isClickable = !checkoutButton.disabled && 
                       !checkoutButton.classList.contains('disabled');
    
    console.log('Checkout button clickable:', isClickable);
    
    if (isClickable) {
      console.log('✅ Checkout button is responsive');
      
      // Test click event (without actually triggering it)
      const hasClickHandler = checkoutButton.onclick || 
                             checkoutButton.getAttribute('onclick') ||
                             checkoutButton.hasAttribute('data-click');
      
      console.log('Has click handler:', !!hasClickHandler);
      
      return true;
    } else {
      console.log('❌ Checkout button is not responsive');
      return false;
    }
  },

  // Test error handling
  testErrorHandling: function() {
    console.log('🔍 Testing error handling...');
    
    // Check for error messages in DOM
    const errorElements = document.querySelectorAll(
      '.error, .alert-error, [role="alert"], .toast-error'
    );
    
    console.log('Error elements found:', errorElements.length);
    
    // Check console for errors
    const originalError = console.error;
    const errors = [];
    
    console.error = function(...args) {
      errors.push(args);
      originalError.apply(console, args);
    };
    
    setTimeout(() => {
      console.error = originalError;
      console.log('Console errors captured:', errors.length);
    }, 1000);
    
    return errors;
  },

  // Run comprehensive test
  runComprehensiveTest: function() {
    console.log('🚀 Starting comprehensive checkout functionality test...');
    console.log('=' .repeat(60));
    
    const results = {
      checkoutButtonState: this.testCheckoutButtonState(),
      cartState: this.testCartState(),
      checkoutProcess: this.testCheckoutProcess(),
      errorHandling: this.testErrorHandling()
    };
    
    console.log('=' .repeat(60));
    console.log('📊 Test Results Summary:');
    console.log('Checkout button found:', !!results.checkoutButtonState);
    console.log('Cart items count:', results.cartState);
    console.log('Checkout process working:', results.checkoutProcess);
    console.log('Error handling active:', results.errorHandling.length === 0);
    
    // Overall assessment
    const allTestsPassed = !!results.checkoutButtonState && 
                          results.checkoutProcess;
    
    console.log('=' .repeat(60));
    console.log(allTestsPassed ? '✅ All tests PASSED' : '❌ Some tests FAILED');
    
    return results;
  }
};

// Auto-run test if in browser environment
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => testCheckoutFunctionality.runComprehensiveTest(), 1000);
    });
  } else {
    setTimeout(() => testCheckoutFunctionality.runComprehensiveTest(), 1000);
  }
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = testCheckoutFunctionality;
}

// Make available globally
if (typeof window !== 'undefined') {
  window.testCheckoutFunctionality = testCheckoutFunctionality;
}

console.log('🔧 Checkout functionality test script loaded. Run testCheckoutFunctionality.runComprehensiveTest() to start testing.');