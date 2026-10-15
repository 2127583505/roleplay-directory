#!/usr/bin/env node
/**
 * 把站点切换到你的自定义域名。
 *
 *   npm run set-domain -- example.com
 *
 * 做三件事：
 *   1. 生成 public/CNAME（GitHub Pages 用它识别你的域名）
 *   2. astro.config.mjs：site → https://<域名>，base → '/'
 *   3. src/consts.ts：SITE.url → https://<域名>
 *
 * 自定义域名部署在根路径，所以 base 会改回 '/'。
 *
 * 做完这些你还要去阿里云改 DNS：
 *   类型    CNAME
 *   主机记录 @（或 www）
 *   记录值   <你的GitHub用户名>.github.io
 *
 * 阿里云域名在购买时已完成实名认证即可，不需要 ICP 备案
 * （GitHub Pages 的服务器在境外）。
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const domain = process.argv[2];

if (!domain) {
  console.error('\n用法：npm run set-domain -- example.com\n');
  process.exit(1);
}

if (!/^[a-z0-9]+([-.][a-z0-9]+)*\.[a-z]{2,}$/i.test(domain)) {
  console.error('\n域名格式不对。应该是 example.com 这样的形式，不要带 https:// 或路径。\n');
  process.exit(1);
}

const url = `https://${domain}`;

// 1) CNAME
await writeFile(path.join(ROOT, 'public', 'CNAME'), `${domain}\n`, 'utf8');

// 2) astro.config.mjs
{
  const file = path.join(ROOT, 'astro.config.mjs');
  let s = await readFile(file, 'utf8');
  s = s
    .replace(/site:\s*'https?:\/\/[^']*'/, `site: '${url}'`)
    .replace(/base:\s*'[^']*'/, `base: '/'`);
  await writeFile(file, s, 'utf8');
}

// 3) src/consts.ts
{
  const file = path.join(ROOT, 'src', 'consts.ts');
  let s = await readFile(file, 'utf8');
  s = s.replace(/url:\s*'https?:\/\/[^']*'/, `url: '${url}'`);
  await writeFile(file, s, 'utf8');
}

console.log('\n完成：');
console.log(`  CNAME    ${domain}`);
console.log(`  站点地址  ${url}`);
console.log(`  基路径    /\n`);
console.log('接下来：');
console.log('  1. 去阿里云 DNS 控制台，加一条 CNAME 记录：');
console.log('     主机记录 @（或 www），记录值 <你的GitHub用户名>.github.io');
console.log('  2. 推送后，到仓库 Settings → Pages → Custom domain 填这个域名');
console.log('  3. 勾选「Enforce HTTPS」\n');
