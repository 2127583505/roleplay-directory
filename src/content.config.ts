import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * 角色卡元数据模型
 *
 * 核心设计：本站只索引元数据，不托管角色卡本体。
 * 本体永远在 `source` 指向的外部地址（创作者自己的仓库 / IPFS / 网盘）。
 * 这条线是「零成本 + 法律责任最小化」的全部来源，不要越界。
 *
 * 字段命名尽量与 Character Card V2/V3 规范对齐，方便从现有生态导入。
 */

/** 角色卡本体所在位置。至少一条。 */
const sourceSchema = z.object({
  /** 载体类型：PNG 卡 / JSON / Git 仓库 / IPFS / 其他链接 */
  type: z.enum(['png', 'json', 'repo', 'ipfs', 'url']),
  url: z.string().url(),
  /** 展示给用户的名称，例如「SillyTavern PNG 卡」 */
  label: z.string().optional(),
  /** 可选校验和，防止链接目标被替换 */
  checksum: z.string().optional(),
});

const characters = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/characters',
    // 文件名即 slug，例如 shen-yan.md -> /c/shen-yan
    generateId: ({ entry }) => entry.replace(/\.[^.]+$/, ''),
  }),
  schema: z.object({
    // —— 身份 ——
    name: z.string().min(1),
    /** 一句话钩子。决定点击率，必须具体、有张力 */
    tagline: z.string().min(1),

    // —— 归属 ——
    creator: z.string().min(1),
    creatorUrl: z.string().url().optional(),
    /** 内容授权，由创作者自选 */
    license: z.string().default('CC-BY-NC-SA-4.0'),

    // —— 分类 ——
    tags: z.array(z.string()).default([]),
    /** 原作名。同人向角色填写，原创留空 */
    fandom: z.string().optional(),
    language: z.string().default('zh'),

    // —— 版本 ——
    version: z.string().default('1.0.0'),
    created: z.coerce.date().optional(),
    updated: z.coerce.date().optional(),

    // —— 封面：创作者提供则用，缺省走确定性抽象封面 ——
    /** 外链封面图。禁止真人照片。建议 4:5 竖版 */
    cover: z.string().url().optional(),
    coverAlt: z.string().optional(),
    /** 指定抽象封面配色 id，留空则由 id 哈希决定 */
    coverStyle: z.string().optional(),

    // —— 核心：本体在哪 ——
    source: z.array(sourceSchema).min(1),

    /** 使用的卡片规范，用于兼容性提示 */
    spec: z
      .enum(['character-card-v2', 'character-card-v3', 'other'])
      .default('character-card-v3'),

    // —— 预览：创作者为目录站单独写的摘要，非卡片正文字段 ——
    /** 开场白节选，短。完整内容在 source 里 */
    greetingPreview: z.string().optional(),

    // —— 社区机制 ——
    /** 依赖的世界书 / 音色包 / 正则脚本 */
    requires: z.array(z.string()).default([]),
    /** 衍生来源（改编自哪些卡），构成创作谱系 */
    derivedFrom: z.array(z.string()).default([]),
    /** 首页精选 */
    featured: z.boolean().default(false),
  }),
});

export const collections = { characters };
