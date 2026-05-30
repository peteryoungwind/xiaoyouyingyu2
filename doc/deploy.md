好，那部署方案改成这套：

- **服务器系统**：CentOS

- **代码更新方式**：**本地打包/整理后，手动上传到服务器**

- **前后端同机部署**

- **小程序**：继续按微信官方流程发布

我直接给你整理成 **可执行的完整部署流程**。

---

# 一、整体部署架构

同一台 CentOS 服务器建议这样部署：

```Plain Text
用户/浏览器
   ↓
Nginx 80/443
   ├── /api   -> Spring Boot 8080
   └── /      -> Next.js 3000
```


建议目录：

```Shell
/opt/xiaoyouyingyu/
├── backend/
│   ├── app.jar
│   └── logs/
├── frontend/
│   ├── .next/
│   ├── package.json
│   ├── public/
│   └── logs/
├── upload/
├── scripts/
└── backups/
```


其中：

- `backend/` 放后端运行文件

- `frontend/` 放前端运行文件

- `upload/` 放你每次手动上传的压缩包

- `backups/` 放回滚备份

---

# 二、第一次上线部署流程

---

## 1）CentOS 安装基础环境

### 安装常用工具

```Shell
sudo yum install -y wget curl vim unzip tar
```


如果是 CentOS Stream / Rocky / AlmaLinux，也可用：

```Shell
sudo dnf install -y wget curl vim unzip tar
```


---

## 2）安装 Java 21

先看仓库里有没有：

```Shell
java -version
```


如果没有 Java 21，安装：

```Shell
sudo yum install -y java-21-openjdk java-21-openjdk-devel
```


检查：

```Shell
java -version
javac -version
```


---

## 3）安装 Node.js 20+

Next.js 生产环境建议 Node 20。

```Shell
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```


检查：

```Shell
node -v
npm -v
```


---

## 4）安装 Nginx

```Shell
sudo yum install -y nginx
```


开机启动：

```Shell
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl status nginx
```


---

## 5）创建部署目录

```Shell
sudo mkdir -p /opt/xiaoyouyingyu/backend/logs
sudo mkdir -p /opt/xiaoyouyingyu/frontend/logs
sudo mkdir -p /opt/xiaoyouyingyu/upload
sudo mkdir -p /opt/xiaoyouyingyu/scripts
sudo mkdir -p /opt/xiaoyouyingyu/backups
```


---

## 6）准备上传内容

因为你是 **手动上传**，建议本地准备两部分：

### 后端上传内容

本地执行：

```Shell
mvn clean package -DskipTests
```


生成：

```Shell
target/xiaoyouyingyu-1.0-SNAPSHOT.jar
```


上传后放到：

```Shell
/opt/xiaoyouyingyu/backend/app.jar
```


---

### 前端上传内容

前端建议上传 **源码**，然后在服务器构建。

本地整理前端目录，至少包含：

```Shell
frontend/
  package.json
  package-lock.json
  next.config.js
  public/
  src/
  tsconfig.json
  tailwind.config.js
```


压缩上传：

```Shell
tar -czf frontend-release.tar.gz frontend
```


上传到：

```Shell
/opt/xiaoyouyingyu/upload/
```


然后服务器解压到：

```Shell
/opt/xiaoyouyingyu/frontend/
```


> 不建议把本地 `.next` 直接上传到服务器复用，最稳的是服务器重新 `npm install`、`npm run build`。

---

## 7）后端生产配置

你这个项目上线前，建议把敏感配置改成环境变量，不要写死在 `application.yml`。

例如改成：

```YAML
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}

app:
  jwt:
    secret: ${APP_JWT_SECRET}
    expiration-ms: ${APP_JWT_EXPIRATION_MS:86400000}
  ai:
    api-key: ${APP_AI_API_KEY}
    api-url: ${APP_AI_API_URL}
    model: ${APP_AI_MODEL:gpt-4o}
```


如果暂时不改代码，也能部署，但**不推荐**。

---

## 8）配置后端 systemd 服务

创建：

```Shell
sudo vim /etc/systemd/system/xiaoyouyingyu-backend.service
```


写入：

```Properties files
[Unit]
Description=Xiaoyouyingyu Backend
After=network.target

[Service]
User=root
WorkingDirectory=/opt/xiaoyouyingyu/backend
Environment="SPRING_DATASOURCE_URL=jdbc:mysql://127.0.0.1:3306/xiaoyouyingyu?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai"
Environment="SPRING_DATASOURCE_USERNAME=root"
Environment="SPRING_DATASOURCE_PASSWORD=pzq18217074393"
Environment="APP_JWT_SECRET=n7Qv2Kp9Xc4mL8tR1yF6uD3sW0zH5jNqB2eG9aV4rT7kM1pC"
Environment="APP_JWT_EXPIRATION_MS=86400000"
Environment="APP_AI_API_KEY=sk-Z6mBSV3LAK2yp1T67ThtU1PBJFvXy50m8zEJMMuVYALEG8af"
Environment="APP_AI_API_URL=https://api.gptgod.online/v1/chat/completions"
Environment="APP_AI_MODEL=gpt-4o"
ExecStart=/usr/local/jdk21/bin/java -jar /opt/xiaoyouyingyu/backend/app.jar
SuccessExitStatus=143
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```


启动：

```Shell
sudo systemctl daemon-reload
sudo systemctl enable xiaoyouyingyu-backend
sudo systemctl start xiaoyouyingyu-backend
sudo systemctl status xiaoyouyingyu-backend
```


日志：

```Shell
journalctl -u xiaoyouyingyu-backend -f
```


---

## 9）部署前端并构建

假设你上传了 `frontend-release.tar.gz` 到：

```Shell
/opt/xiaoyouyingyu/upload/frontend-release.tar.gz
```


解压：

```Shell
cd /opt/xiaoyouyingyu
rm -rf frontend
tar -xzf /opt/xiaoyouyingyu/upload/frontend-release.tar.gz
```


如果解压后目录层级不对，手动调整到：

```Shell
/opt/xiaoyouyingyu/frontend
```


进入前端目录安装依赖并构建：

```Shell
cd /opt/xiaoyouyingyu/frontend
npm install
npm run build
```


---

## 10）配置前端 systemd 服务

创建：

```Shell
sudo vim /etc/systemd/system/xiaoyouyingyu-frontend.service
```


写入：

```Properties files
[Unit]
Description=Xiaoyouyingyu Frontend
After=network.target

[Service]
User=root
WorkingDirectory=/opt/xiaoyouyingyu/frontend
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/npm run start
SuccessExitStatus=143
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```


启动：

```Shell
sudo systemctl daemon-reload
sudo systemctl enable xiaoyouyingyu-frontend
sudo systemctl start xiaoyouyingyu-frontend
sudo systemctl status xiaoyouyingyu-frontend
```


日志：

```Shell
journalctl -u xiaoyouyingyu-frontend -f
```


---

## 11）配置 Nginx

CentOS 常见配置目录：

```Shell
/etc/nginx/nginx.conf
/etc/nginx/conf.d/
```


建议新建：

```Shell
sudo vim /etc/nginx/conf.d/xiaoyouyingyu.conf
```


写入：

```Nginx
# 80: 统一跳转 HTTPS
server {
    listen 80;
    server_name xiaoyou-ky.top;
    return 301 https://$host$request_uri;
}

# 443: HTTPS 正式服务
server {
    listen 443 ssl http2;
    server_name xiaoyou-ky.top;

    # 证书
    ssl_certificate     /etc/nginx/ssl/xiaoyou-ky.top/xiaoyou-ky.top.pem;
    ssl_certificate_key /etc/nginx/ssl/xiaoyou-ky.top/xiaoyou-ky.top.key;

    # TLS 建议配置
    ssl_session_timeout 10m;
    ssl_session_cache shared:SSL:10m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers off;

    client_max_body_size 20m;

    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

```


测试配置：

```Shell
sudo nginx -t
```


重载：

```Shell
sudo systemctl reload nginx
```


---

## 12）放行端口和 SELinux

### 防火墙

```Shell
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```


如果 8080/3000 只给本机访问，**不用对外开放**。

---

### SELinux

CentOS 上如果开启 SELinux，Nginx 代理时可能被拦。

先查看：

```Shell
getenforce
```


如果是 `Enforcing`，执行：

```Shell
sudo setsebool -P httpd_can_network_connect 1
```


这个很重要，不然 Nginx 可能无法代理到 3000/8080。

---

## 13）HTTPS 证书(跳过)

如果你有域名，建议上 HTTPS。

CentOS 安装 certbot 方式会因版本略不同。常见做法：

```Shell
sudo yum install -y certbot python3-certbot-nginx
```


然后：

```Shell
sudo certbot --nginx -d 你的域名
```


如果 `certbot` 包不可用，再按你服务器实际版本补 EPEL 源或改 snap 方案。

---

## 14）首次上线验收

上线后检查：

- [ ] 域名能打开首页

- [ ] `/api/topics` 可访问

- [ ] 登录注册正常

- [ ] 管理后台正常

- [ ] AI 接口正常

- [ ] systemd 重启后服务自动恢复

- [ ] Nginx 代理正常

- [ ] HTTPS 正常

---

# 三、后续代码更新流程（手动上传版）

你已经明确 **不用 git pull**，那后续更新就走这个流程。

---

## 更新原则

每次更新固定做 6 步：

1. 本地修改代码

2. 本地构建/检查

3. 手动上传文件

4. 服务器备份旧版本

5. 替换并重启服务

6. 验收

---

## A. 后端更新流程

### 1）本地打包

```Shell
mvn clean package -DskipTests
```


得到：

```Shell
target/xiaoyouyingyu-1.0-SNAPSHOT.jar
```


### 2）上传到服务器

上传到：

```Shell
/opt/xiaoyouyingyu/upload/
```


例如上传成：

```Shell
/opt/xiaoyouyingyu/upload/app-new.jar
```


### 3）备份旧版本

```Shell
cp /opt/xiaoyouyingyu/backend/app.jar /opt/xiaoyouyingyu/backups/app-$(date +%F-%H%M%S).jar
```


### 4）替换新版本

```Shell
cp /opt/xiaoyouyingyu/upload/app-new.jar /opt/xiaoyouyingyu/backend/app.jar
```


### 5）重启后端

```Shell
sudo systemctl restart xiaoyouyingyu-backend
sudo systemctl status xiaoyouyingyu-backend
```


### 6）看日志

```Shell
journalctl -u xiaoyouyingyu-backend -n 100 --no-pager
```


---

## B. 前端更新流程

### 1）本地整理前端源码包

在项目根目录打包：

```Shell
tar -czf frontend-release.tar.gz frontend
```


### 2）上传到服务器

上传到：

```Shell
/opt/xiaoyouyingyu/upload/frontend-release.tar.gz
```


### 3）备份旧前端目录

```Shell
mv /opt/xiaoyouyingyu/frontend /opt/xiaoyouyingyu/backups/frontend-$(date +%F-%H%M%S)
```


### 4）解压新前端

```Shell
cd /opt/xiaoyouyingyu
tar -xzf /opt/xiaoyouyingyu/upload/frontend-release.tar.gz
```


确保解压后目录是：

```Shell
/opt/xiaoyouyingyu/frontend
```


### 5）安装依赖并构建

```Shell
cd /opt/xiaoyouyingyu/frontend
npm install
npm run build
```


### 6）重启前端

```Shell
sudo systemctl restart xiaoyouyingyu-frontend
sudo systemctl status xiaoyouyingyu-frontend
```


### 7）看日志

```Shell
journalctl -u xiaoyouyingyu-frontend -n 100 --no-pager
```


---

# 四、推荐的实际更新顺序

如果一次前后端都更新，建议顺序：

7. 上传后端 jar

8. 上传前端压缩包

9. 备份旧后端 jar

10. 替换后端 jar

11. 重启后端并确认正常

12. 备份旧前端目录

13. 替换前端源码

14. `npm install && npm run build`

15. 重启前端

16. 验收页面和接口

这样如果后端出错，前端先别动，更容易定位。

---

# 五、回滚方案

---

## 后端回滚

查看备份：

```Shell
ls /opt/xiaoyouyingyu/backups/
```


恢复旧 jar：

```Shell
cp /opt/xiaoyouyingyu/backups/app-某个时间.jar /opt/xiaoyouyingyu/backend/app.jar
sudo systemctl restart xiaoyouyingyu-backend
```


---

## 前端回滚

恢复旧目录：

```Shell
rm -rf /opt/xiaoyouyingyu/frontend
cp -r /opt/xiaoyouyingyu/backups/frontend-某个时间 /opt/xiaoyouyingyu/frontend
sudo systemctl restart xiaoyouyingyu-frontend
```


---

# 六、数据库更新注意事项

如果代码更新涉及表结构：

17. **先备份数据库**

18. 再替换后端 jar

19. 启动后重点看启动日志里 Hibernate 的表结构变更信息

备份示例：

```Shell
mysqldump -uroot -p xiaoyouyingyu > /opt/xiaoyouyingyu/backups/db-$(date +%F-%H%M%S).sql
```


---

# 七、微信小程序上线流程

你这里不变，继续单独走：

20. 本地开发

21. 微信开发者工具测试

22. 上传体验版

23. 提交审核

24. 审核通过后发布

注意：

- 请求域名必须配置为正式 **HTTPS 域名**

- 小程序正式环境不要直连 IP

- 要在微信后台配置合法 request 域名

---

# 八、你这个项目上线前强烈建议处理的点

结合你当前项目文档，正式上线前至少建议处理：

- [ ] `application.yml` 中敏感信息改环境变量

- [ ] 更换 JWT 默认密钥

- [ ] 检查管理员初始化逻辑，避免生产环境每次启动重置 admin 密码

- [ ] `GET /api/admin/users` 不返回密码 hash

- [ ] 前端 API 统一走 `/api`

- [ ] 开 HTTPS

- [ ] 做数据库备份

---

# 九、最简执行版

## 第一次上线

25. CentOS 安装 Java 21 / Node 20 / Nginx

26. 建 `/opt/xiaoyouyingyu` 目录

27. 上传后端 jar

28. 上传前端源码包

29. 配置后端 systemd

30. 配置前端 systemd

31. 配置 Nginx

32. 开防火墙和 SELinux 代理权限

33. 配 HTTPS

34. 验收

## 后续更新

35. 本地打后端 jar

36. 本地打前端压缩包

37. 上传到 `/opt/xiaoyouyingyu/upload/`

38. 备份旧版本

39. 替换后端并重启

40. 替换前端并构建重启

41. 验收

42. 有问题就回滚

---

如果你要，我下一条可以直接给你一份 **CentOS 可直接用的正式部署文档**，包括：

- `nginx.conf` 完整示例

- `xiaoyouyingyu-backend.service`

- `xiaoyouyingyu-frontend.service`

- 手动上传版 `deploy_backend.sh`

- 手动上传版 `deploy_frontend.sh`

你直接复制到服务器就能用。

