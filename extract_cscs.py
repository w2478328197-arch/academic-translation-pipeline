import fitz  # PyMuPDF
import os
import sys

pdf_path = os.path.expanduser("~/Desktop/cscs 第五版/Essenti..ng.pdf")
output_dir = os.path.expanduser("~/Desktop/CSCS_中文翻译工程/source")
image_dir = os.path.expanduser("~/Desktop/CSCS_中文翻译工程/images")

# 确保目录存在
os.makedirs(output_dir, exist_ok=True)
os.makedirs(image_dir, exist_ok=True)

try:
    doc = fitz.open(pdf_path)
    print(f"✅ 成功加载 PDF，共 {doc.page_count} 页ảng。")
except Exception as e:
    print(f"❌ 无法打开 PDF: {e}")
    sys.exit(1)

# 我们先提取前 30 页作为“样板间”测试
start_page = 0
end_page = min(30, doc.page_count)

text_content = ""

print("开始提取文本和图片...")
for page_num in range(start_page, end_page):
    page = doc.load_page(page_num)
    
    # 提取文本（使用 "blocks" 以保持段落结构，防止双栏错乱）
    blocks = page.get_text("blocks")
    # 按垂直位置排序，再按水平位置排序
    blocks.sort(key=lambda b: (b[1], b[0])) 
    
    for b in blocks:
        if b[6] == 0:  # 类型为文本
            text_content += b[4] + "\n"
            
    # 提取图片
    image_list = page.get_images(full=True)
    for img_index, img in enumerate(image_list):
        xref = img[0]
        base_image = doc.extract_image(xref)
        image_bytes = base_image["image"]
        image_ext = base_image["ext"]
        
        image_name = f"page_{page_num+1}_img_{img_index}.{image_ext}"
        image_filepath = os.path.join(image_dir, image_name)
        
        with open(image_filepath, "wb") as f:
            f.write(image_bytes)
            
        # 在文本中插入图片占位符
        text_content += f"\n\n![图 {page_num+1}-{img_index}](../images/{image_name})\n\n"
        
    text_content += f"\n\n--- [Page {page_num+1} End] ---\\n\n"

# 保存提取的文本
output_txt_path = os.path.join(output_dir, "Chapter_Sample_1_30.md")
with open(output_txt_path, "w", encoding="utf-8") as f:
    f.write(text_content)

print(f"✅ 提取完成！文本保存在: {output_txt_path}")
print(f"✅ 图片保存在: {image_dir}")
