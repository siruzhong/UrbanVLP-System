import os
import json
import csv

# 指定captions目录的路径
captions_dir = "streetview_captions/Beijing"

# 创建一个CSV文件并写入标题行
csv_file = "integrated_streetview_captions.csv"
with open(csv_file, 'w', newline='') as csvfile:
    fieldnames = ['streetview_img_name', 'caption']
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()

    # 遍历captions目录下的所有JSON文件
    for filename in os.listdir(captions_dir):
        if filename.endswith(".json"):
            json_file = os.path.join(captions_dir, filename)

            # 解析JSON文件
            with open(json_file, 'r') as jsonfile:
                data = json.load(jsonfile)

                # 提取图片名称和描述
                for img_path, caption in data.items():
                    img_name = os.path.basename(img_path)
                    img_name = img_name.split('/')[-1]  # 保留Beijing/后的部分
                    writer.writerow({'streetview_img_name': img_name, 'caption': caption})

