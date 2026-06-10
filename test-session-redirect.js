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
  email: "testuser@gmail.com",
  role: "authenticated",
  aud: "authenticated"
};
const mockJwt = `${encodeBase64Url(header)}.${encodeBase64Url(payload)}.signature`;

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

server.listen(3052, async () => {
  console.log('Local server running on http://localhost:3052');
  
  try {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Set up network mocking for Supabase API endpoints
    await page.route('**/auth/v1/token**', route => {
      console.log('MOCKING: Supabase /auth/v1/token password sign-in');
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: mockJwt,
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: "mock-refresh-token",
          user: {
            id: "d3b07384-d113-4c9d-bf84-cf8c8c5c76cc",
            email: "testuser@gmail.com",
            email_confirmed_at: "2026-06-10T00:00:00Z",
            last_sign_in_at: "2026-06-10T00:00:00Z",
            role: "authenticated",
            aud: "authenticated",
            user_metadata: { username: "testuser" }
          }
        })
      });
    });

    await page.route('**/auth/v1/user**', route => {
      console.log('MOCKING: Supabase /auth/v1/user call');
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: "d3b07384-d113-4c9d-bf84-cf8c8c5c76cc",
          email: "testuser@gmail.com",
          user_metadata: { username: "testuser" }
        })
      });
    });

    await page.route('**/rest/v1/profiles**', route => {
      console.log('MOCKING: Supabase /rest/v1/profiles DB query');
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: "d3b07384-d113-4c9d-bf84-cf8c8c5c76cc",
          email: "testuser@gmail.com",
          username: "testuser",
          thirstyclub_id: "T999-1234",
          socials: {
            instagram: "insta",
            twitter: "tw",
            discord: "dc",
            place_of_thirst: "LAGOS",
            gender: "F",
            signature: "Thirstyzoid",
            role: "user",
            welcome_email_sent: true
          }
        })
      });
    });

    await page.route('**/rest/v1/tickets**', route => {
      console.log('MOCKING: Supabase /rest/v1/tickets DB query');
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: "ticket-123",
          user_id: "d3b07384-d113-4c9d-bf84-cf8c8c5c76cc",
          status: "VIP"
        }])
      });
    });

    page.on('console', msg => {
      console.log('BROWSER CONSOLE:', msg.type(), msg.text());
    });
    page.on('pageerror', exception => console.log('BROWSER ERROR:', exception));
    page.on('request', request => {
      console.log('REQUEST:', request.method(), request.url());
    });
    page.on('requestfailed', request => {
      console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
    });
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log('RESPONSE FAILED (', response.status(), '):', response.url());
      }
    });

    // 1. Navigate directly to /login
    console.log('Navigating to /login...');
    await page.goto('http://localhost:3052/login');

    // 2. Fill out credentials in the form
    console.log('Filling out credentials form...');
    await page.fill('#login-id', 'testuser@gmail.com');
    await page.fill('#login-password', 'password123');

    // 3. Submit the form
    console.log('Submitting login form...');
    await page.click('button[type="submit"]');

    // Wait for redirection
    console.log('Waiting for redirection...');
    await page.waitForTimeout(4000);

    const currentUrl = page.url();
    console.log('Final URL after redirection check:', currentUrl);
    
    if (currentUrl.includes('index.html#passport-viewer')) {
      console.log('Login form redirect test passed! 🎉');
    } else {
      throw new Error(`Expected redirection to index.html#passport-viewer, but got: ${currentUrl}`);
    }

    await browser.close();
  } catch (err) {
    console.error('Test failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
