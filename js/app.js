// 바이브코딩 라이브러리 – 앱 셸 (라우터 · 사이드바 · 학습 뷰). 도구 화면(사전·프롬프트·내 학습·검색)은 tools.js
(function () {
  'use strict';
  const V = window.VCL || {}, S = window.Store, META = V.meta, ic = window.VCL_ICON;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const view = $('#view');
  const TOOLS = ['glossary', 'prompts', 'me'];

  /* ---------- 데이터 헬퍼 ---------- */
  const levelById = id => META.levels.find(l => l.id === id);
  const levelData = id => (V.levels || {})[id];
  const labsOf = id => (V.labs || []).filter(l => l.level === id);
  const hasData = lv => !!(lv.ready && levelData(lv.id));
  const tracksOf = lv => (lv.tracks || []).map(levelById);
  const isReady = lv => (lv.hub ? tracksOf(lv).some(hasData) : hasData(lv));   // 허브는 공개된 트랙이 있으면 공개
  const topOf = lv => (lv.parent ? levelById(lv.parent) : lv);
  const gateId = lv => lv.unlockedBy || (lv.parent ? levelById(lv.parent).unlockedBy : null);
  const nameOf = lv => lv.fullName || lv.name;

  function sectionsOf(lv) {
    const g = levelData(lv).guide, list = [];
    const intro = g.introHtml.replace(/<h1[\s\S]*?<\/h1>/, '').trim();
    if (intro) list.push({ id: 's0', num: 0, title: '소개', html: intro, toc: [] });
    return list.concat(g.sections);
  }
  const secLabel = s => (s.num ? `${s.num}. ${s.title}` : s.title);

  /* 진도: 가이드(끝까지 본 절) · 실습(완료) · 퀴즈(최고 점수 비율) · 체크리스트 — 네 가지의 평균 */
  function parts(id) {
    const d = levelData(id); if (!d) return null;
    const g = sectionsOf(id).length, labs = labsOf(id).length, c = d.checklist.items.length, q = S.getQuiz(id);
    return {
      guide: g ? Math.min(1, S.guideCount(id) / g) : 0,
      labs: labs ? S.labCount(id) / labs : 0,
      quiz: q && q.total ? q.best / q.total : 0,
      check: c ? S.checkCount(id) / c : 0,
      counts: { guide: [S.guideCount(id), g], labs: [S.labCount(id), labs], check: [S.checkCount(id), c], quiz: q }
    };
  }
  function pct(id) {
    const lv = levelById(id);
    if (lv && lv.hub) { const t = tracksOf(lv).filter(hasData); return t.length ? Math.round(t.reduce((a, x) => a + pct(x.id), 0) / t.length) : 0; }
    const p = parts(id); return p ? Math.round((p.guide + p.labs + p.quiz + p.check) / 4 * 100) : 0;
  }
  function breakdown(id) {
    const p = parts(id); if (!p) return '';
    const c = p.counts;
    return `가이드 ${c.guide[0]}/${c.guide[1]} · 실습 ${c.labs[0]}/${c.labs[1]} · 퀴즈 ${c.quiz ? Math.round(c.quiz.best / c.quiz.total * 100) + '%' : '-'} · 체크 ${c.check[0]}/${c.check[1]}`;
  }

  // 103(과 그 트랙들)은 102 체크리스트를 모두 체크해야 열린다
  function isUnlocked(lv) {
    const gate = gateId(lv);
    if (!gate) return true;
    const d = levelData(gate);
    if (!d) return false;
    const total = d.checklist.items.length;
    return total > 0 && S.checkCount(gate) >= total;
  }
  function unlockProgress(lv) {
    const gate = gateId(lv), d = gate && levelData(gate);
    return d ? { done: S.checkCount(gate), total: d.checklist.items.length } : null;
  }

  /* ---------- 테마 · 색 ---------- */
  const sysDark = () => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = () => S.getTheme() || (sysDark() ? 'dark' : 'light');
  const colorOf = lv => (theme() === 'dark' ? lv.colorDark : lv.color);
  function applyAccent(lv) { document.documentElement.style.setProperty('--accent', lv ? colorOf(lv) : (theme() === 'dark' ? '#8b86ff' : '#4f46e5')); }
  let currentLevel = null;
  function applyTheme() {
    document.documentElement.dataset.theme = theme();
    applyAccent(currentLevel);
    const f = $('.labframe');
    if (f && f.contentWindow) f.contentWindow.postMessage({ type: 'theme', value: theme() }, '*');
  }
  $('#themeBtn').innerHTML = ic('moon', 20);
  $('#themeBtn').onclick = () => { S.setTheme(theme() === 'dark' ? 'light' : 'dark'); applyTheme(); };
  $('#menuBtn').innerHTML = ic('menu', 20);
  $('#brandIcon').innerHTML = ic('library', 20);

  /* ---------- 공용 UI ---------- */
  let toastTimer;
  function toast(msg) {
    let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.style.display = 'block'; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.style.display = 'none'; }, 2200);
  }
  const bar = (p, label) => `<div class="bar" role="progressbar" aria-label="${esc(label || '진도')}" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100"><i style="width:${p}%"></i></div>`;
  function setView(html, title) {
    view.innerHTML = html;
    document.title = (title ? title + ' · ' : '') + META.appName;
  }
  function lvBadge(lv, big) {
    const size = big ? 22 : 15;
    const inner = lv.id === '103s' ? ic('globe', size) : lv.id === '103d' ? ic('beaker', size) : esc(lv.id);
    return `<span class="lvb${big ? ' lg' : ''}" style="--c:${colorOf(lv)}">${inner}</span>`;
  }
  function overall() {
    const ready = META.levels.filter(l => !l.hub && hasData(l));
    const n = ready.length ? Math.round(ready.reduce((a, l) => a + pct(l.id), 0) / ready.length) : 0;
    $('#overall').textContent = `진도 ${n}%`;
  }
  // 화면을 다시 그리지 않고 진도 표시만 갱신 (실습 iframe 상태를 지키기 위해)
  function updateProgressUI(id) {
    const p = pct(id), pg = $('.lv-head .pg');
    if (pg) { $('i', pg).style.width = p + '%'; $('.pgtxt', pg).textContent = p + '%'; pg.title = breakdown(id); }
    renderChrome(parseHash());
  }

  /* ---------- 사이드바 · 탭바 ---------- */
  const subTabs = (lv, tab) => `<div class="nav-sub">
      <a class="nav-item ${tab === 'guide' ? 'on' : ''}" href="#/${lv.id}/guide">${ic('book', 16)} 가이드</a>
      <a class="nav-item ${tab === 'labs' ? 'on' : ''}" href="#/${lv.id}/labs">${ic('flask', 16)} 체험관</a>
      <a class="nav-item ${tab === 'quiz' ? 'on' : ''}" href="#/${lv.id}/quiz">${ic('check', 16)} 퀴즈·체크</a></div>`;

  function renderChrome(p) {
    const cur = p[0] ? levelById(p[0]) : null;
    const activeTop = cur ? topOf(cur).id : '';
    let h = `<a class="nav-item ${p.length === 0 ? 'on' : ''}" href="#/">${ic('home')} 홈</a><div class="nav-group">학습</div>`;
    for (const lv of META.levels.filter(l => !l.parent)) {
      const locked = !isUnlocked(lv), ready = isReady(lv);
      const badge = locked ? `<span class="soon">${ic('lock', 12)} 잠김</span>` : !ready ? '<span class="soon">준비 중</span>' : `<span class="pct">${pct(lv.id)}%</span>`;
      h += `<a class="nav-item ${activeTop === lv.id && !(cur && cur.parent) ? 'on' : ''}" href="#/${lv.id}">${lvBadge(lv)} ${esc(lv.name.replace(/^\d+\s*/, ''))} ${badge}</a>`;
      if (!ready || locked || activeTop !== lv.id) continue;
      if (lv.hub) {
        h += '<div class="nav-sub">' + tracksOf(lv).map(t => {
          const on = cur && cur.id === t.id;
          return `<a class="nav-item ${on ? 'on' : ''}" href="#/${t.id}">${lvBadge(t)} ${esc(t.name)} <span class="pct">${pct(t.id)}%</span></a>` + (on ? subTabs(t, p[1] || 'guide') : '');
        }).join('') + '</div>';
      } else {
        h += subTabs(lv, p[1] || 'guide');
      }
    }
    const tl = (name, icon, label) => `<a class="nav-item ${p[0] === name ? 'on' : ''}" href="#/${name}">${ic(icon)} ${label}</a>`;
    h += `<div class="nav-group">도구</div>${tl('glossary', 'gloss', '용어 사전')}${tl('prompts', 'prompt', '프롬프트')}${tl('me', 'chart', '내 학습')}`;
    $('#side').innerHTML = h;
    $('#tabbar').innerHTML = `<a class="${p.length === 0 ? 'on' : ''}" href="#/"><b>${ic('home', 22)}</b>홈</a>` +
      META.levels.filter(l => !l.parent).map(lv => `<a class="${activeTop === lv.id ? 'on' : ''}" href="#/${lv.id}"><b>${lvBadge(lv)}</b>${lv.id}</a>`).join('') +
      `<a class="${p[0] === 'me' ? 'on' : ''}" href="#/me"><b>${ic('chart', 22)}</b>내 학습</a>`;
    overall();
  }
  function closeMenu() { document.body.classList.remove('menu-open'); $('#menuBtn').setAttribute('aria-expanded', 'false'); }
  $('#menuBtn').onclick = () => { const open = document.body.classList.toggle('menu-open'); $('#menuBtn').setAttribute('aria-expanded', String(open)); };
  $('#scrim').onclick = closeMenu;

  /* ---------- 홈 ---------- */
  function viewHome() {
    let cont = '';
    const last = S.getLast();
    if (last) {
      const p = last.replace(/^#\/?/, '').split('/');
      const lv = levelById(p[0]);
      if (lv && isReady(lv) && isUnlocked(lv)) cont = `<p><a class="primary" href="${esc(last)}">${ic('play', 14, true)} 이어서 학습하기</a> <span class="hint">${esc(nameOf(lv))} · ${esc({ guide: '가이드', labs: '체험관', quiz: '퀴즈·체크' }[p[1] || 'guide'] || '')}</span></p>`;
    }
    if (!cont) {
      const first = META.levels.find(l => !l.hub && isReady(l) && isUnlocked(l));
      if (first) cont = `<p><a class="primary" href="#/${first.id}/guide">${ic('play', 14, true)} ${esc(first.name)} 시작하기</a> <span class="hint">처음이라면 여기서 시작하세요</span></p>`;
    }
    const warn = S.persistent ? '' : '<div class="note">이 브라우저에서는 저장이 막혀 있어, 창을 닫으면 진도가 사라집니다.</div>';
    const cards = META.levels.filter(l => !l.parent).map(lv => {
      const locked = !isUnlocked(lv), ready = isReady(lv);
      let body;
      if (locked) {
        const up = unlockProgress(lv);
        body = `<span class="pill warn">${ic('lock', 12)} 잠김</span><span class="hint">${esc(levelById(gateId(lv)).name)}의 체크리스트를 모두 완료하면 열립니다.${up ? ` (${up.done}/${up.total})` : ''}</span>`;
      } else if (!ready) {
        body = `<span class="pill">준비 중</span><span class="hint">곧 제공될 예정입니다.</span>`;
      } else if (lv.hub) {
        body = bar(pct(lv.id)) + `<span class="hint">${tracksOf(lv).map(t => `${esc(t.name)} ${pct(t.id)}%`).join(' · ')}</span>`;
      } else {
        body = bar(pct(lv.id)) + `<span class="hint">진도 ${pct(lv.id)}% · 실습 ${S.labCount(lv.id)}/${labsOf(lv.id).length}</span>`;
      }
      return `<a class="card lv-card ${locked ? 'locked' : ''}" style="--lv:${colorOf(lv)}" href="#/${lv.id}">
        <span class="t">${lvBadge(lv)} ${esc(lv.name.replace(/^\d+\s*/, ''))}</span><span class="hint">${esc(lv.summary)}</span>${body}</a>`;
    }).join('');
    const tool = (href, icon, title, sub) => `<a class="card tool-card" href="${href}">${ic(icon, 22)}<span><b>${title}</b><br><span class="hint">${sub}</span></span></a>`;
    setView(`<div class="hero"><h1>${esc(META.appName)}</h1>
      <p class="sub" style="margin:0 0 12px">AI Agent와 함께 만드는 법, 처음부터 현업 적용까지.</p>${cont}</div>${warn}
      <div class="path">입문 → 중급 → 고급</div>
      <div class="grid cols3">${cards}</div>
      <h2 class="sec">도구</h2>
      <div class="grid cols3">${tool('#/glossary', 'gloss', '용어 사전', `${(V.glossary || []).length}개 용어`)}${tool('#/prompts', 'prompt', '프롬프트 라이브러리', `${(V.prompts || []).length}개 · 복사·빈칸 채우기`)}${tool('#/me', 'chart', '내 학습', '진도 · 즐겨찾기 · 다음 할 일')}</div>`, '홈');
  }

  /* ---------- 레벨 공통 헤더 ---------- */
  function levelHeader(lv, tab, crumbTail) {
    const par = lv.parent ? levelById(lv.parent) : null;
    const t = (id, icon, label) => `<a class="${tab === id ? 'on' : ''}" href="#/${lv.id}/${id}">${ic(icon, 16)} ${label}</a>`;
    return `<div class="lv-head" style="--lv:${colorOf(lv)}">
      <div class="lv-top">${lvBadge(lv, true)}
        <div class="lv-name"><p class="crumb"><a href="#/">홈</a> › ${par ? `<a href="#/${par.id}">${esc(par.name)}</a> › ` : ''}<a href="#/${lv.id}">${esc(lv.name)}</a>${crumbTail ? ' › ' + esc(crumbTail) : ''}</p>
          <h1 class="page">${esc(nameOf(lv))}</h1></div>
        <div class="pg" title="${esc(breakdown(lv.id))}">${bar(pct(lv.id))}<span class="pgtxt">${pct(lv.id)}%</span></div></div>
      <nav class="tabs" aria-label="${esc(nameOf(lv))} 탭">${t('guide', 'book', '가이드')}${t('labs', 'flask', '체험관')}${t('quiz', 'check', '퀴즈·체크')}</nav></div>`;
  }

  // 103 허브: 분야(트랙) 선택
  function viewHub(lv) {
    const cards = tracksOf(lv).map(t => {
      const ok = hasData(t);
      const body = ok
        ? `${bar(pct(t.id))}<span class="hint">진도 ${pct(t.id)}% · 가이드 ${levelData(t.id).guide.sections.length}장 · 실습 ${labsOf(t.id).length}개</span><span><span class="cta">${S.guideCount(t.id) ? '이어서 학습' : '시작하기'}</span></span>`
        : '<span class="pill">준비 중</span>';
      return `<a class="card lv-card" style="--lv:${colorOf(t)}" href="#/${t.id}"><span class="t">${lvBadge(t)} ${esc(t.name)}</span><span class="hint">${esc(t.summary)}</span>${body}</a>`;
    }).join('');
    setView(`<p class="crumb"><a href="#/">홈</a> › ${esc(lv.name)}</p><h1 class="page">${esc(lv.name)}</h1>
      <p class="sub">어떤 업무 분야에 적용하시나요? 같은 고급 원칙을 분야에 맞게 다룹니다.</p>
      <div class="grid cols2">${cards}</div>
      <div class="note">다른 직군(마케팅 · 인사 · 재무 등)은 같은 구조로 트랙을 추가할 수 있습니다.</div>`, lv.name);
  }

  function viewLocked(lv) {
    const up = unlockProgress(lv), base = levelById(gateId(lv));
    setView(`<p class="crumb"><a href="#/">홈</a> › ${esc(nameOf(lv))}</p><h1 class="page">${esc(nameOf(lv))}</h1>
      <div class="card"><p><span class="pill warn">${ic('lock', 12)} 잠김</span></p>
      <p><b>${esc(base.name)}</b>의 체크리스트를 모두 완료하면 이 단계가 열립니다.</p>
      ${up ? `<div class="row" style="max-width:360px">${bar(Math.round(up.done / up.total * 100))}<span class="hint">${up.done}/${up.total}</span></div>` : '<p class="hint">102 콘텐츠를 준비하는 중입니다.</p>'}
      <p>${up ? `<a class="primary" href="#/${base.id}/quiz">체크리스트로 이동</a>` : '<a class="primary" href="#/">홈으로</a>'}</p></div>`, lv.name);
  }
  function viewSoon(lv) {
    setView(`<p class="crumb"><a href="#/">홈</a> › ${esc(lv.name)}</p><h1 class="page">${esc(lv.name)}</h1>
      <div class="card"><p><span class="pill">준비 중</span></p><p>${esc(lv.summary)} 내용이 곧 제공됩니다.</p><p><a class="primary" href="#/">홈으로</a></p></div>`, lv.name);
  }

  /* ---------- 가이드 ---------- */
  function copyText(text, done) {
    const fallback = () => {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('복사하지 못했어요. 직접 선택해서 복사하세요.'); }
      ta.remove();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
  }
  function enhanceProse(root) {
    $$('pre', root).forEach(pre => {
      const wrap = document.createElement('div'); wrap.className = 'codebox';
      pre.parentNode.insertBefore(wrap, pre); wrap.appendChild(pre);
      const b = document.createElement('button'); b.className = 'copy'; b.type = 'button'; b.innerHTML = ic('copy', 14) + ' 복사';
      b.onclick = () => copyText(pre.innerText, () => { b.textContent = '✔ 복사됨'; setTimeout(() => { b.innerHTML = ic('copy', 14) + ' 복사'; }, 1400); });
      wrap.appendChild(b);
    });
    $$('table', root).forEach(t => { const w = document.createElement('div'); w.className = 'tbl-wrap'; t.parentNode.insertBefore(w, t); w.appendChild(t); });
  }

  let observer = null;
  const stopObserver = () => { if (observer) { observer.disconnect(); observer = null; } };

  function viewGuide(lv, sid) {
    const d = levelData(lv.id), secs = sectionsOf(lv.id);
    let idx = secs.findIndex(s => s.id === sid); if (idx < 0) idx = 0;
    const s = secs[idx];
    const links = (d.links || {})[s.id] || [];
    const labs = links.map(n => V.labs.find(l => l.id === `${lv.id}-${n}`)).filter(Boolean);
    const toc = secs.map(x => {
      const cls = [x.id === s.id ? 'on' : '', S.isGuideRead(lv.id, x.id) && x.id !== s.id ? 'read' : ''].join(' ');
      let h = `<a class="${cls}" href="#/${lv.id}/guide/${x.id}">${esc(secLabel(x))}</a>`;
      if (x.id === s.id) h += x.toc.map(t => `<a class="h3" href="#/${lv.id}/guide/${x.id}" data-jump="${t.id}">${esc(t.title)}</a>`).join('');
      return h;
    }).join('');
    const prev = secs[idx - 1], next = secs[idx + 1];
    setView(`${levelHeader(lv, 'guide', secLabel(s))}
      <details class="toc-mobile"><summary>${ic('menu', 16)} 목차 (${esc(secLabel(s))})</summary><div class="toc">${toc}</div></details>
      <div class="split"><nav class="toc" aria-label="목차">${toc}</nav>
      <article class="prose"><h2 style="margin-top:0">${esc(secLabel(s))}</h2>${s.html}
        ${labs.length ? `<div class="related"><b>관련 체험</b><br>${labs.map(l => `<a href="#/${lv.id}/labs/${l.id.split('-')[1]}">${ic('flask', 14)} ${l.num}. ${esc(l.title)}</a>`).join('')}</div>` : ''}
        <div class="pager">${prev ? `<a href="#/${lv.id}/guide/${prev.id}">← ${esc(secLabel(prev))}</a>` : '<span></span>'}${next ? `<a href="#/${lv.id}/guide/${next.id}">${esc(secLabel(next))} →</a>` : `<a href="#/${lv.id}/labs">체험관으로 →</a>`}</div>
      </article></div>`, `${nameOf(lv)} · ${secLabel(s)}`);
    enhanceProse($('.prose'));
    $$('[data-jump]').forEach(a => a.onclick = e => { e.preventDefault(); const el = document.getElementById(a.dataset.jump); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); });

    // 절의 끝(이전/다음 버튼)까지 내려와야 "읽음"으로 기록한다
    const markRead = () => { if (!S.isGuideRead(lv.id, s.id)) { S.markGuide(lv.id, s.id); updateProgressUI(lv.id); } };
    const pager = $('.pager');
    if ('IntersectionObserver' in window && pager) {
      observer = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { markRead(); stopObserver(); } });
      observer.observe(pager);
    } else markRead();
  }

  /* ---------- 체험관 ---------- */
  const isMobile = () => !!(window.matchMedia && window.matchMedia('(max-width: 900px)').matches);
  let frameId = null, currentLab = null;

  function setLabDone(lv, lab, done, auto) {
    S.setLab(lv.id, lab.id, done);
    const b = $('#doneBtn'); if (b) { b.textContent = done ? '✔ 완료됨 (취소)' : '✔ 완료로 표시'; b.className = done ? '' : 'primary'; }
    const ck = $(`.lablist a[href="#/${lv.id}/labs/${lab.id.split('-')[1]}"] .ck`); if (ck) ck.textContent = done ? '✔' : '';
    const cnt = $('#labCountText'); if (cnt) cnt.textContent = `${S.labCount(lv.id)}/${labsOf(lv.id).length}`;
    toast(done ? (auto ? '충분히 해보셨네요! 실습 완료로 기록했어요 (아래 버튼으로 취소 가능)' : '완료로 표시했어요') : '완료 표시를 취소했어요');
    updateProgressUI(lv.id);
  }

  window.addEventListener('message', e => {
    const f = $('.labframe');
    if (!f || e.source !== f.contentWindow || !e.data) return;
    const m = e.data;
    if (m.type === 'lab-height' && m.id === frameId) f.style.height = Math.max(360, m.height + 6) + 'px';
    if (m.type === 'lab-error') console.warn('[lab]', m.id, m.message);
    if (m.type === 'toast') toast(m.message);
    if (m.type === 'lab-engaged' && currentLab && m.id === currentLab.lab.id && !S.isLabDone(currentLab.lv.id, m.id)) setLabDone(currentLab.lv, currentLab.lab, true, true);
  });

  function viewLabs(lv, num) {
    const labs = labsOf(lv.id);
    let idx = labs.findIndex(l => l.id === `${lv.id}-${num}`); if (idx < 0) idx = 0;
    const lab = labs[idx], done = S.isLabDone(lv.id, lab.id);
    const d = levelData(lv.id);
    const rel = Object.entries(d.links || {}).filter(([, ns]) => ns.includes(lab.id.split('-')[1])).map(([sid]) => sectionsOf(lv.id).find(s => s.id === sid)).filter(Boolean);
    let lastGroup = '';
    const list = labs.map(l => {
      const head = l.group && l.group !== lastGroup ? `<div class="grp">${esc(l.group)}</div>` : '';
      lastGroup = l.group || lastGroup;
      return head + `<a class="${l.id === lab.id ? 'on' : ''}" href="#/${lv.id}/labs/${l.id.split('-')[1]}">${l.num}. ${esc(l.title)}<span class="ck">${S.isLabDone(lv.id, l.id) ? '✔' : ''}</span></a>`;
    }).join('');
    const prev = labs[idx - 1], next = labs[idx + 1];
    frameId = lab.id; currentLab = { lv, lab };
    setView(`${levelHeader(lv, 'labs', `${lab.num}. ${lab.title}`)}
      <div class="split"><details class="lab-nav" ${isMobile() ? '' : 'open'}><summary>${ic('flask', 16)} 실습 목록 · <span id="labCountText">${S.labCount(lv.id)}/${labs.length}</span> 완료</summary><nav class="lablist" aria-label="실습 목록">${list}</nav></details>
      <div style="min-width:0"><h2 style="margin:0">${lab.num}. ${esc(lab.title)}</h2>
        <div class="terms">${lab.terms.map(t => `<span>${esc(t)}</span>`).join('')}</div>
        <iframe class="labframe" title="${esc(lab.title)}" sandbox="allow-scripts" src="${lab.file}#theme=${theme()}"></iframe>
        <div class="row" style="margin-top:12px"><button id="doneBtn" class="${done ? '' : 'primary'}">${done ? '✔ 완료됨 (취소)' : '✔ 완료로 표시'}</button>
          ${rel.length ? `<span class="hint">관련 가이드: ${rel.map(s => `<a href="#/${lv.id}/guide/${s.id}">${esc(secLabel(s))}</a>`).join(', ')}</span>` : ''}</div>
        <div class="pager">${prev ? `<a href="#/${lv.id}/labs/${prev.id.split('-')[1]}">← ${esc(prev.title)}</a>` : '<span></span>'}${next ? `<a href="#/${lv.id}/labs/${next.id.split('-')[1]}">${esc(next.title)} →</a>` : `<a href="#/${lv.id}/quiz">퀴즈·체크로 →</a>`}</div>
      </div></div>`, `${nameOf(lv)} · 실습 ${lab.num}`);
    $('#doneBtn').onclick = () => setLabDone(lv, lab, !S.isLabDone(lv.id, lab.id), false);
  }

  /* ---------- 퀴즈 · 체크 ---------- */
  function viewQuiz(lv) {
    const d = levelData(lv.id), qd = d.quiz, cl = d.checklist;
    const best = S.getQuiz(lv.id);
    const unlocks = META.levels.filter(l => l.unlockedBy === lv.id);
    const qs = qd.quiz.map((q, qi) => `<div class="q" data-q="${qi}"><b>Q${qi + 1}. ${esc(q.q)}</b>${q.options.map((o, oi) => `<button class="opt" type="button" data-o="${oi}">${esc(o)}</button>`).join('')}</div>`).join('');
    const checks = cl.items.map((t, i) => `<label class="check"><input type="checkbox" data-i="${i}" ${S.isChecked(lv.id, i) ? 'checked' : ''}><span>${esc(t)}</span></label>`).join('');
    setView(`${levelHeader(lv, 'quiz')}
      <div class="grid cols2" style="align-items:start">
        <section class="card"><h2 style="margin:0 0 6px">확인 퀴즈</h2>
          <p class="hint" id="qInfo">${best ? `최고 점수 ${best.best}/${best.total}` : '아직 풀지 않았어요.'}</p>${qs || '<p class="hint">퀴즈가 없습니다.</p>'}
          <div id="qResult"></div></section>
        <section class="card"><h2 style="margin:0 0 6px">${esc(cl.title)} <span class="hint" id="ckCount"></span></h2>${checks || '<p class="hint">항목이 없습니다.</p>'}<div id="ckResult" style="margin-top:10px"></div></section>
      </div>
      ${qd.cards.length ? `<h2 class="sec">용어 카드 (눌러서 뒤집기)</h2><div class="cards">${qd.cards.map(c => `<div class="flip" tabindex="0" role="button" aria-pressed="false"><div><div class="face front">${esc(c.term)}</div><div class="face back">${esc(c.desc)}</div></div></div>`).join('')}</div>` : ''}`,
      `${nameOf(lv)} · 퀴즈·체크`);

    let score = 0, done = 0;
    $$('.q').forEach(box => $$('.opt', box).forEach(b => b.onclick = () => {
      const qi = +box.dataset.q, oi = +b.dataset.o, opts = $$('.opt', box), q = qd.quiz[qi];
      if (opts.some(x => x.disabled)) return;
      opts.forEach(x => { x.disabled = true; });
      const correct = oi === q.answer;
      opts[q.answer].classList.add('right');
      opts[q.answer].insertAdjacentHTML('afterbegin', '<span aria-hidden="true">✔ </span>');
      if (correct) score += 1; else { b.classList.add('wrong'); b.insertAdjacentHTML('afterbegin', '<span aria-hidden="true">✘ </span>'); }
      box.insertAdjacentHTML('beforeend', `<div class="fb ${correct ? 'ok' : 'bad'}" role="status">${correct ? '정답입니다.' : '오답입니다. 정답: ' + esc(q.options[q.answer])}</div>${q.explain ? `<p class="ex">${esc(q.explain)}</p>` : ''}`);
      done += 1;
      if (done === qd.quiz.length) {
        S.saveQuiz(lv.id, score, qd.quiz.length);
        $('#qResult').innerHTML = `<div class="note"><b>${score}/${qd.quiz.length}</b> ${score === qd.quiz.length ? '🎉 만점!' : '틀린 문항의 해설을 읽고 가이드·체험관에서 복습해 보세요.'}</div><button type="button" id="qRetry">다시 풀기</button>`;
        $('#qRetry').onclick = () => route(true);
        const res = $('#qResult'); if (res.scrollIntoView) res.scrollIntoView({ behavior: 'smooth', block: 'center' });
        updateProgressUI(lv.id);
      }
    }));

    const upd = () => {
      const n = S.checkCount(lv.id), total = cl.items.length;
      $('#ckCount').textContent = `${n}/${total}`;
      let msg = '';
      if (total && n >= total) {
        msg = '<div class="note">✅ 체크리스트를 모두 완료했어요!' + (unlocks.length ? ` ${unlocks.map(u => `<b>${esc(u.name)}</b>`).join(', ')} 단계가 열렸습니다. ${unlocks.map(u => `<a href="#/${u.id}">${esc(u.name)}로 이동 →</a>`).join(' ')}` : '') + '</div>';
      } else if (unlocks.length) {
        msg = `<p class="hint">모두 완료하면 ${unlocks.map(u => esc(u.name)).join(', ')}이(가) 열립니다.</p>`;
      }
      $('#ckResult').innerHTML = msg;
    };
    $$('.check input').forEach(c => c.onchange = () => { S.setCheck(lv.id, +c.dataset.i, c.checked); upd(); updateProgressUI(lv.id); });
    upd();
    $$('.flip').forEach(f => { const t = () => { f.classList.toggle('on'); f.setAttribute('aria-pressed', String(f.classList.contains('on'))); }; f.onclick = t; f.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); t(); } }; });
  }

  /* ---------- 라우터 ---------- */
  const parseHash = () => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(x => { try { return decodeURIComponent(x); } catch (e) { return x; } });
  let lastKey = '', booted = false;
  function route(force) {
    const p = parseHash(), key = p.join('/');
    stopObserver(); currentLab = null;
    const isTool = TOOLS.includes(p[0]);
    const lv = !isTool && p[0] ? levelById(p[0]) : null;
    currentLevel = lv && isReady(lv) && isUnlocked(lv) ? lv : null;
    applyAccent(currentLevel);
    closeMenu();
    if (isTool) {
      if (window.VCL_TOOLS && window.VCL_TOOLS[p[0]]) window.VCL_TOOLS[p[0]](p.slice(1));
      else viewHome();
    } else if (!lv) { if (p.length) { location.hash = '#/'; return; } viewHome(); }
    else if (!isUnlocked(lv)) viewLocked(lv);
    else if (!isReady(lv)) viewSoon(lv);
    else if (lv.hub) viewHub(lv);
    else if (!hasData(lv)) viewSoon(lv);
    else {
      const tab = p[1] || 'guide';
      if (tab === 'labs') viewLabs(lv, p[2]);
      else if (tab === 'quiz') viewQuiz(lv);
      else viewGuide(lv, p[2]);
      S.setLast('#/' + (p.length ? p.join('/') : lv.id));
    }
    renderChrome(p);
    if (!force && key !== lastKey) { window.scrollTo(0, 0); if (booted) view.focus({ preventScroll: true }); }
    lastKey = key; booted = true;
  }

  window.addEventListener('hashchange', () => route(false));
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(() => { if (!S.getTheme()) { applyTheme(); route(true); } });
  }

  // tools.js 와 테스트가 쓰는 공용 객체
  window.VCL_CORE = { V, S, META, ic, $, $$, esc, setView, toast, bar, theme, colorOf, lvBadge, copyText, levelById, levelData, labsOf, hasData, tracksOf, topOf, nameOf, isUnlocked, isReady, sectionsOf, secLabel, pct, parts, breakdown, route, parseHash, renderChrome };
  window.VCL_APP = { route, isUnlocked, pct, parts };

  applyTheme();
  route(false);
})();
