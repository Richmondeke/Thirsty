const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// Simple static server
const server = http.createServer((req, res) => {
  let filePath = '.' + req.url.split('?')[0];
  if (filePath === './') filePath = './index.html';
  
  if (!path.extname(filePath)) {
    if (fs.existsSync(filePath + '.html')) {
      filePath += '.html';
    }
  }
  
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  switch (extname) {
    case '.js': contentType = 'text/javascript'; break;
    case '.css': contentType = 'text/css'; break;
    case '.json': contentType = 'application/json'; break;
    case '.png': contentType = 'image/png'; break;
    case '.jpg': contentType = 'image/jpg'; break;
  }
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end('Not found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(3060, async () => {
  console.log('Local test server running on http://localhost:3060');
  
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', exception => console.log('BROWSER EXCEPTION:', exception));

    console.log('Loading shop page...');
    await page.goto('http://localhost:3060', { waitUntil: 'networkidle' });

    // Navigate to shop view
    console.log('Switching to SHOP view...');
    await page.click('button[data-target-view="view-wearthirsty"]');
    await page.waitForTimeout(500);

    // Assert shop products grid loaded
    const productCardsCount = await page.evaluate(() => {
      return document.querySelectorAll('#shop-products-grid .product-card').length;
    });
    console.log('Found product cards:', productCardsCount);
    if (productCardsCount === 0) {
      throw new Error('Expected at least 1 product card in the grid');
    }

    // Click on the first product card
    console.log('Clicking the first product card...');
    await page.click('#shop-products-grid .product-card:first-child');
    await page.waitForTimeout(500);

    // Verify view-product-details active and visible
    const detailsActive = await page.evaluate(() => {
      const el = document.getElementById('view-product-details');
      return el && el.classList.contains('active');
    });
    console.log('Is product details view active?', detailsActive);
    if (!detailsActive) {
      throw new Error('Product details view did not activate after clicking a card');
    }

    // Verify back to shop button works
    console.log('Clicking Back to Shop...');
    await page.click('#product-details-back');
    await page.waitForTimeout(500);
    const shopActive = await page.evaluate(() => {
      return document.getElementById('view-wearthirsty').classList.contains('active');
    });
    console.log('Is shop view active again?', shopActive);
    if (!shopActive) {
      throw new Error('Back to Shop button did not return to the shop view');
    }

    // Go back to details to test Add to Cart
    console.log('Opening details page again...');
    await page.click('#shop-products-grid .product-card:first-child');
    await page.waitForTimeout(500);

    // Click Add to Cart
    console.log('Clicking Add to Cart...');
    await page.click('#add-to-cart-btn');
    await page.waitForTimeout(500);

    // Verify cart drawer is active
    const cartActive = await page.evaluate(() => {
      return document.getElementById('cart-sidebar').classList.contains('active');
    });
    console.log('Is cart sidebar open?', cartActive);
    if (!cartActive) {
      throw new Error('Cart drawer did not open after adding product');
    }

    // Check cart item count
    const cartItemsCount = await page.evaluate(() => {
      return document.querySelectorAll('#cart-items-container .cart-item-row').length;
    });
    console.log('Items inside cart drawer:', cartItemsCount);
    if (cartItemsCount !== 1) {
      throw new Error(`Expected exactly 1 cart item row, found ${cartItemsCount}`);
    }

    // Click Checkout
    console.log('Proceeding to checkout...');
    await page.click('#checkout-btn');
    await page.waitForTimeout(500);

    // Fill form details
    console.log('Filling checkout form...');
    await page.fill('#checkout-name', 'Alice Thirsty');
    await page.fill('#checkout-email', 'alice@thirsty.com');
    await page.fill('#checkout-address', '999 Street Rd');
    await page.fill('#checkout-city', 'New York');
    await page.fill('#checkout-zip', '10001');
    await page.fill('#checkout-cardname', 'ALICE THIRSTY');
    await page.fill('#checkout-cardnumber', '4111 2222 3333 4444');
    await page.fill('#checkout-expiry', '12/28');
    await page.fill('#checkout-cvv', '999');

    // Submit order
    console.log('Submitting checkout form...');
    await page.click('#checkout-form button[type="submit"]');
    await page.waitForTimeout(500);

    // Verify order success dialog is open
    const successVisible = await page.evaluate(() => {
      const el = document.getElementById('order-success-dialog');
      return el && el.hasAttribute('open');
    });
    console.log('Is order success modal open?', successVisible);
    if (!successVisible) {
      throw new Error('Success dialog did not open after order submission');
    }

    console.log('\nAll e-commerce workflow tests passed successfully! 🛍️✨');
    await browser.close();
  } catch (err) {
    console.error('\nTest failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
