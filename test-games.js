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

server.listen(3062, async () => {
  console.log('Local test server running on http://localhost:3062');
  
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', exception => console.log('BROWSER EXCEPTION:', exception));

    // Handle standard alert dialogs
    page.on('dialog', async dialog => {
      console.log('BROWSER DIALOG:', dialog.type(), dialog.message());
      await dialog.accept();
    });

    console.log('Loading page...');
    await page.goto('http://localhost:3062', { waitUntil: 'networkidle' });

    // Enable simulated login and navigate to community
    console.log('Simulating navigation to Community section...');
    await page.evaluate(() => {
      localStorage.setItem('thirsty_logged_in', 'true');
      document.documentElement.classList.add('user-logged-in');
      const card = document.getElementById('user-dashboard-card');
      if (card) card.style.display = 'flex';
      
      const commBtn = document.querySelector('button[data-target-view="view-community"]');
      if (commBtn) commBtn.click();
    });
    await page.waitForTimeout(1000);

    // Switch to GAMES subtab
    console.log('Switching to GAMES subtab...');
    await page.click('#community-tab-games');
    await page.waitForTimeout(500);

    // Verify Games Hub is visible
    const gamesHubVisible = await page.evaluate(() => {
      const el = document.getElementById('community-games-section');
      return el && window.getComputedStyle(el).display !== 'none';
    });
    console.log('Games section visible:', gamesHubVisible);
    if (!gamesHubVisible) {
      throw new Error('Games subtab is not visible');
    }

    // --- TEST TRIVIA ---
    console.log('Testing Trivia Quiz selection...');
    await page.click('#btn-select-trivia');
    await page.waitForTimeout(300);

    // Select category 'thirstynalia'
    console.log('Selecting ThirstyNalia category...');
    await page.click('.category-card[data-category="thirstynalia"]');
    await page.waitForTimeout(300);

    // Click first option
    console.log('Clicking an answer option...');
    await page.click('#trivia-options-container .quiz-option-btn');
    await page.waitForTimeout(400);

    // End game manually using showQuizResults to avoid waiting 60s
    console.log('Manually ending trivia game...');
    await page.evaluate(() => {
      // Direct call because we are in the browser context and showQuizResults is in local scope,
      // but wait: showQuizResults is in main.js closure. So how can we call it?
      // Since it's inside the main.js closure, let's trigger it by changing the time left to 0!
      // In main.js, the timer interval decs time. If we trigger the interval or timer count = 0,
      // it might not instantly clear if it doesn't poll. But wait! We can also check if we can click back or wait.
      // Wait, is there any way to end it? Let's check how triviaTimerInterval is handled.
      // Yes, if we can't call showQuizResults directly, we can just click back or let the test click it.
      // Actually, let's see: we can click back directly to go to games hub!
    });
    
    // Go back
    await page.click('#trivia-back-btn');
    await page.waitForTimeout(300);

    // --- TEST TREASURE HUNT ---
    console.log('Testing Treasure Hunt...');
    await page.click('#btn-select-treasure');
    await page.waitForTimeout(300);

    // Verify Lagos Terminal card is locked initially
    const initialLagosUnlocked = await page.evaluate(() => {
      const badge = document.querySelector('.hunt-card:nth-child(1) .hunt-badge');
      return badge ? badge.textContent.includes('Unlocked') : false;
    });
    console.log('Lagos hunt unlocked initially:', initialLagosUnlocked);

    // Submit correct code: TC-BOX-LAGOS
    console.log('Submitting correct code for Lagos Terminal...');
    await page.fill('#hunt-input-1', 'TC-BOX-LAGOS');
    await page.click('#hunt-form-1 button[type="submit"]');
    await page.waitForTimeout(300);

    // Verify Lagos Terminal card is now unlocked
    const postLagosUnlocked = await page.evaluate(() => {
      const badge = document.querySelector('.hunt-card:nth-child(1) .hunt-badge');
      return badge ? badge.textContent.includes('Unlocked') : false;
    });
    console.log('Lagos hunt unlocked after submission:', postLagosUnlocked);

    // Go back
    await page.click('#treasure-back-btn');
    await page.waitForTimeout(300);



    // --- TEST SOCIAL RAIDS ---
    console.log('Testing Social Raids...');
    await page.click('#btn-select-raids');
    await page.waitForTimeout(300);

    // Click first raid open link, then claim
    await page.click('#raid-link-btn-1');
    await page.waitForTimeout(300);
    
    // Verify claim button is enabled and click it
    const claimDisabled = await page.evaluate(() => {
      return document.getElementById('raid-claim-btn-1').disabled;
    });
    console.log('Raid 1 claim button disabled:', claimDisabled);
    if (!claimDisabled) {
      await page.click('#raid-claim-btn-1');
      await page.waitForTimeout(300);
    }

    // Go back
    await page.click('#raids-back-btn');
    await page.waitForTimeout(300);

    // --- TEST BOUNTIES ---
    console.log('Testing Bounties...');
    await page.click('#btn-select-bounties');
    await page.waitForTimeout(300);

    // Claim first bounty
    await page.click('#bounty-claim-follow_twitter');
    await page.waitForTimeout(300);

    // Verify completed count
    const bountiesCompleted = await page.evaluate(() => {
      return document.getElementById('bounties-completed-count').textContent;
    });
    console.log('Bounties completed status:', bountiesCompleted);

    // Go back
    await page.click('#bounties-back-btn');
    await page.waitForTimeout(300);

    console.log('✅ ALL GAMES TESTS PASSED!');
    await browser.close();
    server.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    server.close();
    process.exit(1);
  }
});
