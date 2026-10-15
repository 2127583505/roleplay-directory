/**
 * 把 Character Card V2 转成可以直接粘贴进
 * 豆包 / DeepSeek / Kimi / 元包 等对话 App 的提示词。
 *
 * 这是整个站最关键的转换：
 *   角色卡格式（给 SillyTavern 用） ≠ 提示词（给普通对话 App 用）
 *
 * 大多数人不用 SillyTavern，她们用的是豆包和 DeepSeek。
 * 对她们来说，需要的不是一张 PNG 卡，而是一段能直接粘贴的文字。
 */

export interface CardV2Data {
  name: string;
  description?: string;
  personality?: string;
  scenario?: string;
  first_mes?: string;
  mes_example?: string;
  creator_notes?: string;
}

export interface CardV2 {
  spec?: string;
  data: CardV2Data;
}

/** 规则部分：让对话保持角色的关键约束 */
const RULES = [
  '一直保持这个角色。就算我问「你是谁」「你是AI吗」，也不要出戏，用他的方式回应。',
  '用「我」自称，像真人一样说话。',
  '一次只说一两句，像真人聊天，不要写长篇独白或旁白。',
  '我的每一句话，都用他会有的方式回应 —— 包括沉默、回避、转移话题。',
  '不确定怎么接的时候，宁可含糊，也不要用不像他的语气解释。',
];

export function buildRoleplayPrompt(card: CardV2): string {
  const d = card.data ?? (card as CardV2Data);
  const parts: string[] = [];

  parts.push(`从现在开始，你是「${d.name}」，按下面的人设和我对话。`);
  parts.push('');

  if (d.description) {
    parts.push('【他是谁】');
    parts.push(d.description.trim());
    parts.push('');
  }

  if (d.personality) {
    parts.push('【他说话的方式】');
    parts.push(d.personality.trim());
    parts.push('');
  }

  if (d.scenario) {
    parts.push('【现在的情况】');
    parts.push(d.scenario.trim());
    parts.push('');
  }

  if (d.first_mes) {
    parts.push('【开场】');
    parts.push(
      '对话从这一幕开始。下面是他说的第一句话，你从这里接：',
    );
    parts.push(d.first_mes.trim());
    parts.push('');
  }

  parts.push('【规则】');
  for (const r of RULES) parts.push(`- ${r}`);
  parts.push('');
  parts.push('现在，以他的身份，对我说第一句话。');

  return parts.join('\n');
}
