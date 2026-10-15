# 灯下

一个 AI 角色卡目录。上面有各种类型的角色，每一个都由喜欢角色扮演的人自己写、自己放上来。

**线上站点** → https://2127583505.github.io/roleplay-directory/

---

## 你可能想做的是这些

### 「我只是想找个角色来玩」

打开上面的链接就行。

搜名字、按标签筛，点进任何一个角色，能看到他的人设、开场白，还有一句「怎么开始」。页面底部有下载链接，点一下把文件拿走，在你自己平时用的角色扮演软件里导入就能开始聊。

第一次导入可能要摸索两分钟，摸过一次就顺了。

### 「我想写一个自己的角色」

站点里有 **[写一个角色](https://2127583505.github.io/roleplay-directory/start/)** 引导，从「他是个什么样的人」开始问起，回答几个问题就写出来了 —— 不需要会写代码，也不需要会写小说。

写完之后可以提交到目录上，让别人也能搜到他。

不知道怎么动笔的话，**[创作指南](https://2127583505.github.io/roleplay-directory/guide/)** 里有具体的写法（包括「这样不行 / 这样好」的对照）。

### 「我想自己搭一个一样的站」

往下看「自己部署」。整套东西是纯静态的，托管成本为零。

---

## 它是怎么运作的

一句话：**这个目录只存介绍和下载链接，不存角色卡本身。**

角色卡文件一直在创作者自己那里 —— 自己的仓库、网盘、IPFS 都可以。这样做有两个直接结果：

- 站点可以完全是静态页面，托管在免费服务上。没有服务器，没有数据库，运行成本是零。
- 站点不复制、不分发任何人的作品。卡片的所有权和责任都在创作者手里。

所以「加一个角色」不是上传文件，而是**提交一条索引**。

提交走的是 GitHub 的 Issue 表单：填完点提交，会自动生成条目文件并开一个 PR，你只要确认合并。**不需要你会用 Git。**

---

## 自己部署

```bash
npm install
npm run dev      # 本地预览，默认 http://localhost:4321
npm run build    # 构建静态站点到 dist/
npm run preview  # 预览构建结果
```

推送到 `main` 之后，GitHub Actions 会自动构建并发布到 GitHub Pages。

### 改成你自己的

跑一次配置脚本，把占位符和站点地址都换掉：

```bash
npm run set-owner -- 你的GitHub用户名
```

仓库名不是 `roleplay-directory` 的话，加上第二个参数：

```bash
npm run set-owner -- 你的GitHub用户名 你的仓库名
```

然后到仓库的 **Settings → Pages**，把 **Source 设为 `GitHub Actions`**。

> 这一步 GitHub 不允许 Actions 自己做，必须仓库管理员手动点一次。
> 没点的话，构建会成功但站点打不开。

### 本地开发要注意的一点

`astro.config.mjs` 里的 `base` 必须跟仓库名一致：

```js
base: '/roleplay-directory',   // 仓库名是什么，这里就是什么
```

GitHub Pages 的项目仓库部署在子路径下（`https://用户名.github.io/仓库名/`），
base 写错的话样式和所有链接都会 404。

想绑自定义域名或者部署在根路径，把 base 改成 `'/'` 即可 ——
`src/consts.ts` 会自动跟着变，不用改别处。

---

## 项目结构

```
src/
├── consts.ts                  站名、导航等全站配置 —— 改站名只改这里
├── content.config.ts          角色卡字段规范（唯一的数据权威）
├── content/characters/        一个角色 = 一个 .md 文件
├── lib/covers.ts              没有封面图时生成抽象封面的逻辑
├── components/
│   ├── Cover.astro            封面：有图用图，没图自动生成
│   └── CharacterCard.astro    目录卡片
├── layouts/Base.astro         全站布局
├── pages/
│   ├── index.astro            目录页（搜索 / 标签 / 排序）
│   ├── c/[slug].astro         角色详情页
│   ├── creator/[id].astro     创作者主页
│   ├── start.astro            写一个角色（分步引导）
│   ├── import.astro           导入已有的角色卡
│   ├── submit.astro           提交说明
│   ├── guide.astro            创作指南
│   ├── spec.astro             数据规范
│   └── about.astro            这里是什么
└── styles/global.css          设计系统

seed-cards/                    8 张示例角色卡（Character Card V2 格式）
.github/
├── workflows/                 自动部署 + PR 校验 + 表单转条目
└── ISSUE_TEMPLATE/            结构化提交表单
```

---

## 技术说明

- **Astro 静态生成**，产物是纯 HTML / CSS / 极少 JS（全站 JS 只有几 KB）
- **无后端、无数据库、无账号体系**，所以没有运行成本
- **零 Web Font**，全部使用系统字体栈 —— 中文字体包动辄 5–15MB，用不起
- **搜索、筛选、排序全在浏览器里完成**，不请求任何接口
- **没有封面图时不画人**：按名字哈希生成一张确定性的抽象封面（柔和渐变 + 单字），
  每次渲染都一样，不需要存储

全站中文，移动端优先。

---

## 授权

- **站点代码**：MIT。想 fork 一份做自己的目录站，直接拿去用。
- **角色卡内容**：著作权归各创作者本人，授权方式由创作者在条目里标注。
- **`seed-cards/` 里的示例卡**：由本项目创作，以 CC BY-NC-SA 4.0 发布。

---

## 参与

提 PR 就行，代码、样式、文案都欢迎。

想加一个角色的话，用站点里的提交表单最省事；
要直接改文件，先读一下 [CONTRIBUTING.md](CONTRIBUTING.md)，字段定义见 [spec 页](https://2127583505.github.io/roleplay-directory/spec/)。

不熟悉 Git 也没关系 —— 开一个 [Issue](https://github.com/2127583505/roleplay-directory/issues) 把信息贴出来，会有人帮你转成条目。
