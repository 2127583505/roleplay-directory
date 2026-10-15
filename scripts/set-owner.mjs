#!/usr/bin/env node
/**
 * 一键把仓库所有者占位符替换成你的 GitHub 用户名。
 *
 *   npm run set-owner -- 你的用户名
 *   npm run set-owner -- 你的用户名 你的仓库名
 *
 * 做四件事（仓库名默认 roleplay-directory）：
 *   1. 全项目替换 2127583505
 *   2. 站点地址 → https://<用户名>.github.io
 *   3. 基路径     → /<仓库名>          ← 少这一步站点会缺资源、链接全 404
 *   4. 仓库地址   → https://github.com/<用户名>/<仓库名>
 *
 * 如果你之后绑了自定义域名，手动把 astro.config.mjs 的 base 改成 '/'
 * （src/consts.ts 会自动跟着变）。
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PLACEHOLDER = '2127583505';
const DEFAULT_REPO = 'roleplay-directory';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 这些目录不扫 */
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.astro', '.vscode']);

/** 只处理这些后缀 */
const EXT = /\.(md|ts|mjs|astro|yml|yaml|json)$/i;

const owner = process.argv[2];
const repo = process.argv[3] || DEFAULT_REPO;

if (!owner) {
  console.error('\n用法：npm run set-owner -- 你的GitHub用户名 [仓库名]\n');
  process.exit(1);
}

if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(owner)) {
  console.error('\n用户名不合法：只能包含字母、数字和连字符，且不能以连字符开头。\n');
  process.exit(1);
}

if (!/^[A-Za-z0-9._-]+$/.test(repo)) {
  console.error('\n仓库名不合法：只能包含字母、数字、点、下划线和连字符。\n');
  process.exit(1);
}

/** 递归收集待处理文件 */
async function collect(dir, out = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      await collect(path.join(dir, entry.name), out);
    } else if (EXT.test(entry.name)) {
      out.push(path.join(dir, entry.name));
    }
  }

  return out;
}

const files = await collect(ROOT);
let changed = 0;

for (const file of files) {
  const original = await readFile(file, 'utf8');
  let next = original.replaceAll(PLACEHOLDER, owner);

  // 站点地址 + 仓库地址
  if (file.endsWith(path.join('src', 'consts.ts'))) {
    next = next
      .replace(/url:\s*'https?:\/\/[^']*'/, `url: 'https://${owner}.github.io'`)
      .replace(
        /repo:\s*'https?:\/\/[^']*'/,
        `repo: 'https://github.com/${owner}/${repo}'`,
      );
  }

  // 站点地址 + 基路径
  if (file.endsWith('astro.config.mjs')) {
    next = next
      .replace(/site:\s*'https?:\/\/[^']*'/, `site: 'https://${owner}.github.io'`)
      .replace(/base:\s*'[^']*'/, `base: '/${repo}'`);
  }

  if (next !== original) {
    await writeFile(file, next, 'utf8');
    changed++;
    console.log(`  更新 ${path.relative(ROOT, file)}`);
  }
}

console.log(`\n完成：替换了 ${changed} 个文件。\n`);
console.log(`  仓库所有者   ${owner}`);
console.log(`  仓库名       ${repo}`);
console.log(`  站点地址     https://${owner}.github.io/${repo}/`);
console.log(`  基路径       /${repo}`);
console.log(`  仓库         https://github.com/${owner}/${repo}\n`);
console.log('下一步：');
console.log('  1. git add -A && git commit -m "chore: 配置仓库所有者"');
console.log('  2. git push，GitHub Actions 会自动构建并发布');
console.log('  3. 仓库 Settings → Pages，把 Source 设为 GitHub Actions\n');
