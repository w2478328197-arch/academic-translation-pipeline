# 学术书籍自动翻译与精排版流水线 (Academic Book Translation Pipeline)

这是一个自动化的学术书籍翻译与精排版流水线模板。

## 目录结构
- `source_full/`: 存放原始 PDF 提取的英文文本（每页一个 txt 文件）。
- `translated/`: 存放已完成的高质量中文翻译片段（Markdown 格式）。
- `images/`: 存放统一的高清插图库（包含位图与矢量渲染图）。
- `tools/`: 审计工具与合并脚本。
- `render_master.js`: 核心 HTML 渲染引擎（含公式预处理和插图自动对齐）。
- `print_pdf.js`: 基于 Puppeteer 的 PDF 打印引擎。

## 部署步骤
1. **安装 Node.js**: 确保电脑安装了 Node.js 18+。
2. **安装依赖**:
   ```bash
   npm install
   ```
3. **统一流水线（推荐）**:
   - 全流程（合并 + 审计 + 渲染 + 打印）:
     ```bash
     npm run pipeline
     ```
   - 仅快速冒烟（小样本）:
     ```bash
     npm run smoke
     ```
4. **提交前技术核对（不渲染）**:
   ```bash
   npm run check
   ```

## 新项目配置入口
- 统一配置文件: `config/pipeline.json`
- 通用模板配置: `config/pipeline.template.json`

## 注意事项
- **公式**: 采用服务器端 KaTeX 预渲染，严禁在正文中改动 `$ ... $` 内部内容。
- **插图**: 图片名必须遵循 `page_XX_img_X.jpeg` 格式以便自动对齐。
- **去噪**: 脚本会自动过滤掉孤立的页码数字，请保持段落连贯。
