import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { buildCardJson } from '../../lib/prompt';

/**
 * 角色卡文件：构建时由条目里的人设自动生成。
 *
 * 这意味着站内代管的角色不再需要单独维护卡片文件 ——
 * 一个数据源（persona），三个输出（提示词 / 卡片文件 / 页面）。
 */
export async function getStaticPaths() {
  const entries = await getCollection('characters');
  return entries
    .filter((e) => e.data.persona)
    .map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

export const GET: APIRoute = ({ props }) => {
  const { entry } = props as { entry: any };
  const d = entry.data;

  const json = buildCardJson({
    name: d.name,
    persona: d.persona,
    creator: d.creator,
    version: d.version,
    tags: d.tags,
  });

  return new Response(json, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
