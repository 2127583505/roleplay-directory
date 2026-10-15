# 灯下 · AI 角色卡目录

一个**纯静态、零成本、社区共建**的 AI 角色扮演角色卡目录站。

它记录「有哪些角色、在哪里能找到、是谁做的」，然后把你送到创作者那里去。

---

## 三条原则

| 原则 | 含义 |
| --- | --- |
| **不托管内容** | 只保存元数据，角色卡文件永远在创作者自己的地址上 |
| **不提供算力** | 没有在线对话。你在自己的软件里、用自己的模型来玩 |
| **不做推荐算法** | 排序只有最近更新 / 按名字 / 按创作者 |

这三条决定了本站的形态：**一个索引，而不是一个平台。**
也因此，它的运行成本是零，且不承担内容分发责任。

---

## 快速开始

```bash
npm install
npm run dev      # 本地开发，默认 http://localhost:4321
npm run build    # 构建静态站点到 dist/
npm run preview  # 预览构建结果
```

部署由 GitHub Actions 自动完成：推送到 `main` 即构建并发布到 GitHub Pages。

---

## 目录结构

```
src/
├── consts.ts                     站名、导航等全站配置 —— 改站名只改这里
├── content.config.ts             角色卡字段规范（唯一的数据权威）
├── content/characters/           一张卡 = 一个 .md 文件 = 一个 PR
├── lib/covers.ts                 确定性抽象封面的哈希与配色
├── components/
│   ├── Cover.astro               封面：外链图优先，缺省用抽象封面
│   └── CharacterCard.astro       目录卡片
├── layouts/Base.astro            全站布局
├── pages/
│   ├── index.astro               目录页（搜索 / 标签筛选 / 排序）
│   ├── c/[slug].astro            角色详情页
│   ├── creator/[id].astro        创作者主页
│   ├── import.astro              PNG / JSON 角色卡导入工具
│   ├── submit.astro              提交说明
│   ├── guide.astro               创作指南
│   ├── spec.astro                数据规范
│   └── about.astro               关于
└── styles/global.css             设计系统
```

---

## 添加一个角色

推荐用站内的**导入工具**：把已有的 PNG 或 JSON 角色卡拖进去，
浏览器会本地解析出元数据，补全后生成条目文件。

也可以手写：在 `src/content/characters/` 新建一个 `<文件名>.md`，
字段规范见 [`src/content.config.ts`](src/content.config.ts) 或站内的「数据规范」页。

文件名会成为网址，用小写字母、数字和连字符。

---

## 部署前必做

跑一次配置脚本，把仓库所有者占位符全部替换掉：

```bash
npm run set-owner -- 你的GitHub用户名
```

它会替换全项目的 `2127583505`，并把站点地址统一改成
`https://<用户名>.github.io`。之后到仓库 **Settings → Pages**
把 Source 设为 **GitHub Actions**，推到 `main` 就会自动发布。

如果之后绑了自定义域名，手动改两处：`astro.config.mjs` 的 `site`
和 `src/consts.ts` 的 `SITE.url`。

想改站名，改 `src/consts.ts` 里的 `SITE.name` 即可全站生效。

---

## 关于 `seed-cards/`

`seed-cards/` 里是 **8 张由维护者原创的示例角色卡**（Character Card V2 格式），
让站点开箱就有内容。

注意它们**不在站点代码里被直接读取** —— 条目通过外链指向这些文件，
走的是和所有创作者完全一样的路径。这是为了保持「只索引、不托管」的架构：
一旦目录站自己分发卡片文件，它就变成内容平台了。

详见 [`seed-cards/README.md`](seed-cards/README.md)。
不需要它们的话，把该目录和 `src/content/characters/` 下的对应文件一起删掉即可。

---

## 技术说明

- **Astro 静态生成**，产物是纯 HTML / CSS / 极少 JS
- **无后端、无数据库、无账号体系**，因此无运行成本
- **零 Web Font**，全部使用系统字体栈（中文字体包动辄 5–15MB）
- **封面兜底不画人**：没有封面图时生成确定性抽象封面（哈希取色 + 单字）
- 搜索、筛选、排序全部在浏览器里完成，不请求任何接口

---

## 授权

- **站点代码**：MIT
- **角色卡内容**：著作权归各创作者本人，授权方式由创作者在条目中标注

---

## 参与

提 PR 就可以。不熟悉 Git 的话，开一个 Issue 把你的信息贴出来，会有人帮你转成条目文件。

提交前请读一下 [`CONTRIBUTING.md`](CONTRIBUTING.md)。
