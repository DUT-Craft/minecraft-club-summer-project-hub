# 部署交接说明

这是一份给部署负责人的快速说明。请不要把 `.env.local`、`.env`、`BACKEND_API_TOKEN`、管理后台密码发到公开仓库。

## 1. 本地检查

收到项目后，先安装依赖并检查：

```bash
npm install
npm run typecheck
npm run build
```

本地预览：

```bash
npm run dev
```

公开站：

```text
http://localhost:3000
```

全站后台：

```text
http://localhost:3000/admin
```

项目发起者后台：

```text
http://localhost:3000/projects/项目ID/manage
```

## 2. 准备后端服务

本项目不再使用本地文件或 GitHub 私有仓库保存数据，所有数据都通过后端 API 接口读写。部署前请先准备一个实现了下面接口的后端服务。

后端按集合名管理记录，集合包括：`projects`、`ideas`、`joinRequests`、`projectUpdates`、`projectComments`、`projectEditRequests`、`auditLogs`。

```text
GET    {base}/collections/{collection}          列出集合里的全部记录
GET    {base}/collections/{collection}/{id}     读取一条记录（找不到返回 404）
PUT    {base}/collections/{collection}/{id}     创建或覆盖一条记录，请求体为记录本身
DELETE {base}/collections/{collection}/{id}     删除一条记录（找不到返回 404）
```

响应体可以是 `{ code, status, msg, data }` 形式（取 `data` 字段），也可以直接是记录或数组。

## 3. Vercel 部署

推荐部署方式：

1. 创建一个 GitHub 代码仓库，上传这个项目。
2. 部署并启动后端服务。
3. 在 Vercel 导入代码仓库。
4. 在 Vercel 项目设置里添加环境变量。

## 4. Vercel 环境变量

```env
BACKEND_API_BASE=https://your-backend-host/api
# BACKEND_API_TOKEN=your-backend-token
NEXT_PUBLIC_API_BASE=/api
ADMIN_PASSWORD=换成正式后台密码
ADMIN_SESSION_SECRET=换成一长串随机字符
```

说明：

- `BACKEND_API_BASE` 指向后端服务的根地址，全站数据都从这里读写。
- `BACKEND_API_TOKEN` 可选，配置后会以 `Authorization: Bearer ...` 带在每次后端请求里。
- `ADMIN_PASSWORD` 是全站管理员共用的后台密码。
- `ADMIN_SESSION_SECRET` 用来保护管理员和项目发起者的登录状态，建议至少 32 位随机字符。
- Vercel 重新部署后，全站后台地址是 `https://你的域名/admin`。

## 5. 权限结构

- 访客可以浏览、投稿、提交想法、申请加入项目。
- 项目发起者投稿项目时设置项目管理密码。
- 项目审核通过后，发起者可以进入 `/projects/项目ID/manage`。
- 发起者只能处理自己项目的加入申请、发布自己项目的动态、提交项目资料修改申请。
- 发起者提交的项目资料修改不会立刻公开，需要全站管理员在后台审核通过。
- 全站管理员可以审核所有内容、审核项目资料修改、隐藏项目动态、编辑项目、导出数据、查看操作记录、重置项目管理密码。

## 6. 数据在哪里

数据保存在后端服务里，按集合分类：

```text
projects / ideas / joinRequests / projectUpdates / projectComments / projectEditRequests / auditLogs
```

公开页面只展示审核通过的项目和想法；项目动态被管理员隐藏后不会公开显示；联系方式、项目管理密码哈希和操作记录只在后台数据里保存。

## 7. 常见问题

- 如果页面能打开但投稿失败，优先检查 Vercel 环境变量里的 `BACKEND_API_BASE`。
- 如果全站后台登录失败，检查 `ADMIN_PASSWORD` 是否配置在 Vercel 生产环境。
- 如果项目发起者登录失败，先确认项目已经被全站管理员审核公开。
- 如果发起者忘记项目管理密码，让全站管理员在 `/admin` 的项目编辑里重置。
- 如果后端返回 401/403，检查 `BACKEND_API_TOKEN` 是否和后端约定一致。
- 不建议运行 `npm audit fix --force`，它可能把 Next 降级到旧版本。
