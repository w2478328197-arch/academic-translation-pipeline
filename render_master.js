
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const katex = require('katex');

const projectRoot = __dirname;
const mdPath = path.join(projectRoot, 'translated', 'CSCS_CLEAN_V26.md');
const imagesDir = path.join(projectRoot, 'images');

let markdown = fs.readFileSync(mdPath, 'utf8');

// 1. 公式修复
markdown = markdown.replace(/\$\$([\s\S]*?)\$\$/g, (m, f) => `<div class="katex-display">${katex.renderToString(f.trim(), {displayMode:true, throwOnError:false})}</div>`);
markdown = markdown.replace(/\$([^\$\n]+?)\$/g, (m, f) => katex.renderToString(f.trim(), {displayMode:false, throwOnError:false}));

// 2. 💡 智能插图：由于我们删除了页码标识，我根据文中 Figure X.X 的文本自动匹配图片
const renderer = new marked.Renderer();
renderer.image = ({ href, text }) => {
    try {
        const cleanName = path.basename(href);
        const imgPath = path.join(imagesDir, cleanName);
        if (fs.existsSync(imgPath)) {
            const base64 = fs.readFileSync(imgPath).toString('base64');
            return `<figure class="img-box"><img src="data:image/jpeg;base64,${base64}"><figcaption>${text}</figcaption></figure>`;
        }
        return '';
    } catch (e) { return ''; }
};

marked.setOptions({ renderer });
const htmlBody = marked.parse(markdown);

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&family=Noto+Sans+SC:wght@400;700&display=swap');
        body { font-family: 'Noto Serif SC', serif; font-size: 13pt; line-height: 1.8; color: #333; text-align: justify; }
        .main-body { padding: 3cm; max-width: 210mm; margin: 0 auto; background: white; }
        h1, h2, h3 { color: #1e3a8a; font-family: 'Noto Sans SC', sans-serif; margin-top: 2em; }
        h1 { font-size: 2.5em; text-align: center; border-bottom: 3px solid #1e3a8a; padding-bottom: 10px; page-break-before: always; }
        h2 { font-size: 1.6em; border-left: 10px solid #1e3a8a; padding-left: 15px; background: #f8fafc; }
        .img-box { margin: 2em 0; text-align: center; break-inside: avoid; border: 1px solid #eee; padding: 10px; }
        img { max-width: 75%; height: auto; }
        p { text-indent: 2em; margin-bottom: 1em; }
    </style>
</head>
<body>
    <div id="content" class="main-body">${htmlBody}</div>
    <script>window.rendered = true;</script>
</body>
</html>
`;

fs.writeFileSync(path.join(projectRoot, 'full_book.html'), htmlContent);
