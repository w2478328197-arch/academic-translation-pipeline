
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const katex = require('katex');

const projectRoot = __dirname;
const mdPath = path.join(projectRoot, 'translated', 'CSCS_MASTER_FINAL_CLEAN.md');
const imagesDir = path.join(projectRoot, 'images');

let markdown = fs.readFileSync(mdPath, 'utf8');

const toc = [];
const headerMap = {};

function slugify(text) {
    if (!text) return 'header-' + Math.random().toString(36).substr(2, 5);
    let slug = text.toString().toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5]+/g, '-') 
        .replace(/^-+|-+$/g, '');
    
    if (headerMap[slug]) {
        headerMap[slug]++;
        return `${slug}-${headerMap[slug]}`;
    }
    headerMap[slug] = 1;
    return slug || 'header';
}

const renderer = new marked.Renderer();
// 修正：marked v12+ heading 的参数是 token 对象
renderer.heading = function(token) {
    const text = token.text;
    const depth = token.depth;
    const id = slugify(text);
    
    if (depth <= 2) { 
        toc.push({ text, depth, id });
    }
    return `<h${depth} id="${id}">${text}</h${depth}>`;
};

// 保持图片渲染逻辑
renderer.image = function(token) {
    const href = token.href;
    const text = token.text || "";
    if (!href) return '';
    
    const cleanName = path.basename(href);
    const imgPath = path.join(imagesDir, cleanName);
    
    if (fs.existsSync(imgPath)) {
        const base64 = fs.readFileSync(imgPath).toString('base64');
        const isDrawing = cleanName.includes('_draw');
        const imgStyle = isDrawing ? 'max-height: 400px; width: auto;' : 'max-width: 100%;';
        return `<div class="img-box"><img src="data:image/jpeg;base64,${base64}" style="${imgStyle}"><div class="caption">${text}</div></div>`;
    }
    return `<p style="color:red;">[图片缺失: ${cleanName}]</p>`;
};

marked.use({ renderer });

// 公式预处理
markdown = markdown.replace(/\$\$([\s\S]*?)\$\$/g, (m, f) => {
    try { return `<div class="katex-display">${katex.renderToString(f.trim(), {displayMode:true, throwOnError:false})}</div>`; } catch(e) { return m; }
});
markdown = markdown.replace(/\$([^\$\n]+?)\$/g, (m, f) => {
    try { return katex.renderToString(f.trim(), {displayMode:false, throwOnError:false}); } catch(e) { return m; }
});

const htmlBody = marked.parse(markdown);

const tocHtml = `
<div class="toc-container">
    <h1 class="toc-title">目录 (Table of Contents)</h1>
    <ul class="toc-list">
        ${toc.map(item => `
            <li class="toc-item depth-${item.depth}">
                <a href="#${item.id}">${item.text}</a>
            </li>
        `).join('')}
    </ul>
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
        body { font-family: 'Noto Serif SC', serif; font-size: 12pt; line-height: 1.8; color: #1a1a1a; background: #f3f4f6; padding: 40px 0; }
        .main-body { padding: 2.54cm 3cm; max-width: 210mm; margin: 0 auto; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.1); text-align: justify; }
        .toc-container { padding: 2em 0; }
        .toc-title { margin-bottom: 1.5em; border-bottom: 2px solid var(--primary-color); padding-bottom: 0.5em; }
        .toc-list { list-style: none; padding: 0; }
        .toc-item { margin: 8px 0; }
        .toc-item.depth-1 { font-weight: bold; font-size: 1.2em; border-top: 1px solid #eee; padding-top: 10px; margin-top: 15px; }
        .toc-item.depth-2 { margin-left: 2em; font-size: 1em; color: #444; }
        .toc-item a { text-decoration: none; color: inherit; }
        .toc-item a:hover { color: var(--primary-color); text-decoration: underline; }
        h1, h2, h3 { color: var(--primary-color); font-family: 'Noto Sans SC', sans-serif; }
        h1 { font-size: 2.4em; text-align: center; border-bottom: 3px solid var(--primary-color); page-break-before: always; padding-bottom: 0.3em; margin-bottom: 1em; }
        h2 { font-size: 1.8em; border-left: 8px solid var(--primary-color); padding-left: 15px; background: #f8fafc; margin-top: 1.5em; }
        p { text-indent: 2em; margin-bottom: 1em; }
        .img-box { margin: 2em 0; text-align: center; break-inside: avoid; border: 1px solid #eee; padding: 15px; border-radius: 8px; background: #fafafa; text-indent: 0; }
        img { display: block; margin: 0 auto; border-radius: 4px; }
        .caption { font-size: 0.95em; color: #666; margin-top: 10px; font-weight: bold; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin: 2em 0; table-layout: fixed; word-wrap: break-word; }
        th { background: var(--primary-color); color: white; padding: 10px; border: 1px solid #ddd; text-align: left; }
        td { border: 1px solid #ddd; padding: 8px; vertical-align: top; }
        tr:nth-child(even) { background-color: #f9fafb; }
    </style>
</head>
<body>
    <div id="content" class="main-body">
        ${tocHtml}
        ${htmlBody}
    </div>
    <script>window.rendered = true;</script>
</body>
</html>
`;

fs.writeFileSync(path.join(projectRoot, 'full_book.html'), htmlContent);
console.log('🚀 目录功能修复成功！');
