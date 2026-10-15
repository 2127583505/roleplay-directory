/**
 * 确定性抽象封面
 *
 * 设计原则（为什么这么做）：
 *  1. 兜底封面绝不画人、不画脸、不画轮廓。画坏的人脸 = "破了"，
 *     画坏的抽象色块 = "设计"。
 *  2. 不用居中大字母 —— "居中字母 + 渐变" 已被用户认知为"图片加载失败"。
 *     改为左下角小号衬线单字 + 细线，安静但成立。
 *  3. 任何兜底只要重复出现就会显廉价，所以靠颜色区分而不是靠构图。
 *  4. 配色必须"柔和但有颜色"，避免低饱和泥土色（会显得脏）。
 *  5. 由 id 哈希决定，同一张卡每次渲染都一致，无需存储。
 */

export interface Palette {
  id: string;
  label: string;
  /** 渐变起色（浅） */
  from: string;
  /** 渐变止色（深） */
  to: string;
  /** 单字与细线的颜色 */
  ink: string;
}

/**
 * 八个干净的高明度配色。
 * 刻意避开橄榄绿 / 灰蓝 / 灰棕这类低饱和泥土色。
 */
export const PALETTES: Palette[] = [
  { id: 'rose', label: '玫瑰', from: '#FCE3E8', to: '#E9A2B6', ink: '#8C3350' },
  { id: 'peach', label: '蜜桃', from: '#FDE7D6', to: '#F2B489', ink: '#8E4A22' },
  { id: 'lavender', label: '薰衣草', from: '#E8E1F9', to: '#B7A4E4', ink: '#4F3B85' },
  { id: 'sage', label: '鼠尾草', from: '#DFEDE2', to: '#A2C8AE', ink: '#2F5D40' },
  { id: 'sky', label: '晴空', from: '#DEEBF7', to: '#9CC0DF', ink: '#2A5378' },
  { id: 'mauve', label: '藕荷', from: '#F3E0EE', to: '#C79FC2', ink: '#6B3560' },
  { id: 'sand', label: '暖沙', from: '#F7EAD7', to: '#DBBF95', ink: '#6D5230' },
  { id: 'clay', label: '陶土', from: '#F5DEDA', to: '#D89E96', ink: '#7A3931' },
];

/** FNV-1a 32 位哈希：短、稳定、无依赖 */
export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 由 id 稳定地选出一个配色；hero 为 true 时偏向浅色系 */
export function pickPalette(id: string, style?: string | null): Palette {
  if (style) {
    const byId = PALETTES.find((p) => p.id === style);
    if (byId) return byId;
    const byLabel = PALETTES.find((p) => p.label === style);
    if (byLabel) return byLabel;
  }
  return PALETTES[hashString(id) % PALETTES.length];
}

/**
 * 取单字。
 * 中文取第一个字（汉字单字做 monogram 在视觉上比拉丁字母更好看，
 * 像书封），拉丁名取首字母大写。
 */
export function monogram(name: string): string {
  const t = (name ?? '').trim();
  if (!t) return '·';
  const first = Array.from(t)[0];
  return /[a-z]/i.test(first) ? first.toUpperCase() : first;
}

/** 由 id 生成的细微几何装饰：两条细弧线，用于让不同卡片的封面安静地不同 */
export function decorSeed(id: string): { a: number; b: number } {
  const h = hashString(id);
  return { a: (h % 7) + 3, b: ((h >> 4) % 7) + 3 };
}

/** 生成内联样式变量，供 Cover 组件使用 */
export function coverVars(id: string, style?: string | null): string {
  const p = pickPalette(id, style);
  return `--cover-from:${p.from};--cover-to:${p.to};--cover-ink:${p.ink};`;
}
