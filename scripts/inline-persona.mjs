#!/usr/bin/env node
/**
 * 一次性迁移：把 seed-cards/*.json 里的人设内容写进对应的目录条目。
 *
 * 为什么要做：创作中心的核心是「人设存在站内」。
 * 只有这样，每个角色才能同时生成提示词、卡片文件和展示页面。
 * 只存外链的话，提示词功能对外部角色永远用不了。
 *
 * 迁移完成后 seed-cards/ 就不再被构建依赖，可以删掉。
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CARDS_DIR = path.join(ROOT, 'seed-cards');
const ENTRIES_DIR = path.join(ROOT, 'src', 'content', 'characters');

/** YAML 块标量（|），保留换行 */
function blockScalar(text, indent) {
  const lines = String(text ?? '').trimEnd().split('\n');
  return lines.map((l) => `${indent}${l || ''}`).join('\n');
}

function personaYaml(p) {
  let out = 'persona:\n';
  out += `  who: |\n${blockScalar(p.who, '    ')}\n`;
  if (p.behavior) out += `  behavior: |\n${blockScalar(p.behavior, '    ')}\n`;
  if (p.scenario) out += `  scenario: |\n${blockScalar(p.scenario, '    ')}\n`;
  if (p.greeting) out += `  greeting: |\n${blockScalar(p.greeting, '    ')}\n`;
  return out;
}

const files = (await readdir(CARDS_DIR)).filter((f) => f.endsWith('.json'));
let ok = 0;
let skipped = 0;

for (const file of files) {
  const slug = path.basename(file, '.json');
  const entryPath = path.join(ENTRIES_DIR, `${slug}.md`);

  let json;
  try {
    json = JSON.parse(await readFile(path.join(CARDS_DIR, file), 'utf-8'));
  } catch {
    console.warn(`  跳过（JSON 解析失败）: ${file}`);
    skipped++;
    continue;
  }

  const d = json.data ?? json;

  let entry;
  try {
    entry = await readFile(entryPath, 'utf-8');
  } catch {
    console.warn(`  跳过（没有对应条目）: ${slug}.md`);
    skipped++;
    continue;
  }

  // 已经迁移过的跳过
  if (entry.includes('persona:')) {
    console.log(`  已有 persona，跳过: ${slug}`);
    skipped++;
    continue;
  }

  const persona = {
    who: d.description ?? '',
    behavior: d.personality ?? '',
    scenario: d.scenario ?? '',
    greeting: d.first_mes ?? '',
  };

  // 插在 source: 之前
  const lines = entry.split('\n');
  const idx = lines.findIndex((l) => /^source:\s*$/.test(l));

  if (idx < 0) {
    console.warn(`  跳过（找不到 source 字段）: ${slug}.md`);
    skipped++;
    continue;
  }

  lines.splice(idx, 0, personaYaml(persona).trimEnd(), '');
  await writeFile(entryPath, lines.join('\n'), 'utf-8');
  console.log(`  完成: ${slug}`);
  ok++;
}

console.log(`\n迁移完成：${ok} 个成功，${skipped} 个跳过。`);
