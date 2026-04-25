const express   = require('express');
const puppeteer = require('puppeteer');
const app       = express();
const PORT      = process.env.PORT || 3333;

app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.post('/render', async (req, res) => {
    const { html, width=1000, height=1500, deviceScaleFactor=2 } = req.body;
    if (!html) return res.status(400).json({ error: 'Missing html field' });

    let browser;
    try {
        browser = await puppeteer.launch({
            executablePath: puppeteer.executablePath(),
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        await page.setViewport({ width, height, deviceScaleFactor });

        await page.setContent(html, {
            waitUntil: ['networkidle0','load'],
            timeout: 30000
        });

        await new Promise(r => setTimeout(r, 500));

        const screenshot = await page.screenshot({
            type: 'png',
            encoding: 'base64',
            clip: { x:0, y:0, width, height },
        });

        res.json({ image: screenshot });

    } catch(err) {
        console.error('[PCAP Renderer]', err);
        res.status(500).json({ error: err.message });
    } finally {
        if(browser) await browser.close();
    }
});

app.listen(PORT, () => console.log(`[PCAP Renderer] running on port ${PORT}`));