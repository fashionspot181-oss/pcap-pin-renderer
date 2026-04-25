process.env.PLAYWRIGHT_BROWSERS_PATH = '0';

const express = require('express');
const { chromium } = require('playwright');

const app = express();
const PORT = process.env.PORT || 3333;

app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', engine: 'playwright' });
});

app.post('/render', async (req, res) => {
  const { html, width = 1000, height = 1500, deviceScaleFactor = 2 } = req.body;
  if (!html) return res.status(400).json({ error: 'Missing html field' });

  let browser;
  try {
    browser = await chromium.launch({ args: ['--no-sandbox'] });

    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor
    });

    await page.setContent(html, { waitUntil: 'networkidle' });
    await new Promise(r => setTimeout(r, 500));

    const buffer = await page.screenshot({ type: 'png' });
    res.json({ image: buffer.toString('base64') });

  } catch (err) {
    console.error('[Renderer]', err);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => console.log(`Renderer running on port ${PORT}`));