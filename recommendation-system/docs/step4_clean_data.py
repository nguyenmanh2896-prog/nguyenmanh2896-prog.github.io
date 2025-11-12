print("=== BƯỚC 4: LÀM SẠCH DỮ LIỆU ===")

import gzip
import json
import pandas as pd
import re

def clean_text(text):
    """Làm sạch văn bản - cực kỳ quan trọng cho Content-Based Filtering"""
    if not isinstance(text, str):
        return ""
    # Chuyển thành chữ thường, xóa ký tự đặc biệt
    text = text.lower()
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
    return text

print("🧹 Đang làm sạch dữ liệu...")

# Đọc và làm sạch metadata
meta_data = []
with gzip.open('meta_Electronics.json.gz', 'rb') as f:
    for i, line in enumerate(f):
        if i >= 5000:  # Lấy 5000 sản phẩm đầu để demo
            break
        product = json.loads(line)
        
        # Làm sạch dữ liệu
        if 'title' in product:
            product['title_clean'] = clean_text(product['title'])
        if 'description' in product:
            product['description_clean'] = clean_text(product['description'])
        
        meta_data.append(product)

meta_df = pd.DataFrame(meta_data)
print(f"✅ Đã làm sạch {len(meta_df)} sản phẩm")

# Đọc và làm sạch reviews
reviews_data = []
with gzip.open('Electronics_5.json.gz', 'rb') as f:
    for i, line in enumerate(f):
        if i >= 10000:  # Lấy 10,000 reviews đầu
            break
        review = json.loads(line)
        
        # Chỉ giữ lại reviews có rating hợp lệ
        if 'overall' in review and 1 <= review['overall'] <= 5:
            reviews_data.append(review)

reviews_df = pd.DataFrame(reviews_data)
print(f"✅ Đã làm sạch {len(reviews_df)} reviews")

# Lọc chỉ lấy các sản phẩm có trong metadata
valid_products = set(meta_df['asin'].tolist())
reviews_df = reviews_df[reviews_df['asin'].isin(valid_products)]

print(f"📊 Sau khi làm sạch:")
print(f"   - Sản phẩm: {len(meta_df)}")
print(f"   - Reviews hợp lệ: {len(reviews_df)}")
print(f"   - Người dùng: {reviews_df['reviewerID'].nunique()}")

# Lưu dữ liệu đã làm sạch
meta_df.to_csv('cleaned_products.csv', index=False)
reviews_df.to_csv('cleaned_reviews.csv', index=False)

print("💾 Đã lưu dữ liệu đã làm sạch!")
print("🎯 Bước tiếp theo: Xây dựng Collaborative Filtering!")