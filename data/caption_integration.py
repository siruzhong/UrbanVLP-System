import csv
import json

# 从所有json文件中读取描述
captions_dict = {}
json_files = ["Beijing_captions.json", "Guangzhou_captions.json", "Shanghai_captions.json", "Shenzhen_captions.json"]

for json_file in json_files:
    with open('caption/' + json_file, 'r') as f:
        data = json.load(f)
        for item in data[0]:
            image_name = item['image']
            if image_name not in captions_dict:
                captions_dict[image_name] = []
            captions_dict[image_name].append(item['caption'])

# 为每张图片合并描述
for image_name, captions in captions_dict.items():
    captions_dict[image_name] = "; ".join(captions)

# 更新csv文件
updated_rows = []
with open("integrated_satellite_data.csv", 'r') as csv_file:
    reader = csv.DictReader(csv_file)
    fields = reader.fieldnames
    fields.append('caption')  # 添加新的列标题

    for row in reader:
        image_name = row['satellite_img_name']
        if image_name in captions_dict:
            row['caption'] = captions_dict[image_name]
        else:
            row['caption'] = ''  # 如果找不到描述，则留空
        updated_rows.append(row)

# 写入新的csv文件
with open("integrated_satellite_data_with_captions.csv", 'w', newline='') as new_csv_file:
    writer = csv.DictWriter(new_csv_file, fieldnames=fields)
    writer.writeheader()
    for row in updated_rows:
        writer.writerow(row)
