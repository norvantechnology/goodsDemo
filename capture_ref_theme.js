const { spawn } = require('child_process');
const fs = require('fs');

async function run() {
  const chrome = spawn('google-chrome', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    '--user-data-dir=/tmp/chrome_ref_profile'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();

    const ws = new WebSocket(data.webSocketDebuggerUrl);
    let id = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (callbacks.has(msg.id)) {
        const cb = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        cb(msg);
      }
    };

    await new Promise(resolve => ws.onopen = resolve);

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const msgId = id++;
        callbacks.set(msgId, resolve);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    const targetRes = await send('Target.createTarget', { url: 'http://localhost:3000' });
    const targetId = targetRes.result.targetId;

    const pageRes = await fetch('http://127.0.0.1:9222/json/list');
    const pages = await pageRes.json();
    const page = pages.find(p => p.id === targetId);

    const pageWs = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise(resolve => pageWs.onopen = resolve);

    let pageId = 1;
    const pageCallbacks = new Map();
    pageWs.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (pageCallbacks.has(msg.id)) {
        const cb = pageCallbacks.get(msg.id);
        pageCallbacks.delete(msg.id);
        cb(msg);
      }
    };

    function pageSend(method, params = {}) {
      return new Promise((resolve) => {
        const msgId = pageId++;
        pageCallbacks.set(msgId, resolve);
        pageWs.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await pageSend('Page.enable');
    await pageSend('Runtime.enable');

    async function setViewport(width, height, isMobile = false) {
      await pageSend('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: isMobile ? 2 : 1,
        mobile: isMobile
      });
      await pageSend('Emulation.setVisibleSize', { width, height });
    }

    async function takeScreenshot(filePath) {
      const shot = await pageSend('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(filePath, Buffer.from(shot.result.data, 'base64'));
      console.log('Saved:', filePath);
    }

    async function evaluate(expr) {
      const res = await pageSend('Runtime.evaluate', {
        expression: expr,
        returnByValue: true,
        awaitPromise: true
      });
      return res.result?.value;
    }

    // 1. Desktop login
    await setViewport(1280, 800, false);
    await pageSend('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise(r => setTimeout(r, 1500));
    await takeScreenshot('/home/ig-008/.gemini/antigravity-ide/brain/383b7ebc-f86a-4651-891c-6f906739de64/desktop_login_ref_theme.png');

    // 2. Mobile login
    await setViewport(390, 844, true);
    await new Promise(r => setTimeout(r, 1000));
    await takeScreenshot('/home/ig-008/.gemini/antigravity-ide/brain/383b7ebc-f86a-4651-891c-6f906739de64/mobile_login_ref_theme.png');

    // 3. Login as Admin
    console.log('Logging in as Admin...');
    await evaluate(`(async () => {
      const adminBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Admin'));
      if (adminBtn) adminBtn.click();
      await new Promise(r => setTimeout(r, 200));
      const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Sign In'));
      if (submitBtn) submitBtn.click();
    })()`);

    await new Promise(r => setTimeout(r, 2500));

    // 4. Desktop Dashboard
    await setViewport(1280, 800, false);
    await new Promise(r => setTimeout(r, 1500));
    await takeScreenshot('/home/ig-008/.gemini/antigravity-ide/brain/383b7ebc-f86a-4651-891c-6f906739de64/desktop_dashboard_ref_theme.png');

    // 5. Mobile Dashboard
    await setViewport(390, 844, true);
    await new Promise(r => setTimeout(r, 1200));
    await takeScreenshot('/home/ig-008/.gemini/antigravity-ide/brain/383b7ebc-f86a-4651-891c-6f906739de64/mobile_dashboard_ref_theme.png');

    // 6. Desktop POS
    await setViewport(1280, 800, false);
    await pageSend('Page.navigate', { url: 'http://localhost:3000/pos' });
    await new Promise(r => setTimeout(r, 1200));
    await evaluate(`(async () => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Shop B'));
      if (btn) btn.click();
    })()`);
    await new Promise(r => setTimeout(r, 1500));
    await takeScreenshot('/home/ig-008/.gemini/antigravity-ide/brain/383b7ebc-f86a-4651-891c-6f906739de64/desktop_pos_ref_theme.png');

    // 7. Mobile POS
    await setViewport(390, 844, true);
    await new Promise(r => setTimeout(r, 1200));
    await takeScreenshot('/home/ig-008/.gemini/antigravity-ide/brain/383b7ebc-f86a-4651-891c-6f906739de64/mobile_pos_ref_theme.png');

    // 8. Desktop Products
    await setViewport(1280, 800, false);
    await pageSend('Page.navigate', { url: 'http://localhost:3000/products' });
    await new Promise(r => setTimeout(r, 1500));
    await takeScreenshot('/home/ig-008/.gemini/antigravity-ide/brain/383b7ebc-f86a-4651-891c-6f906739de64/desktop_products_ref_theme.png');

    // 9. Desktop Purchases
    await pageSend('Page.navigate', { url: 'http://localhost:3000/purchases' });
    await new Promise(r => setTimeout(r, 1500));
    await takeScreenshot('/home/ig-008/.gemini/antigravity-ide/brain/383b7ebc-f86a-4651-891c-6f906739de64/desktop_purchases_ref_theme.png');

    // 10. Desktop Accounting
    await pageSend('Page.navigate', { url: 'http://localhost:3000/accounting' });
    await new Promise(r => setTimeout(r, 2500));
    await takeScreenshot('/home/ig-008/.gemini/antigravity-ide/brain/383b7ebc-f86a-4651-891c-6f906739de64/desktop_accounting_ref_theme.png');

    pageWs.close();
    ws.close();
  } finally {
    chrome.kill();
  }
}

run().catch(err => {
  console.error('Error running capture:', err);
  process.exit(1);
});
