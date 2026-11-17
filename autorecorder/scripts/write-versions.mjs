#!/usr/bin/env node
/**
 * Writes frontend/VERSIONS.md (declared vs installed) for the LangGraph Python harness.
 * The quickstart clip opens it in the IDE so every recording pins the versions it ran on.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const OUT = path.join(ROOT, 'frontend', 'VERSIONS.md');

const ROWS = [
  ['frontend', '@copilotkit/react-core'], ['frontend', '@copilotkit/runtime'], ['frontend', 'next'],
  ['frontend', 'react'], ['frontend', 'maplibre-gl'],
  
  
];

const readJson = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };

let md = `# Installed versions (LangGraph Python harness)\n\nGenerated ${new Date().toISOString().slice(0, 10)}. Node ${process.version}.\n\n| Where | Package | Declared | Installed |\n|---|---|---|---|\n`;
for (const [dir, pkg] of ROWS) {
  const manifest = readJson(path.join(ROOT, dir, 'package.json')) ?? {};
  const declared = manifest.dependencies?.[pkg] ?? manifest.devDependencies?.[pkg] ?? '(transitive)';
  const installed = readJson(path.join(ROOT, dir, 'node_modules', pkg, 'package.json'))?.version ?? '-';
  md += `| ${dir} | ${pkg} | ${declared} | ${installed} |\n`;
}
// Python backend (uv): installed versions of the agent packages.
try {
  const list = JSON.parse(execSync('uv pip list --format json', { cwd: path.join(ROOT, 'backend'), encoding: 'utf8' }));
  const want = /^(langgraph|langgraph-cli|langgraph-api|langchain-openai|langchain-core|langchain|copilotkit|ag-ui-langgraph|python-dotenv)$/i;
  for (const p of list.filter((x) => want.test(x.name))) md += `| backend | ${p.name} | (pyproject) | ${p.version} |\n`;
} catch { md += '| backend | (uv pip list failed) | | |\n'; }
// Never fail the job: write what we have.
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, md);
console.log(`wrote ${path.relative(ROOT, OUT)}`);
