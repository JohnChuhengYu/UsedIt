const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log(`PAGE ERROR: ${error.message}`));
  page.on('request', request => console.log('>>', request.method(), request.url()));
  page.on('response', response => console.log('<<', response.status(), response.url()));

  console.log("Navigating to practice list...");
  await page.goto('http://localhost:5173/practice');
  
  console.log("Waiting for links...");
  await page.waitForSelector('a[href^="/practice/"]');
  
  console.log("Clicking the first word...");
  await page.click('a[href^="/practice/"]');
  
  console.log("Waiting for network idle...");
  await page.waitForTimeout(5000);
  
  await browser.close();
})();
