// 도구 화면: 용어 사전 · 프롬프트 라이브러리 · 내 학습 · 통합 검색 (Ctrl+K)
(function () {
  'use strict';
  const ic = window.VCL_ICON;
  const core = () => window.VCL_CORE;

  // 잠긴 단계(103)의 내용은 열리기 전까지 사전·프롬프트·검색에서 숨긴다
  const visibleLevels = () => { const C = core(); return C.META.levels.filter(l => !l.hub && C.hasData(l) && C.isUnlocked(l)); };
  const hiddenNote = () => {
    const C = core();
    const hid = C.META.levels.filter(l => !l.hub && C.hasData(l) && !C.isUnlocked(l));
    return hid.length ? `<div class="note">${hid.map(l => C.esc(C.nameOf(l))).join(', ')} 내용은 102 체크리스트를 완료하면 이곳에도 표시됩니다.</div>` : '';
  };
  const shortLv = id => { const C = core(), l = C.levelById(id); return l.parent ? l.name : l.id; };
  const lvLabel = id => core().nameOf(core().levelById(id));
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 검색어 강조 (원문을 쪼개서 이스케이프하므로 안전)
  function hl(raw, tokens) {
    const C = core();
    if (!tokens.length) return C.esc(raw);
    const re = new RegExp('(' + tokens.map(reEsc).join('|') + ')', 'ig');
    return String(raw).split(re).map((part, i) => (i % 2 ? `<mark>${C.esc(part)}</mark>` : C.esc(part))).join('');
  }
  function levelChips(cur) {
    const C = core();
    return `<button type="button" class="chip-btn ${cur === 'all' ? 'on' : ''}" data-lv="all">전체</button>` +
      visibleLevels().map(l => `<button type="button" class="chip-btn ${cur === l.id ? 'on' : ''}" data-lv="${l.id}">${C.esc(C.nameOf(l))}</button>`).join('');
  }

  /* ================= 용어 사전 ================= */
  const gl = { level: 'all', cat: 'all', q: '', scroll: 0 };

  function glossary(args) {
    const C = core(), V = C.V, esc = C.esc, $ = C.$;
    const visIds = new Set(visibleLevels().map(l => l.id));
    if (gl.level !== 'all' && !visIds.has(gl.level)) gl.level = 'all';
    const all = (V.glossary || []).filter(g => visIds.has(g.level));
    const sel = args[0] ? all.find(g => g.id === args[0]) : null;

    const cats = () => [...new Set(all.filter(g => gl.level === 'all' || g.level === gl.level).map(g => g.category).filter(Boolean))];
    const catOptions = () => {
      if (gl.cat !== 'all' && !cats().includes(gl.cat)) gl.cat = 'all';
      return `<option value="all">모든 분류</option>` + cats().map(c => `<option value="${esc(c)}" ${gl.cat === c ? 'selected' : ''}>${esc(c)}</option>`).join('');
    };

    function detail() {
      if (!sel) return `<div class="card gl-empty"><p class="hint">왼쪽에서 용어를 선택하면 설명과 관련 내용이 표시됩니다.</p></div>`;
      const d = C.levelData(sel.level), sec = d.guide.sections.find(s => s.id === sel.section);
      const labIds = ((d.links || {})[sel.section] || []);
      const labs = labIds.map(n => V.labs.find(l => l.id === `${sel.level}-${n}`)).filter(Boolean).slice(0, 5);
      const lower = sel.term.toLowerCase();
      const prompts = lower.length >= 2 ? (V.prompts || []).filter(p => p.level === sel.level && (p.title + ' ' + p.text).toLowerCase().includes(lower)).slice(0, 4) : [];
      const related = all.filter(g => g.level === sel.level && g.category === sel.category && g.id !== sel.id).slice(0, 8);
      return `<article class="card gl-detail">
        <a class="back" href="#/glossary">← 목록</a>
        <h2 style="margin:6px 0 4px">${esc(sel.term)}</h2>
        <p class="hint">${esc(lvLabel(sel.level))}${sel.category ? ' · ' + esc(sel.category) : ''}</p>
        <p class="gl-desc">${esc(sel.desc)}</p>
        ${sec ? `<p><b>나온 곳</b> <a href="#/${sel.level}/guide/${sel.section}">${esc(C.secLabel(sec))}</a></p>` : ''}
        ${labs.length ? `<p><b>관련 체험</b><br>${labs.map(l => `<a class="tagl" href="#/${l.level}/labs/${l.id.split('-')[1]}">${ic('flask', 14)} ${l.num}. ${esc(l.title)}</a>`).join('')}</p>` : ''}
        ${prompts.length ? `<p><b>관련 프롬프트</b><br>${prompts.map(p => `<a class="tagl" href="#/prompts/${p.id}">${ic('prompt', 14)} ${esc(p.title)}</a>`).join('')}</p>` : ''}
        ${related.length ? `<p><b>같은 분류의 용어</b><br>${related.map(g => `<a class="tagl" href="#/glossary/${g.id}">${esc(g.term)}</a>`).join('')}</p>` : ''}
      </article>`;
    }

    C.setView(`<h1 class="page">용어 사전</h1>
      <p class="sub">${all.length}개 용어 · 가이드와 체험으로 바로 이어집니다.</p>
      <div class="gl ${sel ? 'has-sel' : ''}">
        <div class="gl-left">
          <input type="search" id="glQ" class="inp" placeholder="용어·설명 검색" aria-label="용어 검색" value="${esc(gl.q)}">
          <div class="chips" id="glLv">${levelChips(gl.level)}</div>
          <select id="glCat" class="inp" aria-label="분류">${catOptions()}</select>
          <div class="hint" id="glCount"></div>
          <div id="glList" class="gl-list"></div>
        </div>
        <div class="gl-right">${detail()}</div>
      </div>${hiddenNote()}`, '용어 사전');

    function fill() {
      const q = gl.q.trim().toLowerCase();
      const items = all.filter(g => (gl.level === 'all' || g.level === gl.level) && (gl.cat === 'all' || g.category === gl.cat) &&
        (!q || (g.term + ' ' + g.desc).toLowerCase().includes(q)));
      $('#glCount').textContent = `${items.length}개`;
      $('#glList').innerHTML = items.map(g => `<a class="gl-item ${sel && sel.id === g.id ? 'on' : ''}" href="#/glossary/${g.id}"><b>${hl(g.term, q ? [q] : [])}</b><span class="hint">${esc(shortLv(g.level))}${g.category ? ' · ' + esc(g.category) : ''}</span></a>`).join('') || '<p class="hint" style="padding:8px">일치하는 용어가 없습니다.</p>';
      $$list().forEach(a => { a.onclick = () => { gl.scroll = $('#glList').scrollTop; }; });
    }
    const $$list = () => C.$$('.gl-item');
    $('#glQ').oninput = e => { gl.q = e.target.value; fill(); };
    $('#glCat').onchange = e => { gl.cat = e.target.value; fill(); };
    C.$$('#glLv .chip-btn').forEach(b => b.onclick = () => {
      gl.level = b.dataset.lv; gl.cat = 'all';
      C.$$('#glLv .chip-btn').forEach(x => x.classList.toggle('on', x === b));
      $('#glCat').innerHTML = catOptions(); fill();
    });
    fill();
    const list = $('#glList');
    if (sel) { const on = $('.gl-item.on', list); list.scrollTop = gl.scroll; if (on && on.scrollIntoView && gl.scroll === 0) on.scrollIntoView({ block: 'nearest' }); }
  }

  /* ================= 프롬프트 라이브러리 ================= */
  const pr = { level: 'all', q: '', fav: false, open: null, values: {} };
  const PH = /\[([^\[\]\n]{1,40})\]/g;
  const placeholders = text => [...new Set([...text.matchAll(PH)].map(m => m[1]))];
  const composed = (p, vals) => p.text.replace(PH, (m, t) => ((vals[t] || '').trim() ? vals[t] : m));

  function prompts(args) {
    const C = core(), V = C.V, S = C.S, esc = C.esc, $ = C.$;
    const visIds = new Set(visibleLevels().map(l => l.id));
    if (pr.level !== 'all' && !visIds.has(pr.level)) pr.level = 'all';
    const all = (V.prompts || []).filter(p => visIds.has(p.level));
    if (args[0]) {
      const target = all.find(p => p.id === args[0]);
      if (target) { pr.level = 'all'; pr.q = ''; pr.fav = false; pr.open = target.id; }
    }

    C.setView(`<h1 class="page">프롬프트 라이브러리</h1>
      <p class="sub">${all.length}개 · 복사해서 쓰거나 <b>[대괄호]</b> 부분만 채워 완성본을 만드세요.</p>
      <div class="toolbar"><input type="search" id="prQ" class="inp" placeholder="프롬프트 검색" aria-label="프롬프트 검색" value="${esc(pr.q)}">
        <button type="button" id="prFav" class="chip-btn ${pr.fav ? 'on' : ''}" aria-pressed="${pr.fav}">${ic('star', 14, true)} 즐겨찾기만</button></div>
      <div class="chips" id="prLv" style="margin:8px 0">${levelChips(pr.level)}</div>
      <p class="hint" id="prCount"></p>
      <div class="grid cols2 pr-grid" id="prGrid"></div>${hiddenNote()}`, '프롬프트 라이브러리');

    function card(p) {
      const fav = S.isFav(p.id), phs = placeholders(p.text), open = pr.open === p.id;
      const vals = pr.values[p.id] = pr.values[p.id] || {};
      return `<article class="card pr-card ${open ? 'open' : ''}" id="pc-${p.id}">
        <div class="pr-head"><div><b>${esc(p.title)}</b><br><span class="hint">${esc(lvLabel(p.level))}</span></div>
          <button type="button" class="star ${fav ? 'on' : ''}" data-fav="${p.id}" aria-pressed="${fav}" aria-label="즐겨찾기">${ic('star', 18, fav)}</button></div>
        <pre class="pr-pre">${esc(p.text)}</pre>
        <div class="row"><button type="button" data-copy="${p.id}">${ic('copy', 14)} 복사</button>
          ${phs.length ? `<button type="button" data-fill="${p.id}">${open ? '빈칸 닫기' : `빈칸 채우기 (${phs.length})`}</button>` : ''}
          <a class="hint" href="#/${p.level}/guide/${p.section}">가이드에서 보기</a></div>
        ${open && phs.length ? `<div class="fill">${phs.map(t => `<label class="f">${esc(t)}<input type="text" class="inp" data-tok="${esc(t)}" value="${esc(vals[t] || '')}" placeholder="${esc(t)}"></label>`).join('')}
          <p class="hint" style="margin:6px 0 4px">완성본 미리보기</p><pre class="pr-out" id="out-${p.id}">${esc(composed(p, vals))}</pre>
          <button type="button" class="primary" data-copyfill="${p.id}">${ic('copy', 14)} 완성본 복사</button></div>` : ''}
      </article>`;
    }

    function fill() {
      const q = pr.q.trim().toLowerCase();
      const items = all.filter(p => (pr.level === 'all' || p.level === pr.level) && (!pr.fav || S.isFav(p.id)) && (!q || (p.title + ' ' + p.text).toLowerCase().includes(q)));
      $('#prCount').textContent = `${items.length}개` + (pr.fav ? ' (즐겨찾기)' : '');
      $('#prGrid').innerHTML = items.map(card).join('') || `<p class="hint">${pr.fav ? '즐겨찾기한 프롬프트가 없습니다. 카드의 별을 눌러 추가하세요.' : '일치하는 프롬프트가 없습니다.'}</p>`;
      bind();
    }
    function bind() {
      C.$$('[data-copy]').forEach(b => b.onclick = () => { const p = all.find(x => x.id === b.dataset.copy); C.copyText(p.text, () => C.toast('복사했어요')); });
      C.$$('[data-copyfill]').forEach(b => b.onclick = () => { const p = all.find(x => x.id === b.dataset.copyfill); C.copyText(composed(p, pr.values[p.id] || {}), () => C.toast('완성본을 복사했어요')); });
      C.$$('[data-fill]').forEach(b => b.onclick = () => { pr.open = pr.open === b.dataset.fill ? null : b.dataset.fill; fill(); });
      C.$$('[data-fav]').forEach(b => b.onclick = () => {
        const on = S.toggleFav(b.dataset.fav);
        if (pr.fav) { fill(); return; }
        b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); b.innerHTML = ic('star', 18, on);
        C.toast(on ? '즐겨찾기에 추가했어요' : '즐겨찾기에서 뺐어요');
      });
      C.$$('[data-tok]').forEach(inp => inp.oninput = () => {
        const card = inp.closest('.pr-card'), id = card.id.slice(3), p = all.find(x => x.id === id);
        (pr.values[id] = pr.values[id] || {})[inp.dataset.tok] = inp.value;
        $('#out-' + id).textContent = composed(p, pr.values[id]);
      });
    }
    $('#prQ').oninput = e => { pr.q = e.target.value; fill(); };
    $('#prFav').onclick = () => { pr.fav = !pr.fav; $('#prFav').classList.toggle('on', pr.fav); $('#prFav').setAttribute('aria-pressed', String(pr.fav)); fill(); };
    C.$$('#prLv .chip-btn').forEach(b => b.onclick = () => { pr.level = b.dataset.lv; C.$$('#prLv .chip-btn').forEach(x => x.classList.toggle('on', x === b)); fill(); });
    fill();
    if (args[0]) { const el = document.getElementById('pc-' + args[0]); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center' }); }
  }

  /* ================= 내 학습 ================= */
  function nextAction(lvId) {
    const C = core(), S = C.S, d = C.levelData(lvId);
    const secs = C.sectionsOf(lvId), unread = secs.find(s => !S.isGuideRead(lvId, s.id));
    if (unread) return { label: `가이드 ${C.secLabel(unread)}`, href: `#/${lvId}/guide/${unread.id}` };
    const lab = C.labsOf(lvId).find(l => !S.isLabDone(lvId, l.id));
    if (lab) return { label: `실습 ${lab.num}. ${lab.title}`, href: `#/${lvId}/labs/${lab.id.split('-')[1]}` };
    const q = S.getQuiz(lvId);
    if (!q) return { label: '확인 퀴즈 풀기', href: `#/${lvId}/quiz` };
    if (S.checkCount(lvId) < d.checklist.items.length) return { label: '체크리스트 완료하기', href: `#/${lvId}/quiz` };
    return null;
  }

  function me() {
    const C = core(), S = C.S, esc = C.esc, bar = C.bar;
    const leaves = C.META.levels.filter(l => !l.hub && C.hasData(l));
    const rows = leaves.map(l => {
      const locked = !C.isUnlocked(l);
      if (locked) return `<tr class="dim"><td>${C.lvBadge(l)} ${esc(C.nameOf(l))}</td><td colspan="5"><span class="pill warn">${ic('lock', 12)} 102 체크리스트 완료 후 열립니다</span></td></tr>`;
      const p = C.parts(l.id), c = p.counts, next = nextAction(l.id), pc = C.pct(l.id);
      const mini = (v, txt) => `<div class="mini">${bar(Math.round(v * 100))}<span class="hint">${txt}</span></div>`;
      return `<tr><td>${C.lvBadge(l)} <a href="#/${l.id}">${esc(C.nameOf(l))}</a><br><span class="hint">전체 ${pc}%</span></td>
        <td>${mini(p.guide, `${c.guide[0]}/${c.guide[1]}`)}</td><td>${mini(p.labs, `${c.labs[0]}/${c.labs[1]}`)}</td>
        <td>${mini(p.quiz, c.quiz ? `${c.quiz.best}/${c.quiz.total}` : '미응시')}</td><td>${mini(p.check, `${c.check[0]}/${c.check[1]}`)}</td>
        <td>${next ? `<a href="${next.href}">${esc(next.label)}</a>` : '<span class="pill ok">완료</span>'}</td></tr>`;
    }).join('');

    const badges = leaves.filter(l => C.isUnlocked(l) && C.pct(l.id) >= 100).map(l => `<span class="pill ok">🏅 ${esc(C.nameOf(l))} 완주</span>`);
    const l103 = C.META.levels.find(l => l.id === '103');
    if (l103 && C.isUnlocked(l103) && C.hasData(C.levelById('102'))) badges.push('<span class="pill ok">103 고급 해금</span>');

    const favs = S.favIds().map(id => (C.V.prompts || []).find(p => p.id === id)).filter(p => p && C.isUnlocked(C.levelById(p.level)));
    C.setView(`<h1 class="page">내 학습</h1>
      <p class="sub">이 브라우저에 저장된 진도입니다.${S.persistent ? '' : ' (저장이 막혀 있어 창을 닫으면 사라집니다)'}</p>
      <div class="card" style="overflow-x:auto"><table class="me-tbl"><thead><tr><th>레벨</th><th>가이드</th><th>실습</th><th>퀴즈</th><th>체크</th><th>다음 할 일</th></tr></thead><tbody>${rows}</tbody></table></div>
      ${badges.length ? `<h2 class="sec">배지</h2><div class="row">${badges.join(' ')}</div>` : ''}
      <h2 class="sec">즐겨찾기 프롬프트 (${favs.length})</h2>
      ${favs.length ? `<div class="chips">${favs.map(p => `<a class="tagl" href="#/prompts/${p.id}">${ic('star', 14, true)} ${esc(p.title)} <span class="hint">${esc(shortLv(p.level))}</span></a>`).join('')}</div>` : '<p class="hint">프롬프트 라이브러리에서 별을 눌러 추가해 보세요.</p>'}
      <h2 class="sec">데이터</h2>
      <div class="row"><button type="button" id="meExport">${ic('download', 14)} 학습 기록 내보내기 (JSON)</button>
        <button type="button" class="danger" id="meReset">진도 초기화</button></div>
      <div id="meConfirm"></div>`, '내 학습');

    C.$('#meExport').onclick = () => {
      try {
        const blob = new Blob([S.exportJson()], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'vibe-library-progress.json';
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 500);
      } catch (e) { C.toast('내보내기를 지원하지 않는 환경이에요.'); }
    };
    C.$('#meReset').onclick = () => {
      C.$('#meConfirm').innerHTML = `<div class="note">모든 진도·퀴즈 점수·체크리스트·즐겨찾기가 지워집니다. 되돌릴 수 없어요. <button type="button" class="danger" id="meYes">예, 초기화</button> <button type="button" id="meNo">취소</button></div>`;
      C.$('#meYes').onclick = () => { S.reset(); C.toast('초기화했어요'); C.route(true); };
      C.$('#meNo').onclick = () => { C.$('#meConfirm').innerHTML = ''; };
    };
  }

  /* ================= 통합 검색 ================= */
  const KIND = { term: '용어', prompt: '프롬프트', guide: '가이드', lab: '체험' };
  const KIND_W = { term: 2, prompt: 1, lab: 1, guide: 0 };

  function search(q) {
    const C = core(), tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.length) return [];
    const vis = new Set(visibleLevels().map(l => l.id));
    const out = [];
    for (const e of C.V.search || []) {
      if (!vis.has(e.lv)) continue;
      const title = e.title.toLowerCase(), text = e.text.toLowerCase();
      let score = KIND_W[e.k] || 0, okAll = true;
      for (const t of tokens) {
        const inT = title.includes(t), inX = text.includes(t);
        if (!inT && !inX) { okAll = false; break; }
        score += inT ? (title === t ? 8 : 5) : 1;
      }
      if (okAll) out.push({ e, score });
    }
    out.sort((a, b) => b.score - a.score);
    return out.slice(0, 40).map(x => x.e);
  }

  let box = null, active = 0, results = [], opener = null;
  function ensureBox() {
    if (box) return box;
    box = document.createElement('div');
    box.className = 'srch'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', '검색');
    box.innerHTML = `<div class="srch-panel"><div class="srch-in">${ic('search', 18)}<input type="text" id="srchQ" placeholder="용어 · 프롬프트 · 가이드 · 실습 검색" autocomplete="off" aria-label="검색어"><kbd>Esc</kbd></div><div id="srchRes" class="srch-res" role="listbox" aria-label="검색 결과"></div></div>`;
    document.body.appendChild(box);
    box.addEventListener('mousedown', e => { if (e.target === box) closeSearch(); });
    const input = box.querySelector('#srchQ');
    input.addEventListener('input', () => { active = 0; render(); });
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(results.length - 1, active + 1); paint(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(0, active - 1); paint(); }
      else if (e.key === 'Enter') { e.preventDefault(); go(results[active]); }
      else if (e.key === 'Tab') { e.preventDefault(); }   // 검색창 안에 포커스를 가둔다 (결과는 방향키로 이동)
    });
    return box;
  }
  function paint() {
    const items = box.querySelectorAll('.srch-item');
    items.forEach((el, i) => { el.classList.toggle('on', i === active); el.setAttribute('aria-selected', String(i === active)); });
    const el = items[active]; if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }
  function render() {
    const C = core(), q = box.querySelector('#srchQ').value.trim();
    results = search(q);
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    const res = box.querySelector('#srchRes');
    if (!q) { res.innerHTML = '<p class="hint" style="padding:14px">검색어를 입력하세요. 예: MCP, 토큰, 견적, 재현성</p>'; return; }
    if (!results.length) { res.innerHTML = '<p class="hint" style="padding:14px">일치하는 항목이 없습니다.</p>'; return; }
    res.innerHTML = results.map((e, i) => {
      const at = Math.max(0, e.text.toLowerCase().indexOf(tokens[0]) - 30);
      const snip = e.text.slice(at, at + 90);
      return `<a class="srch-item ${i === active ? 'on' : ''}" href="${e.href}" data-i="${i}" role="option" aria-selected="${i === active}"><span class="srch-k">${KIND[e.k]}</span><span class="srch-t"><b>${hl(e.title, tokens)}</b><span class="hint">${esc2(shortLv(e.lv))} · ${hl((at > 0 ? '…' : '') + snip, tokens)}</span></span></a>`;
    }).join('');
    res.querySelectorAll('.srch-item').forEach(a => { a.onclick = ev => { ev.preventDefault(); go(results[+a.dataset.i]); }; });
  }
  const esc2 = s => core().esc(s);
  function go(e) { if (!e) return; closeSearch(false); location.hash = e.href; }
  function openSearch() {
    opener = document.activeElement; ensureBox(); box.hidden = false; document.body.classList.add('srch-open');
    const input = box.querySelector('#srchQ'); input.value = ''; active = 0; render(); input.focus();
  }
  function closeSearch(restore) {
    if (!box) return;
    box.hidden = true; document.body.classList.remove('srch-open');
    if (restore !== false && opener && opener.focus && document.contains(opener)) opener.focus();   // 닫으면 원래 있던 곳으로
  }

  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'k') { e.preventDefault(); box && !box.hidden ? closeSearch() : openSearch(); }
    else if (k === 'escape' && box && !box.hidden) closeSearch();
    else if (k === '/' && !/^(input|textarea|select)$/i.test((e.target.tagName || '')) && !(box && !box.hidden)) { e.preventDefault(); openSearch(); }
  });
  const sb = document.getElementById('searchBtn');
  if (sb) { document.getElementById('searchIc').innerHTML = ic('search', 16); sb.onclick = openSearch; }

  window.VCL_TOOLS = { glossary, prompts, me, search, openSearch, closeSearch, nextAction };
})();
