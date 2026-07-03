# Minecraft 社团暑假项目网站

这是一个可交接的项目广场网站。访客可以浏览已审核项目和想法，也可以投稿项目、提交想法、申请加入项目；管理员可以审核、编辑和导出数据。

项目发起者投稿时会设置一个“项目管理密码”。项目审核公开后，发起者可以进入自己项目的管理页，处理加入申请、发布项目动态、提交项目资料修改申请，但不能进入全站后台。项目资料修改需要管理员审核后才会公开生效。

## 运行方式

1. 安装 Node.js 24 或更新版本。
2. 复制 `.env.example` 为 `.env`，填写后端 API 地址、管理密码和密钥。
3. 安装依赖并启动：

```bash
npm install
npm run dev
```

打开 `http://localhost:3000` 查看网站，后台在 `http://localhost:3000/admin`。

## 数据保存

所有数据都通过后端 API 接口读写，不再使用本地文件或 GitHub 私有仓库。请在环境变量里配置后端地址：

```env
BACKEND_API_BASE=http://localhost:8080/api
# 可选：后端接口的访问令牌
# BACKEND_API_TOKEN=your-backend-token
ADMIN_PASSWORD=change-this-password
ADMIN_SESSION_SECRET=replace-with-a-long-random-secret
```

- `BACKEND_API_BASE` 是后端服务的根地址，Next.js 端会从这里读写数据。
- `BACKEND_API_TOKEN` 如果配置了，会以 `Authorization: Bearer ...` 带在每次请求里。
- `ADMIN_PASSWORD` 是全站管理员共用的后台密码。
- `ADMIN_SESSION_SECRET` 用来保护管理员和项目发起者的登录状态，建议至少 32 位随机字符。

### 后端需要提供的接口

后端按集合名管理记录，集合包括：`projects`、`ideas`、`joinRequests`、`projectUpdates`、`projectComments`、`projectEditRequests`、`auditLogs`。

```text
GET    {base}/collections/{collection}          列出集合里的全部记录
GET    {base}/collections/{collection}/{id}     读取一条记录（找不到返回 404）
PUT    {base}/collections/{collection}/{id}     创建或覆盖一条记录，请求体为记录本身
DELETE {base}/collections/{collection}/{id}     删除一条记录（找不到返回 404）
```

响应体可以是 `{ code, status, msg, data }` 形式（取 `data` 字段），也可以直接是记录或数组。如果后端要求鉴权，把令牌配置到 `BACKEND_API_TOKEN` 即可。

## 主要入口

- `/`：公开首页，展示已审核项目和想法，项目广场支持搜索和筛选。
- `/submit`：投稿项目或想法。
- `/projects/项目ID`：项目详情和加入申请。
- `/projects/项目ID/manage`：项目发起者管理入口。
- `/admin`：全站管理员后台。

## 权限说明

- 访客：浏览公开项目、提交想法、投稿项目、申请加入项目。
- 项目发起者：只管理自己发起的项目，可以处理加入申请、发布项目动态、提交项目资料修改申请。
- 全站管理员：审核项目和想法、审核项目资料修改、编辑项目、隐藏项目动态、处理所有申请、导出数据、查看操作记录、重置项目管理密码。

## Vercel 部署交接

1. 把代码推到 GitHub 代码仓库。
2. 部署并启动后端服务，确认它实现了上面的接口。
3. 在 Vercel 导入代码仓库。
4. 在 Vercel 项目设置里添加环境变量。
5. 重新部署后即可使用。

## 数据在哪里

数据保存在后端服务里，按集合分类：

```text
projects / ideas / joinRequests / projectUpdates / projectComments / projectEditRequests / auditLogs
```

公开页面只展示审核通过的项目和想法；项目动态被管理员隐藏后不会公开展示。联系方式、项目管理密码哈希、操作记录只在后台数据里保存，不会展示到公开页面。

## 维护注意

- 不要把 `.env.local`、`.env`、`BACKEND_API_TOKEN` 或管理密码发到公开仓库。
- 不要把 `node_modules`、`.next` 打包上传。
- 如果 `npm audit` 提示 Next 内部的 PostCSS 依赖问题，不要直接运行 `npm audit fix --force`，它可能把 Next 降级到不兼容的旧版本；优先等待 Next 官方版本更新。
