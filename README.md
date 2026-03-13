
# CSCS 第五版 中文翻译工程

这是一个自动化的学术书籍翻译与精排版流水线。

## 目录结构
- `source_full/`: 原始 PDF 提取的 1876 页英文文本。
- `translated/`: 已完成的高质量中文翻译片段。
- `images/`: 统一的高清插图库（包含位图与矢量渲染图）。
- `tools/`: 审计工具 (`auditor.py`) 和 合并脚本。
- `render_master.js`: 核心 HTML 渲染引擎（含公式预处理和插图自动对齐）。
- `print_pdf.js`: 基于 Puppeteer 的 PDF 打印引擎。

## 回家后的部署步骤
1. **安装 Node.js**: 确保电脑安装了 Node.js 18+。
2. **安装依赖**:
   ```bash
   npm install
   ```
3. **生成最新的 PDF**:
   ```bash
   npm run render
   ```
4. **继续翻译新章节**:
   - 从 `source_full/` 拷贝对应页码的 txt。
   - 翻译并存入 `translated/`。
   - 在 `render_master.js` 中追加文件名。
   - 再次运行 `npm run render`。

## 注意事项
- **公式**: 采用服务器端 KaTeX 预渲染，严禁在正文中改动 `$ ... $` 内部内容。
- **插图**: 图片名必须遵循 `page_XX_img_X.jpeg` 格式以便自动对齐。
- **去噪**: 脚本会自动过滤掉孤立的页码数字，请保持段落连贯。
