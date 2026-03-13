
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--allow-file-access-from-files'
        ]
    });
    const page = await browser.newPage();
    
    const htmlPath = 'file://' + path.join(__dirname, 'full_book.html');
    console.log('Loading V23 HTML:', htmlPath);
    
    await page.goto(htmlPath, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => window.rendered === true);
    
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const outputPath = path.join(outputDir, 'CSCS_V23_FIXED.pdf');
    console.log('Printing to:', outputPath);

    await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div style="font-size: 9px; width: 100%; text-align: center; color: #999;">CSCS 第五版 - 终极修复版 V23</div>',
        footerTemplate: '<div style="font-size: 9px; width: 100%; text-align: center; color: #999;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
        margin: { top: '60px', bottom: '60px', left: '40px', right: '40px' }
    });

    await browser.close();
    console.log('✅ Final PDF produced at CSCS_V23_FIXED.pdf');
})();
