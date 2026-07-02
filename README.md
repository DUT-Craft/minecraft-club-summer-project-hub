# Minecraft 社团暑假项目网站

这是一个可交接的项目广场网站。访客可以浏览已审核项目和想法，也可以投稿项目、提交想法、申请加入项目；管理员可以审核、编辑和导出数据。

项目发起者投稿时会设置一个“项目管理密码”。项目审核公开后，发起者可以进入自己项目的管理页，处理加入申请、发布项目动态、提交项目资料修改申请，但不能进入全站后台。项目资料修改需要管理员审核后才会公开生效。

## 运行方式

1. 安装 Node.js 24 或更新版本。
2. 复制 `.env.example` 为 `.env`，修改管理密码和密钥。
3. 安装依赖并启动：

```bash
npm install
npm run dev
```

打开 `http://localhost:3000` 查看网站，后台在 `http://localhost:3000/admin`。

## 数据保存

默认使用本地文件模式：

```env
DATA_STORAGE=local
LOCAL_DATA_DIR=./data
```

这种模式适合负责人在自己的电脑上开发和临时演示，数据会保存到 `data/` 文件夹。请定期备份这个文件夹。

如果部署到 Vercel，建议改用 GitHub 私有仓库模式：

```env
DATA_STORAGE=github
GITHUB_TOKEN=github_pat_xxx
GITHUB_REPO=owner/private-data-repo
GITHUB_BRANCH=main
GITHUB_DATA_PATH=data
ADMIN_PASSWORD=change-this-password
ADMIN_SESSION_SECRET=replace-with-a-long-random-secret
```

GitHub Token 只需要给数据仓库的 Contents 读写权限。Token 只能放在 Vercel 环境变量里，不要写进代码。

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
2. 创建一个 GitHub 私有仓库专门保存数据。
3. 创建 GitHub Fine-grained token，只给数据仓库的 Contents 读写权限。
4. 在 Vercel 导入代码仓库。
5. 在 Vercel 项目设置里添加环境变量。
6. 重新部署后即可使用。

## 数据目录

部署到 Vercel 后，数据会保存到 GitHub 私有数据仓库里：

```text
data/projects
data/ideas
data/join-requests
data/project-updates
data/project-edit-requests
data/audit-logs
```

公开页面只展示审核通过的项目和想法，项目动态被管理员隐藏后不会公开展示。联系方式、项目管理密码哈希、操作记录只在后台数据里保存，不会展示到公开页面。

## 维护注意

- 不要把 `.env.local`、`.env`、GitHub Token 或管理密码发到公开仓库。
- 不要把 `node_modules`、`.next`、`data` 打包上传。
- 如果 `npm audit` 提示 Next 内部的 PostCSS 依赖问题，不要直接运行 `npm audit fix --force`，它可能把 Next 降级到不兼容的旧版本；优先等待 Next 官方版本更新。
