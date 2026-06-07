const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', exception => console.log('BROWSER ERROR:', exception));

  await page.goto('https://www.thirstynalia.com');
  
  // Fill RSVP form
  const email = `testuser_${Date.now()}@example.com`;
  await page.fill('#passport-input-name', 'Test Browser');
  await page.fill('#passport-input-pob', 'London');
  await page.fill('#passport-auth-email', email);
  await page.fill('#passport-auth-password', 'password123');
  
  // Click Download Passport
  console.log('Clicking Download Passport with email:', email);
  await page.click('#download-passport-btn');
  
  // Wait for processing modal to close and success to show
  try {
    await page.waitForSelector('#success-modal[open]', { timeout: 15000 });
    console.log('Success modal opened!');
    
    // Check what member ID is displayed
    const memberId = await page.textContent('#success-member-id');
    console.log('Displayed Member ID:', memberId);
    
    // Click Enter Clubhouse
    await page.click('#success-modal-close-btn');
    
    // Wait a bit and check if passport viewer is visible
    await page.waitForTimeout(1000);
    const viewerDisplay = await page.evaluate(() => {
      const el = document.getElementById('passport-viewer');
      return el ? window.getComputedStyle(el).display : 'missing';
    });
    console.log('Passport viewer display:', viewerDisplay);
    
  } catch (err) {
    console.error('Error waiting for success modal:', err);
  }
  
  await browser.close();
})();
