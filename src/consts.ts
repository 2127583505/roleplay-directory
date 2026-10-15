/**
 * 全站配置。想改站名、导航、域名，只改这里。
 */

/**
 * 站点部署的基路径（不带结尾斜杠）。
 *
 * GitHub Pages 的**项目仓库**部署在子路径下：
 *   https://<用户名>.github.io/<仓库名>/
 * 所以 astro.config.mjs 里的 base 必须是 /<仓库名>，
 * 否则构建出的 CSS/JS 和所有内部链接都会 404。
 *
 * 这个值自动跟随 astro.config.mjs 的 base，不用重复维护。
 * 如果部署在根路径（自定义域名、Cloudflare Pages 等），
 * 把 base 改成 '/' 即可，这里会跟着变成空。
 */
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

/**
 * 生成带 base 前缀的内部链接。
 *
 * 站内所有跳转都必须走它 —— 直接写 href="/guide/" 在子路径部署下会挂。
 */
export const href = (path: string): string =>
  `${BASE}${path.startsWith('/') ? path : `/${path}`}`;

/**
 * 去掉 pathname 上的 base 前缀，用于判断当前处于哪个导航项。
 * Astro.url.pathname 是带 base 的，不能直接和导航路径比较。
 */
export const stripBase = (pathname: string): string => {
  if (!BASE || !pathname.startsWith(BASE)) return pathname || '/';
  return pathname.slice(BASE.length) || '/';
};

/** 生成带域名的完整地址，用于徽章、分享、复制链接等场景 */
export const absUrl = (path: string): string =>
  `${SITE.url.replace(/\/+$/, '')}${href(path)}`;

export const SITE = {
  /** 站名。改这里即可全站生效 */
  name: '灯下',
  /** 用于 <title> 后缀与页脚 */
  description: '各种类型的角色都在这里。挑一个，复制一段话，粘进豆包或 DeepSeek 就能聊',
  /** 站点地址，不含 base。改域名时同步修改 astro.config.mjs 的 site */
  url: 'https://2127583505.github.io',
  /** 仓库地址，用于「提交角色卡」等入口 */
  repo: 'https://github.com/2127583505/roleplay-directory',
} as const;

/** 主导航。路径不带 base，渲染时用 href() 处理 */
export const NAV = [
  { path: '/', label: '全部角色' },
  { path: '/use/', label: '怎么用' },
  { path: '/start/', label: '创作中心' },
  { path: '/creators/', label: '写给创作者' },
  { path: '/submit/', label: '放到目录上' },
] as const;

/** 首页标签筛选用到的常用标签。其余标签会按出现频次自动补足 */
export const PINNED_TAGS = [
  '古风',
  '现代',
  '仙侠',
  '娱乐圈',
  '校园',
  '民国',
  '慢热',
  '治愈',
  '破镜重圆',
  '百合',
] as const;

/** 卡片来源类型的显示名 */
export const SOURCE_LABELS: Record<string, string> = {
  png: 'PNG 角色卡',
  json: 'JSON 卡片',
  repo: 'Git 仓库',
  ipfs: 'IPFS',
  url: '外部链接',
};

/** 卡片规范的显示名 */
export const SPEC_LABELS: Record<string, string> = {
  'character-card-v2': 'Character Card V2',
  'character-card-v3': 'Character Card V3',
  other: '其他规范',
};
