
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { PDFDocument, PDFName, PDFDict, PDFArray, PDFNumber, PDFString, PDFHexString } = require('pdf-lib');

(async () => {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files']
    });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(300000); // 5分钟，应对巨型文件
    
    const htmlPath = 'file://' + path.join(__dirname, 'full_book.html');
    console.log('Loading full book HTML (this may take a minute)...');
    
    await page.goto(htmlPath, { waitUntil: 'load' });
    await page.waitForFunction(() => window.rendered === true, { timeout: 300000 });
    
    const tocData = await page.evaluate(() => window.tocData);
    
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
    const tempPdfPath = path.join(outputDir, 'temp_raw.pdf');
    const finalPdfPath = path.join(outputDir, 'CSCS_V23_FIXED.pdf');

    console.log('Step 1: Printing high-fidelity PDF with all images...');
    await page.pdf({
        path: tempPdfPath,
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div style="font-size: 8px; width: 100%; text-align: center; color: #ccc;">CSCS 第五版 - 中文重译修复版</div>',
        footerTemplate: '<div style="font-size: 8px; width: 100%; text-align: center; color: #ccc;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
        margin: { top: '60px', bottom: '60px', left: '40px', right: '40px' },
        timeout: 0
    });

    console.log('Step 2: Injecting Binary Outlines for Sidebar Navigation...');
    const pdfBytes = fs.readFileSync(tempPdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const context = pdfDoc.context;

    // 建立 PDF 侧边栏跳转目录
    const outlinesDict = context.obj({
        Type: PDFName.of('Outlines'),
        Count: PDFNumber.of(tocData.length),
    });
    const outlinesDictRef = context.register(outlinesDict);
    pdfDoc.catalog.set(PDFName.of('Outlines'), outlinesDictRef);

    let firstRef, lastRef, prevRef;

    for (let i = 0; i < tocData.length; i++) {
        const item = tocData[i];
        const entryDict = context.obj({
            Title: PDFHexString.fromText(item.text),
            Parent: outlinesDictRef,
            Dest: PDFName.of(item.id), // 核心：链接到正文中的同名 Dest
        });
        const entryRef = context.register(entryDict);

        if (i === 0) firstRef = entryRef;
        if (i === tocData.length - 1) lastRef = entryRef;
        if (prevRef) {
            context.lookup(prevRef).set(PDFName.of('Next'), entryRef);
            entryDict.set(PDFName.of('Prev'), prevRef);
        }
        prevRef = entryRef;
    }

    outlinesDict.set(PDFName.of('First'), firstRef);
    outlinesDict.set(PDFName.of('Last'), lastRef);

    const finalPdfBytes = await pdfDoc.save();
    fs.writeFileSync(finalPdfPath, finalPdfBytes);
    fs.unlinkSync(tempPdfPath);

    await browser.close();
    console.log('✅ 终极 PDF 已生成！侧边栏跳转与全书插图现已完美。');
})();
