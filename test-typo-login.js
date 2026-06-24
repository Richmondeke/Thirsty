const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

function encodeBase64Url(obj) {
  const str = JSON.stringify(obj);
  return Buffer.from(str).toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

const header = { alg: "HS256", typ: "JWT" };
const payload = {
  exp: Math.floor(Date.now() / 1000) + 3600,
  sub: "d3b07384-d113-4c9d-bf84-cf8c8c5c76cc",
  email: "realmember@gmail.com",
  role: "authenticated",
  aud: "authenticated"
};
const mockJwt = `${encodeBase64Url(header)}.${encodeBase64Url(payload)}.signature`;

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

server.listen(3063, async () => {
  console.log('Local test server running on http://localhost:3063');
  
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', exception => console.log('BROWSER EXCEPTION:', exception));

    // Handle warning/alert dialogs
    let alertMsg = null;
    page.on('dialog', async dialog => {
      alertMsg = dialog.message();
      console.log('BROWSER DIALOG ALERT:', alertMsg);
      await dialog.accept();
    });

    // Intercept and mock Supabase API calls
    await page.route('**/*', async (route, request) => {
      const url = request.url();
      const method = request.method();
      
      if (url.includes('supabase.co')) {
        console.log(`TEST INTERCEPT: [${method}] ${url}`);
        if (url.includes('/auth/v1/token')) {
          // Mock Auth signin success
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              access_token: mockJwt,
              token_type: 'bearer',
              expires_in: 3600,
              refresh_token: 'dummy-refresh-token',
              user: {
                id: 'd3b07384-d113-4c9d-bf84-cf8c8c5c76cc',
                email: 'realmember@gmail.com',
                role: 'authenticated'
              },
              session: {
                access_token: mockJwt,
                user: {
                  id: 'd3b07384-d113-4c9d-bf84-cf8c8c5c76cc',
                  email: 'realmember@gmail.com'
                }
              }
            })
          });
        } else if (url.includes('/rest/v1/profiles')) {
          // Mock profile select queries (returning single object for .single())
          if (url.includes('thirstyclub_id=eq.T999-6273')) {
            await route.fulfill({
              status: 200,
              headers: { 'content-profile': 'application/json' },
              contentType: 'application/json',
              body: JSON.stringify({ email: 'realmember@gmail.com', id: 'd3b07384-d113-4c9d-bf84-cf8c8c5c76cc' })
            });
          } else if (url.includes('username=ilike.Immzy')) {
            await route.fulfill({
              status: 200,
              headers: { 'content-profile': 'application/json' },
              contentType: 'application/json',
              body: JSON.stringify({ email: 'immzy_member@gmail.com', id: 'd3b07384-d113-4c9d-bf84-cf8c8c5c76cc' })
            });
          } else if (url.includes('id=eq.')) {
            // Mock syncSessionAndProfile query
            await route.fulfill({
              status: 200,
              headers: { 'content-profile': 'application/json' },
              contentType: 'application/json',
              body: JSON.stringify({
                id: 'd3b07384-d113-4c9d-bf84-cf8c8c5c76cc',
                username: 'realmember',
                email: 'realmember@gmail.com',
                thirstyclub_id: 'T999-6273',
                socials: {}
              })
            });
          } else {
            // Error code for single() not found
            await route.fulfill({
              status: 406,
              contentType: 'application/json',
              body: JSON.stringify({ message: 'Not found', code: 'PGRST116' })
            });
          }
        } else {
          // Fallback response for other Supabase rest queries
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
          });
        }
      } else {
        await route.continue();
      }
    });

    console.log('Loading login page...');
    await page.goto('http://localhost:3063/login', { waitUntil: 'networkidle' });

    // Test Case 1: Standard ThirstyID t999-6273
    console.log('\n--- Test 1: lowercase with dash (t999-6273) ---');
    alertMsg = null;
    await page.fill('#login-id', 't999-6273');
    await page.fill('#login-password', 'correctpassword');
    await page.click('#login-form button[type="submit"]');
    await page.waitForTimeout(500);
    if (alertMsg) {
      throw new Error(`Test 1 failed with alert: ${alertMsg}`);
    }

    // Test Case 2: Lowercase without dash (t9996273)
    console.log('\n--- Test 2: lowercase without dash (t9996273) ---');
    alertMsg = null;
    await page.fill('#login-id', 't9996273');
    await page.fill('#login-password', 'correctpassword');
    await page.click('#login-form button[type="submit"]');
    await page.waitForTimeout(500);
    if (alertMsg) {
      throw new Error(`Test 2 failed with alert: ${alertMsg}`);
    }

    // Test Case 3: Spaces inside (T 999 - 6273)
    console.log('\n--- Test 3: spaces inside (T 999 - 6273) ---');
    alertMsg = null;
    await page.fill('#login-id', 'T 999 - 6273');
    await page.fill('#login-password', 'correctpassword');
    await page.click('#login-form button[type="submit"]');
    await page.waitForTimeout(500);
    if (alertMsg) {
      throw new Error(`Test 3 failed with alert: ${alertMsg}`);
    }

    // Test Case 4: Double dashes (t-999-6273)
    console.log('\n--- Test 4: double dashes (t-999-6273) ---');
    alertMsg = null;
    await page.fill('#login-id', 't-999-6273');
    await page.fill('#login-password', 'correctpassword');
    await page.click('#login-form button[type="submit"]');
    await page.waitForTimeout(500);
    if (alertMsg) {
      throw new Error(`Test 4 failed with alert: ${alertMsg}`);
    }

    // Test Case 5: Incorrect formatting starting with T999 (T999-12)
    console.log('\n--- Test 5: incorrect formatting prefix (T999-12) ---');
    alertMsg = null;
    await page.fill('#login-id', 'T999-12');
    await page.fill('#login-password', 'any');
    await page.click('#login-form button[type="submit"]');
    await page.waitForTimeout(500);
    if (!alertMsg || !alertMsg.includes('Invalid ThirstyID format')) {
      throw new Error(`Expected ThirstyID format warning, got alert: ${alertMsg}`);
    }

    // Test Case 6: Standard username (Immzy)
    console.log('\n--- Test 6: username (Immzy) ---');
    alertMsg = null;
    await page.fill('#login-id', 'Immzy');
    await page.fill('#login-password', 'any');
    await page.click('#login-form button[type="submit"]');
    await page.waitForTimeout(500);
    if (alertMsg) {
      throw new Error(`Test 6 failed with alert: ${alertMsg}`);
    }

    console.log('\n✅ ALL TYPO LOGIN TESTS PASSED!');
    await browser.close();
    server.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    server.close();
    process.exit(1);
  }
});
