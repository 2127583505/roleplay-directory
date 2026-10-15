import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE, href } from '../../consts';

/**
 * 收录徽章：每个角色在构建时生成一张 SVG。
 *
 * 创作者可以把它贴在任何地方（README、社交媒体、个人主页），
 * 链接指回该角色在灯上的页面。
 *
 * 例：
 *   [![灯下收录](.../badge/shen-yan.svg)](.../c/shen-yan/)
 */

export async function getStaticPaths() {
  const entries = await getCollection('characters');
  return entries.map((e) => ({
    params: { slug: e.id },
    props: { name: e.data.name },
  }));
}

/** SVG 安全转义 */
const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** 粗略估算文字宽度：中日韩全角按 11px，其余按 6.5px */
const textWidth = (s: string) => {
  let w = 0;
  for (const ch of s) {
    w += /[⺀-鿿豈-﫿　-〿]/.test(ch) ? 11 : 6.5;
  }
  return Math.ceil(w);
};

export const GET: APIRoute = ({ props }) => {
  const { name } = props as { name: string };
  const label = '灯下 · 收录';

  const pad = 10;
  const lw = textWidth(label) + pad * 2;
  const vw = textWidth(name) + pad * 2;
  const total = lw + vw;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="20" role="img" aria-label="灯下收录：${esc(
    name,
  )}">
  <defs><clipPath id="r"><rect width="${total}" height="20" rx="3"/></clipPath></defs>
  <g clip-path="url(#r)">
    <rect width="${total}" height="20" fill="#FBF7F3"/>
    <rect width="${lw}" height="20" fill="#C4576E"/>
  </g>
  <g font-family="system-ui, -apple-system, sans-serif" font-size="11" dominant-baseline="middle" text-anchor="middle">
    <text x="${lw / 2}" y="10.5" fill="#ffffff">${esc(label)}</text>
    <text x="${lw + vw / 2}" y="10.5" fill="#2B2320">${esc(name)}</text>
  </g>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};

// 徽章的完整外链，供详情页复制给创作者
export function badgeUrl(slug: string): string {
  return `${SITE.url}${href(`/badge/${slug}.svg`)}`;
}
