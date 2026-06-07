const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// Simple static server
const server = http.createServer((req, res) => {
  let filePath = '.' + req.url.split('?')[0];
  if (filePath === './') filePath = './index.html';
  
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  switch (extname) {
    case '.js': contentType = 'text/javascript'; break;
    case '.css': contentType = 'text/css'; break;
    case '.json': contentType = 'application/json'; break;
    case '.png': contentType = 'image/png'; break;
    case '.jpg': contentType = 'image/jpg'; break;
    case '.mp4': contentType = 'video/mp4'; break;
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

server.listen(3000, async () => {
  console.log('Local server running on http://localhost:3000');
  
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', exception => console.log('BROWSER ERROR:', exception));

    // --- TEST INDEX.HTML ---
    console.log('\n--- Testing index.html ---');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    
    // Check initial styles
    const styles = await page.evaluate(() => {
      const el = document.getElementById('passport-viewer');
      if (!el) return { error: 'Element #passport-viewer not found' };
      return {
        inlineDisplay: el.style.display,
        computedDisplay: window.getComputedStyle(el).display,
        classes: el.className
      };
    });
    console.log('Initial styles for #passport-viewer:', styles);
    if (styles.computedDisplay !== 'none') {
      throw new Error(`Expected #passport-viewer to be display: none, got ${styles.computedDisplay}`);
    }

    // Verify modal button click
    console.log('Testing "Members Only" button click...');
    const modalOpenBefore = await page.evaluate(() => {
      const modal = document.getElementById('ticket-modal');
      return modal ? modal.hasAttribute('open') : 'missing';
    });
    console.log('Modal open state before click:', modalOpenBefore);
    if (modalOpenBefore === true) {
      throw new Error('Expected login modal to be closed initially.');
    }

    await page.click('#nav-members-btn');
    await page.waitForTimeout(500);

    const modalOpenAfter = await page.evaluate(() => {
      const modal = document.getElementById('ticket-modal');
      return modal ? modal.hasAttribute('open') : 'missing';
    });
    console.log('Modal open state after click:', modalOpenAfter);
    if (modalOpenAfter !== true) {
      throw new Error('Expected login modal to be open after clicking "Members Only".');
    }

    // --- TEST EVENT.HTML ---
    console.log('\n--- Testing event.html ---');
    await page.goto('http://localhost:3000/event.html', { waitUntil: 'domcontentloaded' });

    // 1. Assert no duplicate videos
    const videoCount = await page.evaluate(() => {
      return document.querySelectorAll('video.hero-bg-video').length;
    });
    console.log('Number of background videos on event.html:', videoCount);
    if (videoCount !== 1) {
      throw new Error(`Expected exactly 1 background video on event.html, but found ${videoCount}`);
    }

    // 2. Assert no duplicate html/body or index.html sections
    const passportViewerCount = await page.evaluate(() => {
      return document.querySelectorAll('#passport-viewer').length;
    });
    console.log('Number of passport-viewer sections on event.html:', passportViewerCount);
    if (passportViewerCount !== 0) {
      throw new Error(`Expected 0 passport-viewer sections on event.html, but found ${passportViewerCount}`);
    }

    console.log('\nAll automated local tests passed successfully! 🎉');
    await browser.close();
  } catch (err) {
    console.error('\nTest failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
