// 진도·설정 저장소. localStorage 가 막혀 있으면 메모리로 대체한다.
(function () {
  const KEY = 'vcl:v1';
  let memory = null;
  let persistent = true;

  function load() {
    try {
      const raw = window.localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { persistent = false; return {}; }
  }
  let state = load();
  state.progress = state.progress || { guide: {}, labs: {}, quiz: {}, check: {} };
  for (const k of ['guide', 'labs', 'quiz', 'check']) state.progress[k] = state.progress[k] || {};

  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); persistent = true; }
    catch (e) { persistent = false; memory = state; }
  }

  const bucket = (kind, level) => (state.progress[kind][level] = state.progress[kind][level] || {});

  window.Store = {
    get persistent() { return persistent; },
    getTheme() { return state.theme || null; },
    setTheme(t) { state.theme = t; save(); },
    getLast() { return state.last || null; },
    setLast(hash) { state.last = hash; save(); },

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

    exportJson() { return JSON.stringify({ exportedAt: new Date().toISOString(), progress: state.progress, favs: state.favs || {} }, null, 2); },
    reset() { const t = state.theme; state = { progress: { guide: {}, labs: {}, quiz: {}, check: {} } }; if (t) state.theme = t; save(); }
  };
})();
