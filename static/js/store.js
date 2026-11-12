// 진도·설정 저장소. localStorage 가 막혀 있으면 메모리로 대체한다.
(function () {
  const KEY = 'vcl:v1';
  const LEGACY_KEY = 'vibe_coding_checklist_state';
  let legacyPending = false;
  let canMigrate = true;
  const setupData = window.VCL.setup;
  const checkIds = new Set(setupData.tools.flatMap(tool => tool.checks.map(check => check.id)));
  const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  let persistent = true;

  function normalizeSetup(value) {
    const source = isRecord(value) ? value : {};
    const selected = Array.isArray(source.aiTools) ? source.aiTools : [];
    const checks = {};
    if (isRecord(source.checks)) {
      for (const [id, done] of Object.entries(source.checks)) {
        if (checkIds.has(id) && typeof done === 'boolean') checks[id] = done;
      }
    }
    return {
      course: ['sales', 'dev'].includes(source.course) ? source.course : null,
      deployPlanned: source.deployPlanned === true,
      aiTools: setupData.aiToolIds.filter(id => selected.includes(id)),
      checks
    };
  }
  // 준비 상태는 학습 기록과 분리하고 조회 시 배열·체크의 참조를 공유하지 않는다.
  function setupState() { return (state.setup = normalizeSetup(state.setup)); }

  function load() {
    try {
      const raw = window.localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      if (!isRecord(parsed)) { canMigrate = false; return {}; }
      return parsed;
    } catch (e) { persistent = false; canMigrate = false; return {}; }
  }
  let state = load();
  state.progress = isRecord(state.progress) ? state.progress : {};
  for (const k of ['guide', 'labs', 'quiz', 'check']) {
    if (!isRecord(state.progress[k])) state.progress[k] = {};
  }
  if (!isRecord(state.favs)) state.favs = {};
  state.setup = normalizeSetup(state.setup);

  function save() {
    // 체크와 이전 완료 표시는 같은 setItem으로 저장한다. 실패하면 완료로 확정하지 않는다.
    const next = legacyPending ? { ...state, migrations: {
      ...(isRecord(state.migrations) ? state.migrations : {}), setupChecklistV1: true
    } } : state;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
      state = next; legacyPending = false; persistent = true; return true;
    } catch (e) { persistent = false; return false; }
  }

  function migrateLegacy() {
    if (!canMigrate || (isRecord(state.migrations) && state.migrations.setupChecklistV1 === true)) return;
    let raw;
    try { raw = window.localStorage.getItem(LEGACY_KEY); }
    catch (e) { persistent = false; return; }
    if (!raw) return;
    let previous;
    try { previous = JSON.parse(raw); } catch (e) { return; }
    if (!Array.isArray(previous) || previous.length !== setupData.legacyCheckIds.length ||
        !previous.every(value => typeof value === 'boolean')) return;
    const setup = setupState();
    setupData.legacyCheckIds.forEach((id, index) => {
      if (!own(setup.checks, id)) setup.checks[id] = previous[index];
    });
    legacyPending = true;
    save();
  }

  const bucket = (kind, level) => {
    const value = state.progress[kind][level];
    return isRecord(value) ? value : (state.progress[kind][level] = {});
  };

  // 레벨 번호 변경(102→201, 103 허브→300, 103s→301, 103d→302) 이전.
  // 저장된 진도·즐겨찾기·마지막 위치의 옛 id를 새 id로 옮긴다. 새 id는 옛 id와 겹치지 않아 반복 실행해도 안전하다.
  const LEVEL_IDS = { '102': '201', '103': '300', '103s': '301', '103d': '302' };
  const mapLevelId = id => (own(LEVEL_IDS, id) ? LEVEL_IDS[id] : id);
  const mapPrefixed = id => String(id).replace(/^(102|103s|103d|103)(?=-)/, m => LEVEL_IDS[m]);
  function migrateLevelIds() {
    if (!canMigrate) return;
    let changed = false;
    for (const kind of ['guide', 'labs', 'quiz', 'check']) {
      const next = {};
      for (const [level, value] of Object.entries(state.progress[kind])) {
        const key = mapLevelId(level);
        let item = value;
        if (kind === 'labs' && isRecord(value)) {
          item = {};
          for (const [labId, done] of Object.entries(value)) item[mapPrefixed(labId)] = done;
        }
        if (key !== level) changed = true;
        next[key] = isRecord(next[key]) && isRecord(item) ? { ...next[key], ...item } : item;
      }
      state.progress[kind] = next;
    }
    const favs = {};
    for (const [id, on] of Object.entries(state.favs)) {
      const key = mapPrefixed(id);
      if (key !== id) changed = true;
      favs[key] = on;
    }
    state.favs = favs;
    if (typeof state.last === 'string') {
      const last = state.last.replace(/^#\/(102|103s|103d|103)(?=\/|$)/, (m, id) => '#/' + LEVEL_IDS[id]);
      if (last !== state.last) { state.last = last; changed = true; }
    }
    if (changed) save();
  }

  migrateLevelIds();
  migrateLegacy();

  window.Store = {
    get persistent() { return persistent; },
    getTheme() { return ['light', 'dark'].includes(state.theme) ? state.theme : null; },
    setTheme(t) { state.theme = t; save(); },
    getLast() { return typeof state.last === 'string' ? state.last : null; },
    setLast(hash) { state.last = hash; save(); },

    getSetup() { return normalizeSetup(state.setup); },
    setSetupCourse(course) {
      if (course !== null && !['sales', 'dev'].includes(course)) return false;
      setupState().course = course; return save();
    },
    setSetupDeployPlanned(value) {
      if (typeof value !== 'boolean') return false;
      setupState().deployPlanned = value; return save();
    },
    setSetupAiTools(ids) {
      if (!Array.isArray(ids)) return false;
      setupState().aiTools = setupData.aiToolIds.filter(id => ids.includes(id)); return save();
    },
    setSetupCheck(id, done) {
      if (!checkIds.has(id) || typeof done !== 'boolean') return false;
      setupState().checks[id] = done; return save();
    },
    isSetupChecked(id) {
      const checks = setupState().checks;
      return checkIds.has(id) && own(checks, id) && checks[id] === true;
    },

    markGuide(level, sid) { bucket('guide', level)[sid] = 1; save(); },
    guideCount(level) { return Object.keys(bucket('guide', level)).length; },
    isGuideRead(level, sid) { return !!bucket('guide', level)[sid]; },

    setLab(level, id, done) { const b = bucket('labs', level); done ? (b[id] = 1) : delete b[id]; save(); },
    isLabDone(level, id) { return !!bucket('labs', level)[id]; },
    labCount(level) { return Object.keys(bucket('labs', level)).length; },

    saveQuiz(level, score, total) {
      const prev = state.progress.quiz[level];
      state.progress.quiz[level] = { best: Math.max(score, prev ? prev.best : 0), total, last: score };
      save();
    },
    getQuiz(level) { return state.progress.quiz[level] || null; },

    setCheck(level, i, on) { const b = bucket('check', level); on ? (b[i] = 1) : delete b[i]; save(); },
    isChecked(level, i) { return !!bucket('check', level)[i]; },
    checkCount(level) { return Object.keys(bucket('check', level)).length; },

    // 프롬프트 즐겨찾기
    isFav(id) { return !!(state.favs && state.favs[id]); },
    toggleFav(id) { state.favs = state.favs || {}; if (state.favs[id]) delete state.favs[id]; else state.favs[id] = 1; save(); return !!state.favs[id]; },
    favIds() { return Object.keys(state.favs || {}); },

    exportJson() {
      return JSON.stringify({ exportedAt: new Date().toISOString(), progress: state.progress,
        favs: state.favs || {}, setup: normalizeSetup(state.setup) }, null, 2);
    },
    reset() {
      const theme = ['light', 'dark'].includes(state.theme) ? state.theme : null;
      const migrations = isRecord(state.migrations) ? state.migrations : {};
      state = { progress: { guide: {}, labs: {}, quiz: {}, check: {} }, favs: {},
        setup: normalizeSetup(null), migrations };
      if (theme) state.theme = theme;
      // 원본 키는 보존하되 초기화 후 다시 유입되지 않도록 저장 성공 시 이전을 종료한다.
      legacyPending = true;
      return save();
    }
  };
})();


