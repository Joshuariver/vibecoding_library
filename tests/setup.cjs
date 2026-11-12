// Pure setup behavior tests. Run with: node tests/setup.cjs (also works with a full UNC file path)
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load() {
  const context = { window: { VCL: { sentinel: true } } };
  vm.createContext(context);
  vm.runInContext('var VCL = window.VCL;', context);
  for (const file of ['setup.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../static/data', file), 'utf8'), context);
  }
  return context.window.VCL;
}
const V = load(), S = V.setup;
const plain = value => JSON.parse(JSON.stringify(value));
const allIds = S.tools.flatMap(tool => tool.checks.map(check => check.id));
const allChecks = Object.fromEntries(allIds.map(id => [id, true]));
const legacy = [
  'vscode.path', 'vscode.version', 'vscode.extensions',
  'antigravity.installed', 'antigravity.version', 'antigravity.auth',
  'python.path', 'python.version', 'python.first-run',
  'git.version', 'git.identity', 'git.vscode'
];

test('loads without DOM, Store or storage; preserves other VCL data', () => {
  assert.equal(V.sentinel, true);
  assert.equal(V.courses, undefined);
  assert.deepEqual(plain(S.tools.map(tool => tool.id)), ['vscode', 'antigravity', 'python', 'git', 'codex']);
  assert.equal(allIds.length, 16);
  assert.equal(new Set(allIds).size, 16);
  assert.deepEqual(plain(S.legacyCheckIds), legacy);
  assert.ok(legacy.every(id => allIds.includes(id)));
  assert.ok(!S.legacyCheckIds.some(id => id.startsWith('codex.')));
});

const selectionCases = [
  { aiTools: [], sales: 6, git: 9 },
  { aiTools: ['antigravity'], sales: 9, git: 12 },
  { aiTools: ['codex'], sales: 10, git: 13 },
  { aiTools: ['antigravity', 'codex'], sales: 13, git: 16 }
];
{
  for (const deployPlanned of [false, true]) {
    for (const choice of selectionCases) {
      test(`matrix: deployment=${deployPlanned}, AI=${choice.aiTools.join('+') || 'none'}`, () => {
        const options = { deployPlanned, aiTools: choice.aiTools };
        const expectedTotal = deployPlanned ? choice.git : choice.sales;
        const empty = S.progress(options);
        assert.equal(empty.total, expectedTotal);
        assert.equal(empty.done, 0);
        assert.equal(empty.needsAiSelection, choice.aiTools.length === 0);
        assert.equal(empty.percent, choice.aiTools.length ? 0 : null);
        const complete = S.progress({ ...options, checks: allChecks });
        assert.equal(complete.done, expectedTotal);
        assert.equal(complete.percent, choice.aiTools.length ? 100 : null);
        assert.equal(new Set(complete.requiredIds).size, expectedTotal);
        for (const id of complete.requiredIds) {
          if (id.startsWith('git.')) assert.ok(deployPlanned);
          if (id.startsWith('antigravity.')) assert.ok(choice.aiTools.includes('antigravity'));
          if (id.startsWith('codex.')) assert.ok(choice.aiTools.includes('codex'));
        }
      });
    }
  }
}

test('partial completion rounds correctly and excludes optional/unknown checks', () => {
  const checks = Object.fromEntries(legacy.slice(0, 3).concat(['codex.installed', 'codex.version', 'codex.auth', 'python.path', 'git.version', 'unknown']).map(id => [id, true]));
  const result = S.progress({ aiTools: ['codex'], checks });
  assert.equal(result.done, 7);
  assert.equal(result.total, 10);
  assert.equal(result.percent, 70);
  assert.equal(S.progress({ deployPlanned: true, aiTools: ['codex'], checks: { 'codex.installed': true } }).percent, 8);
});

test('selection changes preserve checks and never borrow Antigravity completion for Codex', () => {
  const options = { deployPlanned: false, aiTools: ['antigravity'], checks: Object.fromEntries(legacy.map(id => [id, true])), progress: { check: { '201': { '0': 1 } } }, last: '#/101/guide/s4' };
  const before = JSON.stringify(options);
  assert.equal(S.progress(options).percent, 100);
  const codexOnly = S.progress({ ...options, aiTools: ['codex'] });
  assert.equal(codexOnly.done, 6);
  assert.equal(codexOnly.total, 10);
  assert.equal(codexOnly.percent, 60);
  assert.equal(S.progress({ ...options, aiTools: [] }).percent, null);
  assert.equal(S.progress({ ...options, deployPlanned: true }).percent, 100);
  assert.equal(S.progress(options).percent, 100);
  assert.equal(JSON.stringify(options), before);
});

test('ignores duplicate/unknown AI IDs and accepts only an explicit deployment boolean', () => {
  assert.equal(S.progress({ aiTools: ['codex', 'codex', 'unknown'], deployPlanned: 'true' }).total, 10);
  assert.equal(S.progress({ aiTools: ['unknown'], deployPlanned: 1 }).percent, null);
  assert.equal(S.progress({ aiTools: 'codex' }).needsAiSelection, true);
});

test('missing/invalid input requests an AI tool selection', () => {
  for (const options of [undefined, null, [], 123, 'sales', {}, { course: 'unknown', checks: allChecks }]) {
    const result = S.progress(options);
    assert.equal(result.needsAiSelection, true);
    assert.equal(result.percent, null);
  }
});

test('counts only own boolean true checks', () => {
  const checks = Object.assign(Object.create(allChecks), { 'codex.installed': true, 'codex.auth': 'true', 'vscode.path': 1, 'python.path': false });
  const result = S.progress({ aiTools: ['codex'], checks });
  assert.equal(result.done, 1);
  for (const malformed of [null, [], 'true', 1]) assert.equal(S.progress({ aiTools: ['codex'], checks: malformed }).done, 0);
});

test('results do not expose mutable calculator state and check order has no effect', () => {
  const options = { aiTools: ['codex'], checks: allChecks };
  const result = S.progress(options);
  result.requiredIds.length = 0;
  assert.equal(S.progress(options).total, 10);
  const reordered = Object.fromEntries(Object.entries(allChecks).reverse());
  assert.deepEqual(plain(S.progress({ ...options, checks: reordered })), plain(S.progress(options)));
});

test('content provides distinct source/checks and only npm requires Node.js', () => {
  for (const tool of S.tools) {
    assert.ok(tool.sourcePath && tool.reason && tool.checks.length);
    assert.equal(new Set(tool.sections.map(s => s.id)).size, tool.sections.length);
    assert.ok(tool.sources.every(source => new URL(source.url).protocol === 'https:'));
  }
  const codex = S.tools.find(tool => tool.id === 'codex');
  assert.equal(codex.installMethods.length, 4);
  assert.deepEqual(plain(codex.installMethods.filter(method => method.requires.includes('node')).map(method => method.id)), ['npm']);
  assert.ok(codex.installMethods.every(method => method.updateCode));
  for (const id of ['auth', 'first-run', 'usage', 'review', 'permissions', 'agents', 'config', 'automation', 'updates', 'troubleshooting']) assert.ok(codex.sections.some(section => section.id === id));
  const commands = S.tools.flatMap(tool => [...tool.installMethods, ...tool.sections.flatMap(section => section.commands || [])]).map(command => command.code || '').join('\n');
  assert.ok(!commands.includes('http.sslVerify false'));
  assert.ok(!commands.includes('MS-CJKLM.vscode-language-pack-ko'));
});

