# 部署交接说明

这是一份给部署负责人的快速说明。请不要把 `.env.local`、`.env`、GitHub Token、管理后台密码发到公开仓库。

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

## 2. Vercel 部署

推荐部署方式：

1. 创建一个 GitHub 代码仓库，上传这个项目。
2. 创建一个 GitHub 私有数据仓库，例如 `minecraft-club-data`。
3. 在 GitHub 创建 Fine-grained token，只给数据仓库的 Contents 读写权限。
4. 在 Vercel 导入代码仓库。
5. 在 Vercel 项目设置里添加环境变量。

## 3. Vercel 环境变量

```env
DATA_STORAGE=github
GITHUB_TOKEN=github_pat_xxx
GITHUB_REPO=你的用户名/minecraft-club-data
GITHUB_BRANCH=main
GITHUB_DATA_PATH=data
ADMIN_PASSWORD=换成正式后台密码
ADMIN_SESSION_SECRET=换成一长串随机字符
```

说明：

- `GITHUB_REPO` 填保存数据的私有仓库，不是代码仓库。
- `ADMIN_PASSWORD` 是全站管理员共用的后台密码。
- `ADMIN_SESSION_SECRET` 用来保护管理员和项目发起者的登录状态，建议至少 32 位随机字符。
- Vercel 重新部署后，全站后台地址是 `https://你的域名/admin`。

## 4. 权限结构

- 访客可以浏览、投稿、提交想法、申请加入项目。
- 项目发起者投稿项目时设置项目管理密码。
- 项目审核通过后，发起者可以进入 `/projects/项目ID/manage`。
- 发起者只能处理自己项目的加入申请、发布自己项目的动态、提交项目资料修改申请。
- 发起者提交的项目资料修改不会立刻公开，需要全站管理员在后台审核通过。
- 全站管理员可以审核所有内容、审核项目资料修改、隐藏项目动态、编辑项目、导出数据、查看操作记录、重置项目管理密码。

## 5. 数据在哪里

部署到 Vercel 后，数据保存到 GitHub 私有数据仓库：

```text
data/projects
data/ideas
data/join-requests
data/project-updates
data/project-edit-requests
data/audit-logs
```

公开页面只展示审核通过的项目和想法；项目动态被管理员隐藏后不会公开显示；联系方式、项目管理密码哈希和操作记录只在后台数据里保存。

## 6. 常见问题

- 如果页面能打开但投稿失败，优先检查 Vercel 环境变量。
- 如果全站后台登录失败，检查 `ADMIN_PASSWORD` 是否配置在 Vercel 生产环境。
- 如果项目发起者登录失败，先确认项目已经被全站管理员审核公开。
- 如果发起者忘记项目管理密码，让全站管理员在 `/admin` 的项目编辑里重置。
- 如果 GitHub 数据仓库没有新文件，检查 Token 是否有 Contents 读写权限。
- 不建议运行 `npm audit fix --force`，它可能把 Next 降级到旧版本。
