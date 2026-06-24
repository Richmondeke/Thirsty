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

server.listen(3061, async () => {
  console.log('Local test server running on http://localhost:3061');
  
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', exception => console.log('BROWSER EXCEPTION:', exception));

    console.log('Loading page...');
    await page.goto('http://localhost:3061', { waitUntil: 'networkidle' });

    // Manually trigger community view show since tests might bypass full login flow
    console.log('Simulating navigation to Community section...');
    await page.evaluate(() => {
      // Setup mock logged-in state so dashboard is shown
      localStorage.setItem('thirsty_logged_in', 'true');
      document.documentElement.classList.add('user-logged-in');
      const card = document.getElementById('user-dashboard-card');
      if (card) card.style.display = 'flex';
      
      // Navigate to community
      const commBtn = document.querySelector('button[data-target-view="view-community"]');
      if (commBtn) commBtn.click();
    });
    
    await page.waitForTimeout(1000);

    // Assert signals container loaded
    const postsCount = await page.evaluate(() => {
      return document.querySelectorAll('.signal-post-card').length;
    });
    console.log('Post cards count:', postsCount);
    if (postsCount === 0) {
      throw new Error('No post cards found in signals feed');
    }

    // Check initial like count on post 1
    const initialLikes = await page.evaluate(() => {
      const countEl = document.querySelector('.like-btn-1 .like-count');
      return parseInt(countEl.textContent, 10);
    });
    console.log('Initial likes for post 1:', initialLikes);

    // Double tap/click the media frame
    console.log('Double clicking post 1 media frame...');
    const mediaFrame = page.locator('#media-frame-1');
    await mediaFrame.dblclick();
    await page.waitForTimeout(200);

    // Assert heart popup created and then deleted
    const heartExists = await page.evaluate(() => {
      return !!document.querySelector('#media-frame-1 .double-tap-heart');
    });
    console.log('Double tap heart element exists during pop:', heartExists);

    // Check new likes count
    const updatedLikes = await page.evaluate(() => {
      const countEl = document.querySelector('.like-btn-1 .like-count');
      return parseInt(countEl.textContent, 10);
    });
    console.log('Updated likes for post 1:', updatedLikes);
    if (updatedLikes !== initialLikes + 1) {
      throw new Error(`Expected likes to increase from ${initialLikes} to ${initialLikes + 1}, got ${updatedLikes}`);
    }

    // Toggle comments section
    console.log('Toggling comments section...');
    await page.click('.comment-btn-1');
    await page.waitForTimeout(300);

    const commentsSectionVisible = await page.evaluate(() => {
      const sec = document.getElementById('comments-section-1');
      return window.getComputedStyle(sec).display !== 'none';
    });
    console.log('Comments drawer visible:', commentsSectionVisible);
    if (!commentsSectionVisible) {
      throw new Error('Comments drawer did not open on comment button click');
    }

    // Initial comments count
    const initialCommentsCount = await page.evaluate(() => {
      return document.querySelectorAll('#comments-list-1 .comment-item').length;
    });
    console.log('Initial comments count in UI:', initialCommentsCount);

    // Add a comment
    console.log('Typing a comment...');
    await page.fill('#comment-input-1', 'This is a playwright automated test comment!');
    await page.click('#comments-section-1 button[type="submit"]');
    await page.waitForTimeout(300);

    // Check updated comments list
    const updatedCommentsCount = await page.evaluate(() => {
      return document.querySelectorAll('#comments-list-1 .comment-item').length;
    });
    console.log('Updated comments count in UI:', updatedCommentsCount);
    if (updatedCommentsCount !== initialCommentsCount + 1) {
      throw new Error(`Expected comment count to increase to ${initialCommentsCount + 1}, got ${updatedCommentsCount}`);
    }

    // Confirm comment text is present
    const lastCommentText = await page.evaluate(() => {
      const comments = document.querySelectorAll('#comments-list-1 .comment-item');
      const last = comments[comments.length - 1];
      return last.textContent;
    });
    console.log('Last comment content in UI:', lastCommentText.trim());
    if (!lastCommentText.includes('playwright automated test comment')) {
      throw new Error('Comment text mismatch');
    }

    console.log('✅ ALL SIGNALS TESTS PASSED!');
    await browser.close();
    server.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    server.close();
    process.exit(1);
  }
});
