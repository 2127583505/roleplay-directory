// @ts-check
import { defineConfig } from 'astro/config';

// 纯静态输出：构建产物是纯 HTML/CSS/JS，可直接托管在 GitHub Pages，
// 不需要任何服务器、数据库或运行时依赖。
export default defineConfig({
  site: 'https://2127583505.github.io',

  /**
   * GitHub Pages 的项目仓库部署在子路径下：
   *   https://<用户名>.github.io/<仓库名>/
   * 所以这里必须是 /<仓库名>，否则站点会缺资源、链接全 404。
   *
   * 部署在根路径时（自定义域名 / Cloudflare Pages / 仓库名是 <用户名>.github.io）
   * 改成 '/'。改了之后 src/consts.ts 会自动跟着变，不用动别处。
   */
  base: '/roleplay-directory',

  output: 'static',
  trailingSlash: 'ignore',
  build: {
    // 目录站页面多、交互少，内联小资源可以减少请求数
    inlineStylesheets: 'auto',
  },
  devToolbar: {
    enabled: false,
  },
});
