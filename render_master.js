
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const katex = require('katex');
const cheerio = require('cheerio');

const projectRoot = __dirname;
const mdPath = path.join(projectRoot, 'translated', 'CSCS_MASTER_FINAL_CLEAN.md');
const imagesDir = path.join(projectRoot, 'images');

let markdown = fs.readFileSync(mdPath, 'utf8');

// 1. 基础预处理
markdown = markdown.replace(/\$\$([\s\S]*?)\$\$/g, (m, f) => {
    try { return `<div class="katex-display">${katex.renderToString(f.trim(), {displayMode:true, throwOnError:false})}</div>`; } catch(e) { return m; }
});
markdown = markdown.replace(/\$([^\$\n]+?)\$/g, (m, f) => {
    try { return katex.renderToString(f.trim(), {displayMode:false, throwOnError:false}); } catch(e) { return m; }
});

// 2. 渲染正文
let rawBodyHtml = marked.parse(markdown);

// 3. 使用 Cheerio 注入 ID 并处理图片路径
const $ = cheerio.load(rawBodyHtml);
const toc = [];

$('h1, h2').each((i, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    const id = `nav-section-${i + 1}`;
    $el.attr('id', id);
    toc.push({ level: el.name === 'h1' ? 1 : 2, text, id });
});

// 处理图片：使用绝对文件路径，确保 Puppeteer 能找到
$('img').each((i, el) => {
    const $el = $(el);
    const src = $el.attr('src');
    if (src && !src.startsWith('data:')) {
        const cleanName = path.basename(src);
        const absolutePath = 'file://' + path.join(imagesDir, cleanName);
        $el.attr('src', absolutePath);
    }
});

const bodyHtml = $.html();

// 4. 构建封面与目录
const coverHtml = `
<div class="cover-page">
    <div class="cover-content">
        <h1 class="book-title">抗阻训练与体能开发要点</h1>
        <h2 class="book-edition">第五版 (Fifth Edition)</h2>
        <div class="book-status">中文翻译修复版</div>
        <div class="cover-footer">2026年 完结版</div>
    </div>
</div>
<div style="page-break-after: always;"></div>
`;

const tocHtml = `
<div class="toc-page">
    <h1 class="toc-header">目录 (Table of Contents)</h1>
    <div class="toc-list">
        ${toc.map(h => `<div class="toc-item depth-${h.level}"><a href="#${h.id}">${h.text}</a></div>`).join('')}
    </div>
</div>
<div style="page-break-after: always;"></div>
`;

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&family=Noto+Sans+SC:wght@400;700&display=swap');
        :root { --primary-color: #1e3a8a; }
        body { font-family: 'Noto Serif SC', serif; font-size: 12pt; line-height: 1.8; color: #1a1a1a; background: white; margin: 0; padding: 0; }
        .main-body { padding: 2.54cm 3cm; max-width: 210mm; margin: 0 auto; background: white; text-align: justify; }
        .cover-page { height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; }
        .cover-content { border: 12px double var(--primary-color); padding: 60px; width: 80%; }
        .book-title { font-size: 4em; color: var(--primary-color); border: none; }
        .toc-list { display: flex; flex-direction: column; gap: 8px; }
        .toc-item a { text-decoration: none; color: #334155; display: block; border-bottom: 1px dotted #eee; }
        h1, h2, h3 { color: var(--primary-color); font-family: 'Noto Sans SC', sans-serif; font-weight: 700; }
        h1 { font-size: 2.4em; text-align: center; border-bottom: 2px solid #eee; page-break-before: always; padding-bottom: 0.5em; }
        h2 { font-size: 1.8em; border-left: 10px solid var(--primary-color); padding-left: 15px; background: #f8fafc; margin-top: 1.5em; padding: 10px; }
        p { text-indent: 2em; margin-bottom: 1.2em; }
        .img-box { margin: 2.5em 0; text-align: center; break-inside: avoid; border: 1px solid #eee; padding: 15px; border-radius: 8px; background: #fafafa; text-indent: 0; }
        img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
        .caption { font-size: 0.95em; color: #64748b; margin-top: 10px; font-weight: bold; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin: 2em 0; }
        th { background: var(--primary-color); color: white; padding: 10px; }
        td { border: 1px solid #eee; padding: 10px; }
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
console.log('🚀 渲染引擎已彻底优化：采用文件流加载，插图 100% 稳定！');
