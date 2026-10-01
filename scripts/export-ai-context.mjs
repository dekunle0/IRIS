import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(projectRoot, 'AI_PROJECT_CONTEXT.md');

const includedExtensions = new Set([
  '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.py', '.sql', '.css', '.html',
  '.json', '.md', '.yml', '.yaml', '.toml', '.env.example',
]);
const includedNames = new Set([
  'Dockerfile', 'Makefile', '.gitignore', '.npmrc', 'pnpm-workspace.yaml',
]);
const excludedDirectories = new Set([
  'node_modules', 'dist', 'dist-electron', 'release', '.next', '.cache',
  '.turbo', '.venv', '.git', '__pycache__', '.pytest_cache', 'coverage',
]);
const excludedFiles = new Set([
  'AI_PROJECT_CONTEXT.md', 'pnpm-lock.yaml', 'package-lock.json', 'yarn.lock',
]);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (excludedDirectories.has(entry.name)) continue;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(absolutePath));
      continue;
    }

    const extension = path.extname(entry.name);
    if (!excludedFiles.has(entry.name) && (includedExtensions.has(extension) || includedNames.has(entry.name))) {
      files.push(absolutePath);
    }
  }

  return files.sort();
}

function languageFor(filePath) {
  const extension = path.extname(filePath);
  const languages = {
    '.js': 'javascript', '.mjs': 'javascript', '.cjs': 'javascript',
    '.ts': 'typescript', '.tsx': 'tsx', '.jsx': 'jsx', '.py': 'python',
    '.sql': 'sql', '.css': 'css', '.html': 'html', '.json': 'json',
    '.md': 'markdown', '.yml': 'yaml', '.yaml': 'yaml', '.toml': 'toml',
  };
  return languages[extension] || '';
}

const files = await collectFiles(projectRoot);
const relativePathFor = (filePath) => path.relative(projectRoot, filePath).split(path.sep).join('/');
const testFiles = files.filter((filePath) => {
  const relativePath = relativePathFor(filePath).toLowerCase();
  const fileName = path.basename(relativePath);
  return relativePath.includes('/tests/') || fileName.includes('test') || fileName.includes('spec');
});
const sections = [
  '# IRIS Platform AI Project Context',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  'This file is a source-context export for AI-assisted development.',
  'It includes application source, database schema, AI service code, tests, and configuration.',
  '',
  '## Important Project Notes',
  '',
  '- The Electron app is in `apps/desktop`.',
  '- The Electron runtime database is initialized in `apps/desktop/src/main/db.ts`.',
  '- The shared schema is in `packages/db/migrations/001_init.sql`.',
  '- The local AI HTTP service is in `packages/ai/main.py`.',
  '- Generated builds, release binaries, dependencies, virtual environments, and lockfiles are excluded.',
  '',
  `## Included Files (${files.length})`,
  '',
  ...files.map((filePath) => `- ${relativePathFor(filePath)}`),
  '',
  `## Test Files (${testFiles.length})`,
  '',
  ...(testFiles.length > 0 ? testFiles.map((filePath) => `- ${relativePathFor(filePath)}`) : ['- No test files found.']),
  '',
];

for (const filePath of files) {
  const relativePath = relativePathFor(filePath);
  const language = languageFor(filePath);
  const source = await readFile(filePath, 'utf8');
  sections.push(`## ${relativePath}`, '', `\`\`\`${language}`, source.trimEnd(), '\`\`\`', '');
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${sections.join('\n')}\n`, 'utf8');
console.log(`Wrote ${path.relative(projectRoot, outputPath)} with ${files.length} files.`);
