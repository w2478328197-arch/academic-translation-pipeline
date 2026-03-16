
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
    page.setDefaultNavigationTimeout(120000); // 120秒超时
    
    const htmlPath = 'file://' + path.join(__dirname, 'full_book.html');
    console.log('Loading HTML with large embedded images...');
    
    await page.goto(htmlPath, { waitUntil: 'load' }); // load 即可，Base64 不需要等待网络
    await page.waitForFunction(() => window.rendered === true, { timeout: 120000 });
    
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const outputPath = path.join(outputDir, 'CSCS_V23_FIXED.pdf');
    console.log('Generating PDF...');

    await page.pdf({ timeout: 0,
        path: outputPath,
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div style="font-size: 9px; width: 100%; text-align: center; color: #999;">CSCS 第五版 - 终极重译修复版</div>',
        footerTemplate: '<div style="font-size: 9px; width: 100%; text-align: center; color: #999;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
        margin: { top: '60px', bottom: '60px', left: '40px', right: '40px' }
    });

    await browser.close();
    console.log('✅ 最终 PDF 打印成功！');
})();
