/**
 * 提示词生成：把角色的人设转成可以直接粘贴进
 * 豆包 / DeepSeek / Kimi / 元包 等对话 App 的文字。
 *
 * 这是创作中心的第一个输出。大多数人不用 SillyTavern，
 * 她们用的是豆包和 DeepSeek —— 对她们来说，
 * 需要的不是一张 PNG 卡，而是一段能直接粘贴的人设。
 */

export interface Persona {
  who: string;
  behavior?: string;
  scenario?: string;
  greeting?: string;
  /** 世界观 —— 客户端里那份「世界书」的人话版本 */
  world?: string;
}

/** 规则部分：让对话保持角色的关键约束 */
const RULES = [
  '一直保持这个角色。就算我问「你是谁」「你是AI吗」，也不要出戏，用他的方式回应。',
  '用「我」自称，像真人一样说话。',
  '一次只说一两句，像真人聊天，不要写长篇独白或旁白。',
  '我的每一句话，都用他会有的方式回应 —— 包括沉默、回避、转移话题。',
  '不确定怎么接的时候，宁可含糊，也不要用不像他的语气解释。',
];

export function buildPrompt(name: string, persona: Persona): string {
  const parts: string[] = [];

  parts.push(`从现在开始，你是「${name}」，按下面的人设和我对话。`);
  parts.push('');

  // 世界观先于人物，因为「他在的世界是什么样」决定了「他会怎么答」
  if (persona.world) {
    parts.push('【这个世界的设定】');
    parts.push(persona.world.trim());
    parts.push('');
  }

  if (persona.who) {
    parts.push('【他是谁】');
    parts.push(persona.who.trim());
    parts.push('');
  }

  if (persona.behavior) {
    parts.push('【他说话的方式】');
    parts.push(persona.behavior.trim());
    parts.push('');
  }

  if (persona.scenario) {
    parts.push('【现在的情况】');
    parts.push(persona.scenario.trim());
    parts.push('');
  }

  if (persona.greeting) {
    parts.push('【开场】');
    parts.push('对话从这一幕开始。下面是他说的第一句话，你从这里接：');
    parts.push(persona.greeting.trim());
    parts.push('');
  }

  parts.push('【规则】');
  for (const r of RULES) parts.push(`- ${r}`);
  parts.push('');
  parts.push('现在，以他的身份，对我说第一句话。');

  return parts.join('\n');
}

/** 兼容 Character Card V2 格式的入口 */
export interface CardV2Data {
  name: string;
  description?: string;
  personality?: string;
  scenario?: string;
  first_mes?: string;
}

export interface CardV2 {
  data: CardV2Data;
}

export function buildRoleplayPrompt(card: CardV2): string {
  const d = card.data ?? (card as CardV2Data);
  return buildPrompt(d.name, {
    who: d.description ?? '',
    behavior: d.personality,
    scenario: d.scenario,
    greeting: d.first_mes,
  });
}

/** 由人设生成可下载的 Character Card V2 文件内容 */
export function buildCardJson(opts: {
  name: string;
  persona: Persona;
  creator: string;
  version: string;
  tags: string[];
}): string {
  const { name, persona, creator, version, tags } = opts;

  // 世界观并进 description：客户端里它本该是独立的 character_book，
  // 但并进正文能让「站内提示词」和「下载的卡片」内容完全一致，不产生两套真相。
  const description = persona.world?.trim()
    ? `${persona.world.trim()}\n\n${persona.who}`
    : persona.who;

  const card = {
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data: {
      name,
      description,
      personality: persona.behavior ?? '',
      scenario: persona.scenario ?? '',
      first_mes: persona.greeting ?? '',
      mes_example: '',
      creator_notes: '',
      system_prompt: '',
      post_history_instructions: '',
      alternate_greetings: [],
      tags,
      creator,
      character_version: version,
      extensions: {},
    },
  };

  return JSON.stringify(card, null, 2);
}
