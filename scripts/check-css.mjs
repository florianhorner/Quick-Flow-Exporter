import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import config from '../postcss.config.js';

const source = fileURLToPath(new URL('../src/index.css', import.meta.url));
const plugins = await Promise.all(
  Object.entries(config.plugins).map(async ([name, options]) => {
    const { default: plugin } = await import(name);
    return plugin(options);
  })
);
const result = await postcss(plugins).process(await readFile(source, 'utf8'), {
  from: source,
});
const root = result.root;
root.walkAtRules((rule) => {
  assert(
    !['tailwind', 'config', 'apply'].includes(rule.name),
    `Uncompiled @${rule.name}`
  );
});

function rulesFor(className) {
  const selector = `.${className.replace(/([:!./])/g, '\\$1')}`;
  const rules = [];
  root.walkRules((rule) => {
    if (rule.selector === selector || rule.selector.startsWith(`${selector}:`))
      rules.push(rule);
  });
  assert(rules.length, `Missing compiled utility: ${className}`);
  return rules;
}

function declaration(className, property) {
  const values = [];
  for (const rule of rulesFor(className)) {
    rule.walkDecls(property, (decl) => values.push(decl));
  }
  assert(values.length, `Missing ${property} for ${className}`);
  return values[0];
}

function resolveVariable(value) {
  return value.replace(/var\((--[\w-]+)\)/g, (_, property) => {
    let resolved;
    root.walkDecls(property, (decl) => {
      resolved = decl.value;
    });
    assert(resolved, `Missing theme token: ${property}`);
    return resolved;
  });
}

for (const [className, expected] of [
  ['bg-midnight-800', '#1e293b'],
  ['text-blue-600', '#2563eb'],
  ['text-slate-400', '#94a3b8'],
  ['bg-purple-700', '#7e22ce'],
  ['text-red-400', '#f87171'],
  ['text-amber-500', '#f59e0b'],
  ['text-orange-600', '#ea580c'],
]) {
  const property = className.startsWith('bg-') ? 'background-color' : 'color';
  assert.equal(resolveVariable(declaration(className, property).value), expected);
}
assert.match(
  resolveVariable(declaration('font-mono', 'font-family').value),
  /JetBrains Mono/
);
for (const rule of rulesFor('dark:bg-midnight-800')) {
  assert.match(rule.selector, /:is\(\.dark \*\)/);
  assert.doesNotMatch(rule.toString(), /prefers-color-scheme/);
}
assert.equal(
  resolveVariable(declaration('rounded-xs', 'border-radius').value),
  '0.125rem'
);
assert.equal(
  resolveVariable(declaration('rounded-sm', 'border-radius').value),
  '0.25rem'
);
assert.match(
  resolveVariable(declaration('shadow-xs', '--tw-shadow').value),
  /0 1px 2px 0/
);
assert.match(
  resolveVariable(declaration('backdrop-blur-sm', '--tw-backdrop-blur').value),
  /8px/
);
assert.match(declaration('focus-visible:ring-2', '--tw-ring-shadow').value, /2px/);
assert.equal(
  resolveVariable(declaration('focus-visible:ring-blue-500', '--tw-ring-color').value),
  '#3b82f6'
);
let spacing;
root.walkDecls('--spacing', (decl) => {
  spacing = decl.value;
});
assert.equal(spacing, '0.25rem');
assert.match(
  resolveVariable(declaration('font-sans', 'font-family').value),
  /ui-sans-serif/
);
for (const [file, expression] of [
  ['PastePhase.tsx', /<select[\s\S]*?<\/select>/g],
  ['DiffPhase.tsx', /<textarea[\s\S]*?\/>/g],
]) {
  const content = await readFile(
    new URL(`../src/components/${file}`, import.meta.url),
    'utf8'
  );
  const controls = [...content.matchAll(expression)].map((match) => match[0]);
  const control =
    file === 'PastePhase.tsx'
      ? controls.find((item) => item.includes('provider-select'))
      : controls.find((item) => item.includes('Paste the AFTER'));
  const classes = control?.match(/className="([^"]+)"/)?.[1].split(/\s+/) ?? [];
  const margin = classes.find((token) => token.startsWith('mt-'));
  assert(margin, `${file} must preserve spacing after its inline label`);
  assert.equal(declaration(margin, 'margin-top').value, 'calc(var(--spacing) * 2)');
}
const graphSource = await readFile(
  new URL('../src/components/FlowGraph.tsx', import.meta.url),
  'utf8'
);
const legendClasses = graphSource.match(/className="([^"]+)">Legend<\/div>/)?.[1];
assert(legendClasses, 'Missing graph legend heading');
assert.doesNotMatch(legendClasses, /\bmb-/, 'Legend spacing must come from its parent');
for (const [className, property] of [
  ['w-3!', 'width'],
  ['h-3!', 'height'],
]) {
  const decl = declaration(className, property);
  assert.equal(decl.important, true, `${className} must override React Flow styles`);
  assert.match(decl.value, /calc\(var\(--spacing\) \* 3\)/);
}

async function checkSource(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    if (entry.isDirectory()) await checkSource(path);
    else if (entry.name.endsWith('.tsx')) {
      const content = await readFile(path, 'utf8');
      assert.doesNotMatch(
        content,
        /(?:^|[\s:"`])(?:rounded|shadow|backdrop-blur|outline-none)(?=[\s"`])/,
        `Legacy utility in ${entry.name}`
      );
    }
  }
}
await checkSource(new URL('../src/', import.meta.url));
console.log('Compiled CSS preserves theme tokens, dark mode, focus and graph utilities');
