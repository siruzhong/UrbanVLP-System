### 部署网站

1. 将你的网站文件上传到服务器。

2. 编辑 `/www/server/nginx/conf/nginx.conf` 文件，添加配置到 `include /www/server/panel/vhost/nginx/*.conf` 前

    ```
    server {
    listen 9888;
    server_name 111.230.109.230;

    root /root/UrbanCLIP-System;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    error_page 404 /404.html;

    location ~ /\. {
        deny all;
    }
    ```

3. 检查 Nginx 配置是否正确：
   ```
   sudo nginx -t
   ```

4. 如果没有错误，重新加载 Nginx 以应用更改：
   ```
   sudo systemctl reload nginx
   ```

现在，当你访问你的域名时，应该能够看到你的网站内容，端口配置可见：http://t.csdnimg.cn/Gwnmh

请注意，以上步骤是为静态网站部署设置的。如果你正在部署一个使用 PHP、Node.js、Python 等后端技术的网站，那么还需要更多的配置。