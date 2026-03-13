import fitz  # PyMuPDF
import os
import re

pdf_path = os.path.expanduser("~/Desktop/cscs 第五版/Essenti..ng.pdf")
output_dir = os.path.expanduser("~/Desktop/CSCS_中文翻译工程/source")
image_dir = os.path.expanduser("~/Desktop/CSCS_中文翻译工程/images")

os.makedirs(output_dir, exist_ok=True)
os.makedirs(image_dir, exist_ok=True)

doc = fitz.open(pdf_path)

# 提取前 30 页
start_page = 0
end_page = 30

full_text = []

print("正在执行深度清洗提取...")

for page_num in range(start_page, end_page):
    page = doc.load_page(page_num)
    
    # 💡 技巧：忽略页眉页脚（剪裁掉上下各 50 像素）
    rect = page.rect
    clip_rect = fitz.Rect(0, 50, rect.width, rect.height - 50)
    
    # 分栏提取文本
    # 先提取左半部分，再提取右半部分
    mid_x = rect.width / 2
    left_rect = fitz.Rect(0, 50, mid_x, rect.height - 50)
    right_rect = fitz.Rect(mid_x, 50, rect.width, rect.height - 50)
    
    left_text = page.get_text("text", clip=left_rect).strip()
    right_text = page.get_text("text", clip=right_rect).strip()
    
    # 合并文本并修复断词（例如 "Stren- gth" 合并为 "Strength"）
    combined_text = left_text + "\n" + right_text
    combined_text = re.sub(r'(\w)-\n(\w)', r'\1\2', combined_text)
    combined_text = re.sub(r'(?<!\n)\n(?!\n)', ' ', combined_text) # 移除单行换行，保留段落换行
    
    # 插入图片占位符
    image_list = page.get_images(full=True)
    if image_list:
        combined_text += f"\n\n![图 {page_num+1}](images/page_{page_num+1}_img_0.jpeg)\n\n"
    
    full_text.append(f"# Page {page_num+1}\n\n" + combined_text)

# 保存清洗后的源文件
output_path = os.path.join(output_dir, "Chapter_Clean_V2.md")
with open(output_path, "w", encoding="utf-8") as f:
    f.write("\n\n---\n\n".join(full_text))

print(f"✅ 深度清洗提取完成: {output_path}")
