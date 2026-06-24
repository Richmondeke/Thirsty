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

    // Answer questions (5 total)
    for (let qNum = 1; qNum <= 5; qNum++) {
      console.log(`Answering question ${qNum}...`);
      
      // Determine the correct option index for this question
      const correctIndex = await page.evaluate(() => {
        // We know:
        // Q1: total supply (999) = index 1
        // Q2: primary slogan (Dry) = index 0
        // Q3: passports storage (Supabase) = index 2
        // Q4: early access badge = index 2
        // Q5: gate credential (Passport) = index 1
        const progress = document.getElementById('trivia-progress-text').textContent;
        if (progress.includes('Question 1')) return 1;
        if (progress.includes('Question 2')) return 0;
        if (progress.includes('Question 3')) return 2;
        if (progress.includes('Question 4')) return 2;
        if (progress.includes('Question 5')) return 1;
        return 0;
      });

      // Click the correct button option
      const options = page.locator('#trivia-options-container .quiz-option-btn');
      await options.nth(correctIndex).click();
      await page.waitForTimeout(300);

      // Verify correct class was added
      const correctClassAdded = await page.evaluate((idx) => {
        const btns = document.querySelectorAll('#trivia-options-container .quiz-option-btn');
        return btns[idx].classList.contains('correct');
      }, correctIndex);
      console.log(`Option ${correctIndex} highlighted green:`, correctClassAdded);

      // Click Next
      await page.click('#trivia-next-btn');
      await page.waitForTimeout(300);
    }

    // Assert results screen is shown
    const resultsScoreText = await page.evaluate(() => {
      return document.getElementById('trivia-score-text').textContent;
    });
    console.log('Quiz Final Score in UI:', resultsScoreText);
    if (!resultsScoreText.includes('5 / 5')) {
      throw new Error(`Expected score 5 / 5, got ${resultsScoreText}`);
    }

    // Return to Games Hub
    console.log('Returning to Games Hub from results...');
    await page.click('#trivia-finish-btn');
    await page.waitForTimeout(300);

    // --- TEST TREASURE HUNT ---
    console.log('Testing Treasure Hunt...');
    await page.click('#btn-select-treasure');
    await page.waitForTimeout(300);

    // Verify Lagos Terminal card is locked initially
    const initialLagosUnlocked = await page.evaluate(() => {
      const badge = document.querySelector('.hunt-card:nth-child(1) .hunt-badge');
      return badge.textContent.includes('Unlocked');
    });
    console.log('Lagos hunt unlocked initially:', initialLagosUnlocked);
    if (initialLagosUnlocked) {
      throw new Error('Lagos hunt is unlocked initially but should be locked');
    }

    // Submit correct code: TC-BOX-LAGOS
    console.log('Submitting correct code for Lagos Terminal...');
    await page.fill('#hunt-input-1', 'TC-BOX-LAGOS');
    await page.click('#hunt-form-1 button[type="submit"]');
    await page.waitForTimeout(300);

    // Verify Lagos Terminal card is now unlocked
    const postLagosUnlocked = await page.evaluate(() => {
      const badge = document.querySelector('.hunt-card:nth-child(1) .hunt-badge');
      return badge.textContent.includes('Unlocked');
    });
    console.log('Lagos hunt unlocked after submission:', postLagosUnlocked);
    if (!postLagosUnlocked) {
      throw new Error('Lagos hunt did not unlock after submitting correct code');
    }

    // Verify completed count is updated
    const completedCountText = await page.evaluate(() => {
      return document.getElementById('treasure-completed-count').textContent;
    });
    console.log('Treasure Hunt completion status:', completedCountText);
    if (!completedCountText.includes('1/3')) {
      throw new Error(`Expected status 1/3, got ${completedCountText}`);
    }

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
