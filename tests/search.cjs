// Run with: node tests/search.cjs. No browser or external modules required.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const staticDir = path.join(__dirname, '../static');
const searchCode = fs.readFileSync(path.join(staticDir, 'data/search.js'), 'utf8');
const originalEntries = JSON.parse(searchCode.match(/^VCL\.search = (.*);$/m)[1]);
const plain = value => JSON.parse(JSON.stringify(value));
function boot() {
  const values = new Map(), policy = { unlocked: false };
  const context = {
    document: { addEventListener() {}, getElementById() { return null; } },
    localStorage: { getItem(key) { return values.get(key) ?? null; }, setItem(key, value) { values.set(key, value); } }
  };
  context.window = context; vm.createContext(context);
  for (const file of ['data/meta.js', 'data/setup.js', 'data/search.js', 'js/store.js', 'js/onboarding.js']) {
    vm.runInContext(fs.readFileSync(path.join(staticDir, file), 'utf8'), context);
  }
  context.VCL_CORE = { V: context.VCL, S: context.Store, META: context.VCL.meta,
    levelById: id => context.VCL.meta.levels.find(level => level.id === id),
    hasData: () => true, isUnlocked: level => !['300', '301', '302'].includes(level.id) || policy.unlocked };
  vm.runInContext(fs.readFileSync(path.join(staticDir, 'js/tools.js'), 'utf8'), context);
  return { context, search: context.VCL_TOOLS.search, S: context.Store, policy };
}

test('retains all original search entries and adds public setup types', () => {
  const { context } = boot();
  assert.deepEqual(plain(context.VCL.search.slice(0, originalEntries.length)), originalEntries);
  assert.equal(context.VCL.search.filter(entry => entry.k === 'course').length, 0);
  assert.ok(context.VCL.search.some(entry => entry.k === 'setup' && entry.toolId === 'antigravity'));
  assert.ok(context.VCL.search.some(entry => entry.k === 'setup' && entry.toolId === 'codex'));
});

test('indexes nested authentication, individual commands, permissions and troubleshooting', () => {
  const { search } = boot();
  for (const [query, section] of [['Codex device-auth', 'auth'], ['OPENAI_API_KEY', 'auth'], ['/permissions', 'usage'], ['Codex JSONL', 'automation'], ['Codex PATH', 'troubleshooting']]) {
    assert.ok(search(query).some(entry => entry.k === 'setup' && entry.toolId === 'codex' && entry.sectionId === section), query);
  }
});

test('update queries lead to update instructions rather than installer-only text', () => {
  const { search } = boot();
  const results = search('brew upgrade');
  assert.ok(results.some(entry => entry.toolId === 'codex' && entry.sectionId === 'updates'));
  assert.ok(!results.some(entry => entry.k === 'setup' && entry.toolId === 'codex' && entry.sectionId === 'install'));
});

test('setup search results keep the destination without changing state', () => {
  const { search, S } = boot();
  const before = JSON.stringify(S.getSetup());
  const entry = search('Codex device-auth').find(item => item.k === 'setup' && item.sectionId === 'auth');
  assert.equal(entry.href, '#/setup/codex/auth');
  assert.equal(JSON.stringify(S.getSetup()), before);
  assert.equal(S.getLast(), null);
});

test('setup search destinations do not depend on any stored selection', () => {
  const { search } = boot();
  const entry = search('Codex device-auth').find(item => item.k === 'setup' && item.sectionId === 'auth');
  assert.equal(entry.href, '#/setup/codex/auth');
  assert.equal(search('Vibe Coding').filter(item => item.k === 'course').length, 0);
});

test('preserves the original advanced-level search gate while setup remains public', () => {
  const { search, policy } = boot();
  const advanced = originalEntries.find(entry => entry.lv === '301' && entry.k === 'guide');
  assert.ok(!search(advanced.title).some(entry => entry.lv === '301'));
  assert.ok(search('Codex').some(entry => entry.k === 'setup'));
  policy.unlocked = true;
  assert.ok(search(advanced.title).some(entry => entry.lv === '301'));
});

test('keeps existing glossary/learning matches and ignores empty input', () => {
  const { search } = boot();
  assert.ok(search('토큰').some(entry => entry.lv === '101' && entry.k !== 'setup'));
  assert.equal(search('   ').length, 0);
  assert.equal(search('unfindable-query-907246').length, 0);
});

test('reloading the generated index does not duplicate new entries', () => {
  const { context } = boot(); const before = plain(context.VCL.search);
  vm.runInContext(searchCode, context);
  assert.deepEqual(plain(context.VCL.search), before);
});

test('finds the markdown, meta prompting and ICL/RAG/CPT guides and labs', () => {
  const { search } = boot();
  const has = (query, href) => assert.ok(search(query).some(entry => entry.href === href), `${query} -> ${href}`);
  for (const query of ['마크다운', 'Markdown']) { has(query, '#/101/guide/s2'); has(query, '#/101/guide/s3'); has(query, '#/101/labs/11'); }
  has('메타 프롬프팅', '#/201/guide/s3'); has('메타 프롬프팅', '#/201/labs/17');
  for (const query of ['문맥 내 학습', 'ICL', 'RAG', 'CPT']) { has(query, '#/201/guide/s2'); has(query, '#/201/labs/18'); }
  has('지속 사전 학습', '#/201/labs/18');
  has('마크다운', '#/glossary/101-t30'); has('메타 프롬프팅', '#/glossary/201-t89');
  has('메타 프롬프팅', '#/prompts/201-p3-2'); has('마크다운', '#/prompts/101-p4-10');
});
