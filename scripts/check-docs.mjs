import { readdir, readFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
async function walk(dir) {
  const paths = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) paths.push(...(await walk(path)));
    else if (entry.name.endsWith('.md')) paths.push(path);
  }
  return paths;
}
const files = [resolve('README.md'), resolve('AGENTS.md'), ...(await walk('docs'))];
const broken = [];
for (const file of files) {
  const content = await readFile(file, 'utf8');
  for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1];
    if (!target || /^(https?:|mailto:|#)/.test(target)) continue;
    const path = resolve(dirname(file), target.split('#')[0]);
    try {
      await access(path);
    } catch {
      broken.push(file + ' -> ' + target);
    }
  }
}
if (broken.length) {
  console.error(broken.join('\n'));
  process.exitCode = 1;
} else console.log('Checked local links in ' + files.length + ' Markdown files.');
