const express   = require('express');
const puppeteer = require('puppeteer');
const app       = express();
const PORT      = process.env.PORT || 3333;

app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => res.json({ status: 'ok', chrome: process.env.PUPPETEER_EXECUTABLE_PATH || 'default' }));

app.post('/render', async (req, res) => {
    const { html, width=1000, height=1500, deviceScaleFactor=2 } = req.body;
    if (!html) return res.status(400).json({ error: 'Missing html field' });

    let browser;
    try {
        const launchOptions = {
            headless: true, // ✅ FIXED
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ],
        };

        // Use system Chrome if env var is set (Render.com, Railway, etc.)
        if (process.env.PUPPETEER_EXECUTABLE_PATH) {
            launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
        }

        browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();
        await page.setViewport({ width, height, deviceScaleFactor });
        await page.setContent(html, { waitUntil: ['networkidle0', 'load'], timeout: 30000 });
        await new Promise(r => setTimeout(r, 500));
        const screenshot = await page.screenshot({
            type: 'png',
            encoding: 'base64',
            clip: { x: 0, y: 0, width, height },
        });
        res.json({ image: screenshot });
    } catch(err) {
        console.error('[PCAP Renderer]', err.message);
        res.status(500).json({ error: err.message });
    } finally {
        if (browser) await browser.close();
    }
});

app.listen(PORT, () => console.log(`[PCAP Renderer] http://localhost:${PORT}`));
