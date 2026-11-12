// Run with: node tests/store.cjs. Uses only Node built-ins and simulated localStorage.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const KEY = 'vcl:v1';
const plain = value => JSON.parse(JSON.stringify(value));
function storage(seed, raw = false) {
  const values = new Map(seed === undefined ? [] : [[KEY, raw ? seed : JSON.stringify(seed)]]);
  return {
    values, failRead: false, failWrite: false, writes: 0, reads: [],
    getItem(key) { this.reads.push(key); if (this.failRead) throw Error('read blocked'); return values.get(key) ?? null; },
    setItem(key, value) { if (this.failWrite) throw Error('write blocked'); this.writes++; values.set(key, value); }
  };
}
function boot(disk = storage(), options = {}) {
  const window = {};
  Object.defineProperty(window, 'localStorage', { get() { if (options.blockAccess) throw Error('access blocked'); return disk; } });
  const context = { window };
  vm.createContext(context);
  for (const relative of ['data/setup.js', 'js/store.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../static', relative), 'utf8'), context);
  }
  return { S: window.Store, data: window.VCL.setup, disk, context };
}
const defaults = { course: null, deployPlanned: false, aiTools: [], checks: {} };
const old = {
  theme: 'dark', last: '#/101/guide/s4', favs: { prompt1: 1 },
  progress: { guide: { '101': { s4: 1 } }, labs: { '101': { '101-01': 1 } }, quiz: { '101': { best: 2, total: 3, last: 1 } }, check: { '201': Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i, 1])) } },
  custom: { keep: 'unknown normal root fields' }
};

test('new store has safe defaults and does not write on load', () => {
  const { S, disk } = boot();
  assert.deepEqual(plain(S.getSetup()), defaults);
  assert.equal(S.persistent, true);
  assert.equal(disk.writes, 0);
  assert.equal(disk.values.has(KEY), false);
});

test('saves all setup fields under the existing key and restores after reload', () => {
  const { S, disk } = boot();
  assert.equal(S.setSetupCourse('dev'), true);
  assert.equal(S.setSetupDeployPlanned(true), true);
  assert.equal(S.setSetupAiTools(['codex', 'antigravity']), true);
  assert.equal(S.setSetupCheck('codex.auth', true), true);
  assert.equal(S.setSetupCheck('git.identity', false), true);
  const again = boot(disk).S;
  assert.deepEqual(plain(again.getSetup()), { course: 'dev', deployPlanned: true, aiTools: ['antigravity', 'codex'], checks: { 'codex.auth': true, 'git.identity': false } });
  assert.equal(again.isSetupChecked('codex.auth'), true);
  assert.equal(again.isSetupChecked('git.identity'), false);
  assert.deepEqual([...disk.values.keys()], [KEY]);
});

test('setup changes preserve all existing learning records and unknown root fields', () => {
  const { S, disk } = boot(storage(old));
  S.setSetupCourse('sales'); S.setSetupAiTools(['codex']); S.setSetupCheck('codex.first-run', true);
  const saved = JSON.parse(disk.values.get(KEY));
  for (const key of Object.keys(old)) assert.deepEqual(saved[key], old[key]);
  assert.equal(S.getLast(), old.last); assert.equal(S.getTheme(), 'dark');
  assert.equal(S.isFav('prompt1'), true); assert.equal(S.guideCount('101'), 1); assert.equal(S.labCount('101'), 1);
  assert.equal(S.checkCount('201'), 10); assert.deepEqual(plain(S.getQuiz('101')), old.progress.quiz['101']);
});

test('selection and deployment changes retain independent tool checks and explicit false', () => {
  const { S, data } = boot();
  S.setSetupCourse('sales'); S.setSetupAiTools(['antigravity']); S.setSetupCheck('antigravity.auth', true); S.setSetupCheck('codex.auth', false); S.setSetupCheck('git.identity', true);
  const checks = plain(S.getSetup().checks);
  S.setSetupAiTools(['codex']); S.setSetupCourse('dev'); S.setSetupDeployPlanned(true);
  assert.deepEqual(plain(S.getSetup().checks), checks);
  assert.equal(S.isSetupChecked('codex.auth'), false);
  assert.equal(S.isSetupChecked('antigravity.auth'), true);
  assert.equal(data.progress(S.getSetup()).done, 1);
  S.setSetupAiTools([]); assert.equal(data.progress(S.getSetup()).percent, null);
  S.setSetupCourse('sales'); S.setSetupDeployPlanned(false); S.setSetupAiTools(['antigravity']);
  assert.deepEqual(plain(S.getSetup().checks), checks);
  assert.equal(data.progress(S.getSetup()).done, 1);
});

test('read snapshots and caller arrays cannot mutate persisted or in-memory state', () => {
  const { S, disk } = boot(); const selection = ['codex'];
  S.setSetupCourse('sales'); S.setSetupAiTools(selection); S.setSetupCheck('codex.auth', true);
  const raw = disk.values.get(KEY), snapshot = S.getSetup();
  selection.push('antigravity'); snapshot.aiTools.length = 0; snapshot.checks['codex.auth'] = false; snapshot.course = 'dev';
  assert.equal(S.getSetup().course, 'sales'); assert.deepEqual(plain(S.getSetup().aiTools), ['codex']); assert.equal(S.isSetupChecked('codex.auth'), true);
  assert.equal(disk.values.get(KEY), raw);
});

test('invalid setter input cannot erase a valid selection or add unknown checks', () => {
  const { S, disk } = boot(); S.setSetupCourse('sales'); S.setSetupAiTools(['codex']); S.setSetupDeployPlanned(true);
  const raw = disk.values.get(KEY), count = disk.writes;
  for (const value of [undefined, 'mkt', [], {}, 1]) assert.equal(S.setSetupCourse(value), false);
  for (const value of [undefined, null, 'true', 1, []]) assert.equal(S.setSetupDeployPlanned(value), false);
  for (const value of [undefined, null, 'codex', {}]) assert.equal(S.setSetupAiTools(value), false);
  for (const id of ['unknown', '__proto__', 'codex.fake']) assert.equal(S.setSetupCheck(id, true), false);
  for (const value of [undefined, null, 1, 'true', {}]) assert.equal(S.setSetupCheck('codex.auth', value), false);
  assert.equal(disk.values.get(KEY), raw); assert.equal(disk.writes, count); assert.equal(S.isSetupChecked('unknown'), false);
  assert.equal(S.setSetupCourse(null), true); assert.equal(S.getSetup().course, null);
});

test('filters duplicate and unknown AI tool IDs without inferring a choice', () => {
  const { S } = boot();
  S.setSetupAiTools(['codex', 'codex', 'unknown', null]); assert.deepEqual(plain(S.getSetup().aiTools), ['codex']);
  S.setSetupAiTools(['unknown']); assert.deepEqual(plain(S.getSetup().aiTools), []);
});

test('normalizes malformed setup fields while keeping valid booleans and explicit false', () => {
  const { S } = boot(storage({ ...old, setup: { course: 'mkt', deployPlanned: 'true', aiTools: ['codex', 'codex', 'unknown'], checks: { 'codex.installed': true, 'codex.auth': false, 'python.path': 1, 'git.identity': 'true', 'unknown': true } } }));
  assert.deepEqual(plain(S.getSetup()), { course: null, deployPlanned: false, aiTools: ['codex'], checks: { 'codex.installed': true, 'codex.auth': false } });
  assert.equal(S.getLast(), old.last); assert.equal(S.checkCount('201'), 10);
});

for (const value of [null, [], 'bad', true, 123]) {
  test(`malformed setup container: ${JSON.stringify(value)}`, () => {
    const { S } = boot(storage({ ...old, setup: value }));
    assert.deepEqual(plain(S.getSetup()), defaults); assert.equal(S.setSetupCheck('python.path', true), true); assert.equal(S.checkCount('201'), 10);
  });
}
for (const raw of ['null', '[]', '123', 'true', '"text"']) {
  test(`malformed root container: ${raw}`, () => {
    const { S } = boot(storage(raw, true)); assert.deepEqual(plain(S.getSetup()), defaults); assert.equal(S.setSetupCourse('dev'), true);
  });
}

test('malformed JSON does not crash and a later successful save restores persistence', () => {
  const { S, disk } = boot(storage('{broken', true));
  assert.deepEqual(plain(S.getSetup()), defaults); assert.equal(S.persistent, false); assert.equal(disk.writes, 0);
  assert.equal(S.setSetupCourse('sales'), true); assert.equal(S.persistent, true); assert.equal(boot(disk).S.getSetup().course, 'sales');
});

test('malformed learning containers cannot break setup or ordinary learning access', () => {
  const { S } = boot(storage({ progress: { guide: 'bad', labs: [], quiz: null, check: { '201': 'bad' } }, favs: [], last: {}, theme: 1 }));
  assert.equal(S.getLast(), null); assert.equal(S.getTheme(), null); assert.deepEqual(plain(S.favIds()), []);
  assert.equal(S.guideCount('101'), 0); assert.equal(S.labCount('101'), 0); assert.equal(S.checkCount('201'), 0);
  S.setCheck('201', 0, true); S.markGuide('101', 's1'); S.setLab('101', '101-01', true); S.toggleFav('example'); S.saveQuiz('101', 1, 2); S.setSetupCourse('dev');
  assert.equal(S.checkCount('201'), 1); assert.equal(S.isGuideRead('101', 's1'), true); assert.equal(S.isLabDone('101', '101-01'), true); assert.equal(S.isFav('example'), true); assert.equal(S.getQuiz('101').best, 1);
});

test('write blocking preserves the previous disk snapshot and all current memory edits', () => {
  const { S, disk } = boot(storage(old)); const raw = disk.values.get(KEY); disk.failWrite = true;
  assert.equal(S.setSetupCourse('sales'), false); assert.equal(S.setSetupAiTools(['codex']), false); assert.equal(S.setSetupCheck('codex.auth', true), false);
  assert.equal(S.persistent, false); assert.equal(S.isSetupChecked('codex.auth'), true); assert.equal(S.getSetup().course, 'sales');
  assert.equal(disk.values.get(KEY), raw); assert.equal(S.getLast(), old.last); assert.equal(S.checkCount('201'), 10);
  disk.failWrite = false; assert.equal(S.setSetupDeployPlanned(true), true); assert.equal(S.persistent, true);
  const again = boot(disk).S; assert.equal(again.isSetupChecked('codex.auth'), true); assert.equal(again.getSetup().deployPlanned, true); assert.equal(again.getLast(), old.last);
});

test('blocked localStorage getter/read/write operates as temporary memory', () => {
  for (const blockAccess of [true, false]) {
    const disk = storage(old); disk.failRead = true; disk.failWrite = true;
    const { S } = boot(disk, { blockAccess });
    assert.equal(S.persistent, false); assert.equal(S.setSetupCourse('dev'), false); assert.equal(S.setSetupCheck('git.identity', true), false);
    assert.equal(S.getSetup().course, 'dev'); assert.equal(S.isSetupChecked('git.identity'), true); assert.equal(S.persistent, false);
    assert.equal(disk.values.get(KEY), JSON.stringify(old));
  }
});

test('setup edits preserve the legacy source key and never infer an AI tool choice', () => {
  const disk = storage(old), source = JSON.stringify(Array(12).fill(true));
  disk.values.set('vibe_coding_checklist_state', source);
  const { S } = boot(disk); S.setSetupCourse('sales');
  assert.equal(disk.values.get('vibe_coding_checklist_state'), source);
  assert.deepEqual(plain(S.getSetup().aiTools), []);
});

test('actual page scripts define canonical setup data before Store initializes', () => {
  const staticDir = path.join(__dirname, '../static');
  const html = fs.readFileSync(path.join(staticDir, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(match => match[1]);
  assert.equal(scripts.filter(src => src === 'data/setup.js').length, 1);
  assert.ok(scripts.indexOf('data/setup.js') < scripts.indexOf('js/store.js'));
  const context = { localStorage: storage() }; context.window = context; vm.createContext(context);
  for (const src of scripts) {
    vm.runInContext(fs.readFileSync(path.join(staticDir, src), 'utf8'), context);
    if (src === 'js/store.js') break;
  }
  assert.equal(context.VCL.setup.tools.length, 5);
  assert.equal(context.VCL.labs.length, 47);
  assert.deepEqual(plain(context.Store.getSetup()), defaults);
  assert.equal(context.Store.setSetupCheck('codex.auth', true), true);
});


const LEGACY_KEY = 'vibe_coding_checklist_state';
const legacyValues = Array.from({ length: 12 }, (_, index) => index % 2 === 0);
function withLegacy(seed = old, previous = legacyValues) {
  const disk = storage(seed); disk.values.set(LEGACY_KEY, JSON.stringify(previous)); return disk;
}

test('migrates exactly the 12 original positions in one write and preserves all normal fields', () => {
  const disk = withLegacy(), source = disk.values.get(LEGACY_KEY), { S, data } = boot(disk);
  assert.equal(disk.writes, 1);
  const saved = JSON.parse(disk.values.get(KEY));
  assert.equal(saved.migrations.setupChecklistV1, true);
  for (const key of Object.keys(old)) assert.deepEqual(saved[key], old[key]);
  data.legacyCheckIds.forEach((id, i) => assert.equal(S.getSetup().checks[id], legacyValues[i]));
  assert.equal(Object.keys(S.getSetup().checks).length, 12);
  assert.equal(S.getSetup().course, null); assert.deepEqual(plain(S.getSetup().aiTools), []);
  assert.equal(S.getSetup().deployPlanned, false); assert.equal(S.isSetupChecked('codex.installed'), false);
  assert.equal(disk.values.get(LEGACY_KEY), source);
});

test('migration preserves explicit new true/false values and Codex state', () => {
  const disk = withLegacy({ ...old, migrations: { other: true }, setup: { course: 'dev', aiTools: ['codex'], deployPlanned: true, checks: { 'vscode.path': false, 'vscode.version': true, 'codex.auth': true } } });
  const { S } = boot(disk);
  assert.equal(S.isSetupChecked('vscode.path'), false); assert.equal(S.isSetupChecked('vscode.version'), true);
  assert.equal(S.isSetupChecked('codex.auth'), true); assert.equal(S.getSetup().course, 'dev'); assert.deepEqual(plain(S.getSetup().aiTools), ['codex']);
  assert.equal(JSON.parse(disk.values.get(KEY)).migrations.other, true);
});

test('completed migration is idempotent even when the original checklist later changes', () => {
  const disk = withLegacy(), first = boot(disk).S.getSetup();
  disk.values.set(LEGACY_KEY, JSON.stringify(Array(12).fill(true)));
  const count = disk.writes, again = boot(disk).S;
  assert.deepEqual(plain(again.getSetup()), plain(first)); assert.equal(disk.writes, count);
});

test('migration writes no completion marker on failure and retries atomically on the next save', () => {
  const disk = withLegacy(); const raw = disk.values.get(KEY); disk.failWrite = true;
  const { S } = boot(disk);
  assert.equal(S.persistent, false); assert.equal(Object.keys(S.getSetup().checks).length, 12);
  assert.equal(disk.values.get(KEY), raw); assert.equal(JSON.parse(raw).migrations, undefined);
  assert.equal(JSON.parse(S.exportJson()).setup.checks['vscode.path'], true);
  S.setSetupCheck('vscode.path', false); // A manual correction must survive the retry.
  disk.failWrite = false; S.setTheme('light');
  const saved = JSON.parse(disk.values.get(KEY));
  assert.equal(saved.migrations.setupChecklistV1, true); assert.equal(saved.setup.checks['vscode.path'], false);
  assert.equal(saved.setup.checks['python.path'], true); assert.equal(saved.theme, 'light');
  assert.equal(S.persistent, true); assert.deepEqual(plain(boot(disk).S.getSetup()), plain(S.getSetup()));
});

test('failed migration can retry after reload without changing the original key', () => {
  const disk = withLegacy(), raw = disk.values.get(LEGACY_KEY); disk.failWrite = true; boot(disk);
  disk.failWrite = false; const { S } = boot(disk);
  assert.equal(S.isSetupChecked('vscode.path'), true); assert.equal(JSON.parse(disk.values.get(KEY)).migrations.setupChecklistV1, true);
  assert.equal(disk.values.get(LEGACY_KEY), raw);
});

for (const previous of [null, {}, [true], Array(13).fill(true), Array(12).fill(1), [...Array(11).fill(true), null], 'bad']) {
  test(`ignores unexpected legacy format: ${JSON.stringify(previous)}`, () => {
    const disk = withLegacy(old, previous), raw = disk.values.get(KEY), { S } = boot(disk);
    assert.deepEqual(plain(S.getSetup().checks), {}); assert.equal(S.persistent, true); assert.equal(disk.writes, 0); assert.equal(disk.values.get(KEY), raw);
  });
}

test('malformed legacy JSON is skipped without claiming storage is blocked', () => {
  const disk = storage(old); disk.values.set(LEGACY_KEY, '{bad'); const { S } = boot(disk);
  assert.equal(S.persistent, true); assert.equal(disk.writes, 0); assert.deepEqual(plain(S.getSetup().checks), {});
});

test('valid legacy data does not auto-overwrite an unreadable current record', () => {
  const disk = storage('{bad', true); disk.values.set(LEGACY_KEY, JSON.stringify(legacyValues));
  const { S } = boot(disk); assert.equal(S.persistent, false); assert.equal(disk.writes, 0); assert.equal(disk.values.get(KEY), '{bad');
});

test('legacy read error retains the current learning record and can recover after reload', () => {
  const disk = withLegacy(), getItem = disk.getItem;
  disk.getItem = function (key) { if (key === LEGACY_KEY) throw Error('legacy read denied'); return getItem.call(this, key); };
  const { S } = boot(disk); assert.equal(S.persistent, false); assert.equal(S.getLast(), old.last); assert.equal(disk.writes, 0);
  disk.getItem = getItem; assert.equal(boot(disk).S.isSetupChecked('vscode.path'), true);
});

test('all-false original checklist still migrates as explicit values', () => {
  const { S, disk } = boot(withLegacy(old, Array(12).fill(false)));
  assert.equal(Object.keys(S.getSetup().checks).length, 12); assert.ok(Object.values(S.getSetup().checks).every(value => value === false));
  assert.equal(JSON.parse(disk.values.get(KEY)).migrations.setupChecklistV1, true);
});

test('export includes current setup, explicit false and prior learning without internal migration metadata', () => {
  const { S } = boot(withLegacy()); S.setSetupCourse('sales'); S.setSetupAiTools(['codex']); S.setSetupCheck('codex.auth', false);
  const exported = JSON.parse(S.exportJson());
  assert.deepEqual(exported.progress, old.progress); assert.deepEqual(exported.favs, old.favs);
  assert.deepEqual(exported.setup, plain(S.getSetup())); assert.equal(exported.setup.checks['codex.auth'], false);
  assert.ok(Number.isFinite(Date.parse(exported.exportedAt))); assert.equal(Object.hasOwn(exported, 'migrations'), false);
  exported.setup.checks['codex.auth'] = true; assert.equal(S.isSetupChecked('codex.auth'), false);
});

test('reset clears learning, last position and all setup fields while retaining theme and source', () => {
  const disk = withLegacy(), { S } = boot(disk), source = disk.values.get(LEGACY_KEY);
  S.setSetupCourse('dev'); S.setSetupAiTools(['codex']); S.setSetupDeployPlanned(true); S.setSetupCheck('codex.auth', true);
  assert.equal(S.reset(), true);
  assert.deepEqual(plain(S.getSetup()), defaults); assert.equal(S.getLast(), null); assert.equal(S.getTheme(), 'dark');
  assert.equal(S.checkCount('201'), 0); assert.equal(S.guideCount('101'), 0); assert.equal(S.labCount('101'), 0); assert.equal(S.getQuiz('101'), null); assert.deepEqual(plain(S.favIds()), []);
  assert.equal(disk.values.get(LEGACY_KEY), source); assert.equal(JSON.parse(disk.values.get(KEY)).migrations.setupChecklistV1, true);
  const again = boot(disk).S; assert.deepEqual(plain(again.getSetup()), defaults); assert.equal(again.checkCount('201'), 0); assert.equal(again.getTheme(), 'dark');
});

test('reset before any legacy record exists prevents its later reintroduction', () => {
  const disk = storage(old), { S } = boot(disk); assert.equal(S.reset(), true);
  disk.values.set(LEGACY_KEY, JSON.stringify(Array(12).fill(true)));
  assert.deepEqual(plain(boot(disk).S.getSetup()), defaults);
});

test('failed reset is temporary, warns through persistence and commits a suppress marker on retry', () => {
  const disk = withLegacy(), { S } = boot(disk), raw = disk.values.get(KEY); disk.failWrite = true;
  assert.equal(S.reset(), false); assert.equal(S.persistent, false); assert.deepEqual(plain(S.getSetup()), defaults); assert.equal(disk.values.get(KEY), raw);
  assert.notDeepEqual(plain(boot(disk).S.getSetup().checks), {}); // Reload still sees the previous disk snapshot.
  disk.failWrite = false; assert.equal(S.setSetupCourse('sales'), true);
  assert.deepEqual(plain(boot(disk).S.getSetup().checks), {}); assert.equal(JSON.parse(disk.values.get(KEY)).migrations.setupChecklistV1, true);
});

for (const blocked of [false, true]) {
  test(`reset confirmation and result distinguish disk success from memory-only reset: blocked=${blocked}`, () => {
    const { S, disk, context } = boot(storage(old));
    disk.failWrite = blocked;
    const elements = new Map(), messages = []; let view = '', routed = false;
    context.document = { addEventListener() {}, getElementById() { return null; } };
    context.VCL = context.window.VCL;
    for (const relative of ['js/onboarding.js']) {
      vm.runInContext(fs.readFileSync(path.join(__dirname, '../static', relative), 'utf8'), context);
    }
    context.window.VCL_ICON = () => '';
    context.window.VCL_CORE = {
      S, META: { levels: [] }, V: { ...context.window.VCL, prompts: [] }, esc: String, bar: () => '',
      $(id) { if (!elements.has(id)) elements.set(id, { innerHTML: '' }); return elements.get(id); },
      setView(html) { view = html; }, toast(message) { messages.push(message); }, route() { routed = true; }
    };
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../static/js/tools.js'), 'utf8'), context);
    context.window.VCL_TOOLS.me();
    assert.ok(view.includes('학습·준비 기록 내보내기'));
    elements.get('#meReset').onclick();
    assert.ok(elements.get('#meConfirm').innerHTML.includes('AI 도구 선택'));
    const before = disk.values.get(KEY); elements.get('#meNo').onclick(); assert.equal(disk.values.get(KEY), before);
    elements.get('#meReset').onclick(); elements.get('#meYes').onclick();
    assert.equal(routed, true); assert.deepEqual(plain(S.getSetup()), defaults);
    assert.ok(messages[0].includes(blocked ? '저장하지 못했어요' : '초기화했어요'));
    if (blocked) assert.equal(disk.values.get(KEY), before);
    else assert.equal(boot(disk).S.checkCount('201'), 0);
  });
}



test('legacy level ids (102/103/103s/103d) are migrated to 201/300/301/302 once', () => {
  const seed = {
    last: '#/103s/labs/05', favs: { '102-p3-1': 1, '101-p4-1': 1 },
    progress: {
      guide: { '101': { s1: 1 }, '102': { s2: 1 }, '103d': { s3: 1 } },
      labs: { '102': { '102-01': 1 }, '103s': { '103s-02': 1 } },
      quiz: { '102': { best: 2, total: 3, last: 1 } }, check: { '102': { 0: 1 } }
    }
  };
  const { S, disk } = boot(storage(seed));
  assert.equal(S.getLast(), '#/301/labs/05');
  assert.equal(S.guideCount('201'), 1);
  assert.equal(S.guideCount('302'), 1);
  assert.equal(S.guideCount('101'), 1);
  assert.equal(S.isLabDone('201', '201-01'), true);
  assert.equal(S.isLabDone('301', '301-02'), true);
  assert.equal(S.getQuiz('201').best, 2);
  assert.equal(S.isChecked('201', 0), true);
  assert.deepEqual(plain(S.favIds()).sort(), ['101-p4-1', '201-p3-1']);
  assert.equal(S.guideCount('102'), 0);
  assert.equal(disk.writes, 1);
  const saved = JSON.parse(disk.values.get(KEY));
  assert.equal(Object.keys(saved.progress.guide).sort().join(), '101,201,302');
  const again = boot(disk);
  assert.equal(again.disk.writes, 1);
  assert.equal(again.S.guideCount('201'), 1);
});
