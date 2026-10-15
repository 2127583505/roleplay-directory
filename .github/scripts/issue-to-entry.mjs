#!/usr/bin/env node
/**
 * 把「提交一个角色」表单（Issue）转成目录条目文件，并自动开一个 PR。
 *
 * 为什么要有这个：没有它，每收到一个提交都要人工复制粘贴一遍，
 * 「不运营」就成了空话。
 *
 * 环境变量（由 workflow 注入）：
 *   GITHUB_TOKEN        secrets.GITHUB_TOKEN，需要 contents / issues / pull-requests 写权限
 *   GITHUB_REPOSITORY   owner/repo
 *   ISSUE_NUMBER        触发本次运行的 issue 编号
 *   DEFAULT_BRANCH      目标分支，缺省 main
 *
 * 只用 Node 内置能力（Node 18+ 自带 fetch），不装任何依赖。
 */

const token = process.env.GITHUB_TOKEN;
const repoSlug = process.env.GITHUB_REPOSITORY;
const issueNumber = process.env.ISSUE_NUMBER;
const baseBranch = process.env.DEFAULT_BRANCH || 'main';

if (!token || !repoSlug || !issueNumber) {
  console.error('缺少环境变量：需要 GITHUB_TOKEN、GITHUB_REPOSITORY、ISSUE_NUMBER');
  process.exit(1);
}

const [owner, repo] = repoSlug.split('/');
const API = 'https://api.github.com';

/** 极薄的 REST 封装，失败时把响应体一并抛出来方便排查 */
async function api(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'issue-to-entry',
      ...(init.headers ?? {}),
    },
  });

  const raw = await res.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }

  if (!res.ok) {
    const err = new Error(
      `${init.method ?? 'GET'} ${path} → ${res.status} ${
        typeof data === 'string' ? data : JSON.stringify(data)
      }`,
    );
    err.status = res.status;
    throw err;
  }

  return data;
}

const comment = (body) =>
  api(`/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });

// ——————————————————————————————————————————————
// 解析表单
// ——————————————————————————————————————————————

/**
 * GitHub 的表单会渲染成这样：
 *
 *   ### 角色名
 *
 *   沈砚
 *
 *   ### 一句话钩子
 *
 *   ...
 *
 * 所以按 `### ` 标题切开，标题做 key、正文做 value 就够了。
 */
function parseForm(body) {
  const out = {};

  for (const chunk of String(body ?? '').split(/^###\s+/m).slice(1)) {
    const nl = chunk.indexOf('\n');
    if (nl < 0) continue;

    const key = chunk.slice(0, nl).trim();
    let value = chunk.slice(nl + 1).trim();

    // 没填的字段会被渲染成这个占位符
    if (/^_+no response_+$/i.test(value)) value = '';

    out[key] = value;
  }

  return out;
}

/** 多选下拉会输出成「古风, 现代」，中英文逗号都要切 */
const splitTags = (s) =>
  (s ?? '')
    .split(/[,，、]/)
    .map((t) => t.trim())
    .filter(Boolean);

/** 检查勾选项是否全部勾上 */
function uncheckedItems(block) {
  return (block ?? '')
    .split('\n')
    .filter((line) => /^\s*-\s*\[ \]/.test(line))
    .map((line) => line.replace(/^\s*-\s*\[ \]\s*/, '').trim());
}

// ——————————————————————————————————————————————
// 生成条目
// ——————————————————————————————————————————————

/** YAML 双引号字符串，转义反斜杠和引号 */
const q = (s) => `"${String(s ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

/** FNV-1a，用于中文名生成稳定的文件名 */
function hash36(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/** 优先用提交者填的网址名；没填或全是中文就退化成哈希 */
function makeSlug(raw, name) {
  const cleaned = String(raw ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (cleaned) return cleaned.slice(0, 60);
  return `character-${hash36(name)}`;
}

function buildEntry({ name, tagline, creator, tags, source, intro, cover }) {
  const lines = ['---'];

  lines.push(`name: ${q(name)}`);
  lines.push(`tagline: ${q(tagline)}`);
  lines.push(`creator: ${q(creator)}`);
  lines.push('license: "CC-BY-NC-SA-4.0"');

  if (tags.length) {
    lines.push('tags:');
    for (const t of tags) lines.push(`  - ${q(t)}`);
  }

  lines.push('version: "1.0.0"');
  lines.push(`updated: ${new Date().toISOString().slice(0, 10)}`);

  if (cover) lines.push(`cover: ${q(cover)}`);

  lines.push('source:');
  lines.push('  - type: url');
  lines.push(`    url: ${q(source)}`);
  lines.push(`    label: ${q('角色卡下载')}`);

  lines.push('---', '');
  lines.push(intro.trim());
  lines.push('');

  return lines.join('\n');
}

// ——————————————————————————————————————————————
// 主流程
// ——————————————————————————————————————————————

async function main() {
  const issue = await api(`/repos/${owner}/${repo}/issues/${issueNumber}`);

  if (issue.pull_request) {
    console.log('这是一个 PR，跳过。');
    return;
  }

  const form = parseForm(issue.body);

  const name = form['角色名'];
  const tagline = form['一句话钩子'];
  const creator = form['署名'];
  const tags = splitTags(form['题材']);
  const source = form['角色卡下载地址'];
  const intro = form['简介'];
  const cover = form['封面图地址'] ?? '';

  // —— 必填校验 ——
  const missing = [];
  if (!name) missing.push('角色名');
  if (!tagline) missing.push('一句话钩子');
  if (!creator) missing.push('署名');
  if (!tags.length) missing.push('题材');
  if (!source) missing.push('角色卡下载地址');
  if (!intro) missing.push('简介');

  if (missing.length) {
    await comment(
      `还差几项没填：**${missing.join('、')}**。\n\n` +
        `补上之后在这条下面回一句，我就会重新处理。`,
    );
    console.log('缺少必填项：', missing.join('、'));
    return;
  }

  // —— 确认项 ——
  const unchecked = uncheckedItems(form['最后确认一下']);
  if (unchecked.length) {
    await comment(
      `有 ${unchecked.length} 项确认还没勾选，麻烦回头勾一下：\n\n` +
        unchecked.map((t) => `- [ ] ${t}`).join('\n') +
        `\n\n勾完在这条下面回一句，我就会重新处理。`,
    );
    console.log('确认项未勾选：', unchecked.join(' / '));
    return;
  }

  // —— 下载地址要能解析成合法网址 ——
  try {
    new URL(source);
  } catch {
    await comment(
      `下载地址 \`${source}\` 看起来不是一个完整网址。\n\n` +
        `需要以 \`https://\` 开头，并且能直接打开。改好之后在这条下面回一句。`,
    );
    console.log('下载地址非法：', source);
    return;
  }

  // —— 生成文件 ——
  const slug = makeSlug(form['网址用的名字'], name);
  const path = `src/content/characters/${slug}.md`;
  const branch = `entry/issue-${issueNumber}`;
  const content = buildEntry({ name, tagline, creator, tags, source, intro, cover });

  // —— 建分支 ——
  const baseRef = await api(`/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`);
  const baseSha = baseRef.object.sha;

  try {
    await api(`/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
    });
  } catch (err) {
    if (err.status === 422) {
      console.log(`分支 ${branch} 已存在，说明这条已经处理过了。`);
      await comment('这个提交已经处理过了，条目在下面的 PR 里。');
      return;
    }
    throw err;
  }

  // —— 写入文件 ——
  await api(`/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `feat(角色): 收录「${name}」（来自 #${issueNumber}）`,
      content: Buffer.from(content, 'utf8').toString('base64'),
      branch,
    }),
  });

  // —— 开 PR ——
  const pr = await api(`/repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    body: JSON.stringify({
      title: `收录角色「${name}」`,
      head: branch,
      base: baseBranch,
      body: [
        `来自提交表单 #${issueNumber}，作者 @${issue.user.login}。`,
        '',
        '**合并前请确认：**',
        '',
        `- [ ] 下载地址能打开：${source}`,
        `- [ ] 没使用真人照片${cover ? `（封面：${cover}）` : '（未填封面，会自动生成）'}`,
        `- [ ] 简介是原创的，不是复制角色卡原文`,
        `- [ ] 署名正确：${creator}`,
        `- [ ] 文件名合适：\`${path}\``,
        '',
        `看完没问题就点合并，站点会自动更新。`,
        '',
        `关闭 #${issueNumber}`,
      ].join('\n'),
    }),
  });

  // —— 回帖告知 ——
  await comment(
    `收到，条目已经生成好了 👉 ${pr.html_url}\n\n` +
      `有人确认一下就会出现在目录里。想改什么直接在 PR 里说就行。`,
  );

  console.log(`完成：${pr.html_url}`);
}

main().catch(async (err) => {
  console.error(err);

  try {
    await comment(
      `自动处理的时候出错了，需要人工看一下。\n\n` +
        `\`\`\`\n${String(err.message).slice(0, 500)}\n\`\`\`\n\n` +
        `（信息已经填完整了的话，多半是文件名重名或者下载地址有问题。）`,
    );
  } catch {
    // 连回帖都失败就没什么能做的了
  }

  process.exit(1);
});
