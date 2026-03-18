
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const katex = require('katex');
const cheerio = require('cheerio');

const projectRoot = __dirname;
const mdPath = path.join(projectRoot, 'translated', 'CSCS_MASTER_FINAL_CLEAN.md');
const imagesDir = path.join(projectRoot, 'images');

let markdown = fs.readFileSync(mdPath, 'utf8');

// 1. 预处理公式
markdown = markdown.replace(/\$\$([\s\S]*?)\$\$/g, (m, f) => {
    try { return `<div class="katex-display">${katex.renderToString(f.trim(), {displayMode:true, throwOnError:false})}</div>`; } catch(e) { return m; }
});
markdown = markdown.replace(/\$([^\$\n]+?)\$/g, (m, f) => {
    try { return katex.renderToString(f.trim(), {displayMode:false, throwOnError:false}); } catch(e) { return m; }
});

// 2. 占位符处理图片，防止 Cheerio 阶段消耗内存
const imageMap = [];
markdown = markdown.replace(/!\[(.*?)\]\((.*?)\)/g, (match, text, filename) => {
    const cleanName = path.basename(filename);
    const placeholder = `__IMG_${imageMap.length}__`;
    imageMap.push({ placeholder, cleanName, text });
    return `\n\n${placeholder}\n\n`;
});

// 3. 渲染正文 HTML 并标记 ID
let rawHtml = marked.parse(markdown);
const $ = cheerio.load(rawHtml);
const toc = [];

$('h1, h2').each((i, el) => {
    const id = `jump-target-${i}`;
    $(el).attr('id', id);
    toc.push({ level: el.name === 'h1' ? 1 : 2, text: $(el).text(), id });
});

let bodyHtml = $.html();

// 4. 暴力注入 Base64 图片 (最稳健的显示方式)
console.log('Embedding images as Base64...');
imageMap.forEach(img => {
    const imgPath = path.join(imagesDir, img.cleanName);
    if (fs.existsSync(imgPath)) {
        const base64 = fs.readFileSync(imgPath).toString('base64');
        const imgHtml = `<div class="img-box"><img src="data:image/jpeg;base64,${base64}"><div class="caption">${img.text}</div></div>`;
        bodyHtml = bodyHtml.replace(img.placeholder, imgHtml);
    } else {
        bodyHtml = bodyHtml.replace(img.placeholder, `<p style="color:red;">[图片缺失: ${img.cleanName}]</p>`);
    }
});

// 5. 构建 HTML 外壳
const coverHtml = `
<div class="cover-page" style="page-break-after: always; height: 95vh; display: flex; align-items: center; justify-content: center; text-align: center;">
    <div style="border: 15px double #1e3a8a; padding: 80px 40px; width: 80%;">
        <h1 style="font-size: 4em; color: #1e3a8a; border: none; margin: 0;">抗阻训练与体能开发要点</h1>
        <h2 style="font-size: 2em; color: #666; margin-top: 20px; border: none; background: none;">第五版 (Fifth Edition)</h2>
        <div style="margin-top: 100px; font-size: 1.5em; font-weight: bold; color: #d97706;">中文重译修复版</div>
    </div>
</div>
`;

const tocHtml = `
<div class="toc-page" style="page-break-after: always;">
    <h1 style="border-bottom: 3px solid #1e3a8a; padding-bottom: 10px;">目录 (Contents)</h1>
    <div style="display: flex; flex-direction: column; gap: 10px;">
        ${toc.map(h => `<div class="toc-item depth-${h.level}" style="margin-left: ${h.level === 1 ? '0' : '2em'};"><a href="#${h.id}" style="text-decoration: none; color: #333; border-bottom: 1px dotted #ccc;">${h.text}</a></div>`).join('')}
    </div>
</div>
`;

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&family=Noto+Sans+SC:wght@400;700&display=swap');
        body { font-family: 'Noto Serif SC', serif; font-size: 12pt; line-height: 1.8; color: #1a1a1a; margin: 0; padding: 0; }
        .main-body { padding: 2.54cm 3cm; max-width: 210mm; margin: 0 auto; background: white; text-align: justify; }
        h1, h2, h3 { color: #1e3a8a; font-family: 'Noto Sans SC', sans-serif; font-weight: 700; }
        h1 { font-size: 2.4em; text-align: center; border-bottom: 2px solid #eee; page-break-before: always; padding-bottom: 0.5em; margin-top: 1em; }
        h2 { font-size: 1.8em; border-left: 10px solid #1e3a8a; padding-left: 15px; background: #f8fafc; margin-top: 1.5em; padding: 10px; }
        p { text-indent: 2em; margin-bottom: 1.2em; orphans: 3; widows: 3; }
        .img-box { margin: 2.5em 0; text-align: center; break-inside: avoid; border: 1px solid #f1f5f9; padding: 20px; border-radius: 12px; background: #fafafa; }
        img { max-width: 100%; height: auto; }
        .caption { font-size: 0.95em; color: #666; margin-top: 10px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 2em 0; }
        th { background: #1e3a8a; color: white; padding: 10px; }
        td { border: 1px solid #ddd; padding: 8px; }
    </style>
</head>
<body>
    <div id="content" class="main-body">
        ${coverHtml}
        ${tocHtml}
        ${bodyHtml}
    </div>
    <script>
        window.tocData = ${JSON.stringify(toc)};
        window.rendered = true;
    </script>
</body>
</html>
`;

fs.writeFileSync(path.join(projectRoot, 'full_book.html'), htmlContent);
console.log('🚀 HTML 已生成，准备执行 PDF 底层注入！');
