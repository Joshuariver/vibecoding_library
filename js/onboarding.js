// 시작 준비 화면. VCL_CORE는 초기 라우팅 직전까지 참조하지 않는다.
(function () {
  'use strict';
  const core = () => window.VCL_CORE;
    const storageNotice = () => core().S.persistent ? '' : '<p class="note storage-notice" role="status">이 브라우저에서는 기록을 저장할 수 없어 현재 창에서만 유지됩니다. 창을 닫거나 새로고침하면 변경 내용이 사라질 수 있습니다.</p>';

  const installChoices = {};
  let codexAuthChoice = 'chatgpt';
  function codeBlock(command) {
    const esc = core().esc;
    const place = command.context || (command.language === 'text' ? 'Codex 입력창' : command.language === 'markdown' ? 'AGENTS.md 내용' : command.language === 'toml' ? 'config.toml 내용' : '터미널');
    return `<div class="setup-command"><p class="hint setup-command-label"><span class="pill">${esc(place)}</span>${command.label ? ` ${esc(command.label)}` : ''}</p>
      <div class="codebox"><pre tabindex="0" aria-label="${esc(command.label || '복사할 명령·예시')}"><code>${esc(command.code)}</code></pre>
        <button type="button" class="copy" data-copy>복사</button></div></div>`;
  }

  function methodContent(method) {
    const esc = core().esc;
    const steps = method.steps ? `<ol class="setup-steps">${method.steps.map(step => `<li><h4>${esc(step.title)}</h4><p>${esc(step.text)}</p>${step.code ? codeBlock({ label: step.label, language: step.language, code: step.code }) : ''}</li>`).join('')}</ol>` : '';
    return `<p>${esc(method.text)}</p>${method.requires.length ? `<p class="hint">먼저 준비: ${esc(method.requires.join(', '))}</p>` : ''}
      ${method.prerequisiteCode ? codeBlock({ label: '필요 도구 확인', code: method.prerequisiteCode }) : ''}
      ${steps}
      ${!method.steps && method.code ? codeBlock({ label: method.language, code: method.code }) : ''}`;
  }

  function authMethodContent(method) {
    return `<p>${core().esc(method.text)}</p>${method.commands.map(codeBlock).join('')}`;
  }

  function updateContent(method) {
    return `<p class="hint">선택한 설치 방식: ${core().esc(method.label)}</p>${codeBlock({ label: '업데이트', code: method.updateCode })}
      ${codeBlock({ label: '업데이트 후 새 터미널에서 확인', code: 'codex --version' })}`;
  }

  function codexPath() {
    return `<nav class="codex-path" aria-label="Codex 준비 순서"><ol>${[
      ['install', '1. 설치와 버전 확인'], ['auth', '2. 로그인'], ['first-run', '3. 첫 설명 요청']
    ].map(([id, label]) => `<li><a href="#/setup/codex/${id}">${label}</a></li>`).join('')}</ol></nav>
      <p class="hint">아래 세 단계를 마친 뒤 준비 체크 4개를 확인하세요. 상세 사용법 전체를 읽는 것은 완료 조건이 아닙니다.</p>`;
  }

  function sectionContent(section, tool, method) {
    if (tool.id === 'codex' && section.id === 'auth') {
      const current = section.authMethods.find(item => item.id === codexAuthChoice) || section.authMethods[0];
      return `<p>${core().esc(section.text)}</p><label class="codex-auth-label">사용할 인증 방식
        <select data-auth aria-label="Codex 인증 방식">${section.authMethods.map(item => `<option value="${item.id}"${item.id === current.id ? ' selected' : ''}>${core().esc(item.title)}</option>`).join('')}</select></label>
        <div data-auth-content>${authMethodContent(current)}</div><p class="note">${core().esc(section.note)}</p>
        <details class="codex-logout"><summary>로그아웃이 필요할 때</summary>${codeBlock(section.logout)}</details>`;
    }
    if (tool.id === 'codex' && section.id === 'first-run') {
      return `<p>${core().esc(section.text)}</p><ol class="codex-first-steps"><li><h4>프로젝트 폴더에서 시작</h4>${codeBlock(section.commands[0])}
        <details><summary>macOS / Linux에서 시작하기</summary>${codeBlock(section.commands[1])}</details></li>
        <li><h4>Codex 입력창에 첫 설명 요청</h4>${codeBlock(section.commands[2])}</li>
        <li><h4>답변 확인</h4><p>프로젝트의 목적·구조·실행 방법이 실제 파일과 맞는지 확인하세요. 첫 설명 요청은 파일 수정을 요구하지 않습니다. 이후 수정 작업은 변경 내용과 테스트 결과를 검토합니다.</p></li></ol>`;
    }
    if (tool.id === 'codex' && section.id === 'usage') {
      return `<p>${core().esc(section.text)}</p>${section.commandGroups.map(group => `<section class="codex-command-group"><h4>${core().esc(group.title)}</h4>
        <p class="hint">필요한 명령을 하나씩 복사해 ${core().esc(group.context)}에 입력하세요.</p><ul>${group.items.map(item => `<li class="codex-command-item"><p>${core().esc(item.description)}</p>
          <div class="codebox codex-command-row" data-command-context="${core().esc(group.context)}"><pre tabindex="0"><code>${core().esc(item.code)}</code></pre><button type="button" class="copy" data-copy>복사</button></div></li>`).join('')}</ul></section>`).join('')}`;
    }
    const esc = core().esc;
    return `<p>${esc(section.text)}</p>${(section.commands || []).map(codeBlock).join('')}
      ${tool.id === 'codex' && section.id === 'updates' ? `<div data-method-update>${updateContent(method)}</div>` : ''}
      ${section.note ? `<p class="note">${esc(section.note)}</p>` : ''}
      ${section.extensions ? `<ul>${section.extensions.map(item => `<li><a href="https://marketplace.visualstudio.com/items?itemName=${encodeURIComponent(item.id)}" target="_blank" rel="noopener noreferrer">${esc(item.name)}</a>${item.note ? ` — ${esc(item.note)}` : ''}</li>`).join('')}</ul>` : ''}
      ${section.troubleshooting ? `<dl class="setup-help">${section.troubleshooting.map(item => `<div><dt>${esc(item.symptom)}</dt><dd>${esc(item.resolution)}${item.code ? codeBlock(item) : ''}</dd></div>`).join('')}</dl>` : ''}`;
  }

  // 원본 course_guide_sample.html의 STEP 카드와 같은 구성(헤더·본문 블록·완료 체크리스트)으로 그린다.
  function markup(text) {
    const esc = core().esc;
    return esc(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>').replace(/\n/g, '<br>');
  }
  function stepBlock(block) {
    const esc = core().esc;
    switch (block.type) {
      case 'overview': return `<p class="step-overview">${markup(block.text)}</p>`;
      case 'heading': return `<h3 class="step-heading">${markup(block.text)}</h3>`;
      case 'text': return `<p>${markup(block.text)}</p>`;
      case 'callout': return `<div class="callout callout-${esc(block.kind)}"><span aria-hidden="true">${esc(block.icon)}</span><div>${markup(block.text)}</div></div>`;
      case 'code': return codeBlock({ label: block.label, code: block.code, context: '터미널' });
      case 'faq': return `<details class="step-faq"><summary>${markup(block.q)}</summary><div>${markup(block.a)}</div></details>`;
      default: return '';
    }
  }
  function stepCard(tool, state, open) {
    const esc = core().esc;
    return `<article class="card setup-tool setup-step" data-tool="${tool.id}" id="setup-${tool.id}">
      <header class="step-head"><div><span class="pill step-no">${esc(tool.step)}</span> <h2 class="step-title" tabindex="-1">${esc(tool.stepTitle)}</h2></div>
        <span class="setup-tool-meta"><span class="hint">${esc(tool.timeTag)}</span><span class="pill" data-requirement></span><span class="hint" data-tool-count></span></span></header>
      <div class="setup-tool-body prose" id="setup-${tool.id}-install">${tool.blocks.map(stepBlock).join('')}
        <fieldset class="setup-checks" id="setup-${tool.id}-checks"><legend>${esc(tool.checklistTitle)}</legend>
          ${tool.checks.map(check => `<label class="check"><input type="checkbox" data-check="${check.id}"${state.checks[check.id] === true ? ' checked' : ''}><span>${markup(check.label)}</span></label>`).join('')}</fieldset>
      </div></article>`;
  }

  function toolCard(tool, state, open) {
    if (tool.blocks) return stepCard(tool, state, open);
    const C = core(), esc = C.esc;
    const method = tool.installMethods.find(item => item.id === installChoices[tool.id]) || tool.installMethods[0];
    installChoices[tool.id] = method.id;
    return `<details class="card setup-tool" data-tool="${tool.id}" id="setup-${tool.id}"${open ? ' open' : ''}>
      <summary><span class="setup-tool-name">${esc(tool.title)}</span><span class="setup-tool-meta"><span class="pill" data-requirement></span><span class="hint" data-tool-count></span></span></summary>
      <div class="setup-tool-body prose"><p>${esc(tool.reason)}</p>${tool.policyNotice ? `<p class="hint">${esc(tool.policyNotice)}</p>` : ''}
        ${tool.id === 'codex' ? codexPath() : ''}<section id="setup-${tool.id}-install"><h3>설치 방법</h3><label class="setup-method-label">한 가지 설치 방식을 선택하세요
          <select data-method="${tool.id}" aria-label="${esc(tool.title)} 설치 방식">${tool.installMethods.map(item => `<option value="${item.id}"${item.id === method.id ? ' selected' : ''}>${esc(item.label)}</option>`).join('')}</select></label>
          <div data-method-content="${tool.id}">${methodContent(method)}</div></section>
        ${tool.sections.map(section => `<details class="setup-section" id="setup-${tool.id}-${section.id}"${['verify', 'auth', 'first-run'].includes(section.id) ? ' open' : ''}>
          <summary>${esc(section.title)}</summary><div>${sectionContent(section, tool, method)}</div></details>`).join('')}
        <fieldset class="setup-checks" id="setup-${tool.id}-checks"><legend>내가 확인한 준비 상태</legend>
          ${tool.checks.map(check => `<label class="check"><input type="checkbox" data-check="${check.id}"${state.checks[check.id] === true ? ' checked' : ''}><span>${esc(check.label)}</span></label>`).join('')}</fieldset>
        <footer class="hint setup-sources">출처: ${esc(tool.sourcePath)}${tool.originalReviewedAt ? ` · 원본 확인일 ${esc(tool.originalReviewedAt)}` : ''} · 앱 검토일 ${esc(C.V.setup.reviewedAt)}</footer>
      </div></details>`;
  }

  function setupView(args) {
    const C = core(), data = C.V.setup, esc = C.esc;
    // 예전 주소(#/setup/sales/..., #/setup/dev/..., #/setup/choose/...)도 같은 화면으로 연결한다.
    if (['sales', 'dev', 'choose'].includes(args[0])) args = args.slice(1);
    const tool = data.tools.find(item => item.id === args[0]);
    const validSection = tool && args[1] && (['install', 'checks'].includes(args[1]) || tool.sections.some(item => item.id === args[1]));
    const invalid = args.length > 2 || (args[0] && !tool) || (args[1] && !validSection);
    const state = C.S.getSetup();
    C.setView(`<section class="onboarding setup-page"><p class="crumb"><a href="#/">홈</a> › 시작 준비</p>
      <h1 class="page">시작 준비</h1><p class="sub">도구를 설치하고 확인한 항목을 체크하세요.</p>
      <div id="setupStorage">${storageNotice()}</div>${invalid ? '<p class="note setup-route-note">요청한 세부 안내를 찾지 못했습니다. 아래 도구 안내를 확인해 주세요.</p>' : ''}
      <section class="card setup-overview" aria-labelledby="setup-choice-title"><h2 id="setup-choice-title">실습에 사용할 AI 도구</h2>
        <p class="hint">조직에서 허용한 도구를 하나 또는 둘 다 선택하세요. 선택한 도구만 필수 준비율에 포함됩니다.</p>
        <fieldset class="setup-ai-options"><legend class="hint">AI 도구 선택</legend>${data.tools.filter(item => data.aiToolIds.includes(item.id)).map(item => `<label class="setup-ai-option"><input type="checkbox" data-ai="${item.id}"${state.aiTools.includes(item.id) ? ' checked' : ''}><span>${esc(item.title)}</span></label>`).join('')}</fieldset>
        <label class="setup-deploy"><input type="checkbox" id="setupDeploy"${state.deployPlanned ? ' checked' : ''}><span>만든 앱을 배포할 예정입니다</span></label>
        <p class="hint" id="setupGitNote"></p><div id="setupProgress" aria-live="polite" aria-atomic="true"></div></section>
      <p class="hint setup-explainer">설치 여부는 직접 확인합니다. 이 앱이 설치·로그인을 대신 실행하지 않습니다. 준비가 덜 끝났어도 학습을 시작할 수 있습니다.</p>
      <nav class="setup-jumps" aria-label="도구 바로가기">${data.tools.map(item => `<a href="#/setup/${item.id}">${esc(item.title)}</a>`).join('')}</nav>
      <div class="setup-tools">${data.tools.map((item, index) => toolCard(item, state, tool ? item.id === tool.id : index === 0)).join('')}</div>
      <p class="hint setup-record-note">체크는 선택을 바꿔도 유지됩니다. 다른 도메인·포트 또는 file://에서 사용한 기록은 자동으로 가져올 수 없으므로 이 앱에서 다시 확인해 주세요.</p>
      <div class="row course-actions"><a class="primary" href="#/101/guide">101 입문 시작하기</a></div></section>`, '시작 준비');
    const root = C.$('.setup-page');
    function refresh() {
      const current = C.S.getSetup(), progress = data.progress(current);
      C.$('#setupStorage').innerHTML = storageNotice();
      C.$('#setupGitNote').textContent = current.deployPlanned ? '배포 예정이므로 Git도 필수 준비에 포함합니다.' : '배포 예정이 없으면 Git은 선택입니다. 만든 앱을 배포할 예정이면 위 항목을 체크하세요.';
      C.$('#setupProgress').innerHTML = progress.percent === null ? '<p class="setup-progress-empty">AI 도구를 선택하면 시작 준비 완료율을 확인할 수 있습니다.</p>' : `<div class="row setup-progress-heading"><strong>시작 준비 완료율 ${progress.percent}%</strong><span class="hint">완료 ${progress.done} / 필수 ${progress.total}</span></div>${C.bar(progress.percent, '시작 준비 완료율')}<p class="hint">설치 준비율은 학습 진도와 별도로 계산합니다.</p>`;
      C.$$('[data-tool]', root).forEach(card => {
        const item = data.tools.find(candidate => candidate.id === card.dataset.tool);
        const required = item.checks.some(check => progress.requiredIds.includes(check.id));
        const badge = C.$('[data-requirement]', card);
        badge.textContent = required ? '필수' : data.aiToolIds.includes(item.id) ? '선택 안 함' : '선택';
        badge.className = required ? 'pill' : 'pill setup-optional';
        const done = item.checks.filter(check => current.checks[check.id] === true).length;
        C.$('[data-tool-count]', card).textContent = `완료 ${done}/${item.checks.length}`;
      });
    }
    root.addEventListener('change', event => {
      const input = event.target;
      if (input.matches('[data-ai]')) C.S.setSetupAiTools(C.$$('[data-ai]:checked', root).map(item => item.dataset.ai));
      else if (input.id === 'setupDeploy') C.S.setSetupDeployPlanned(input.checked);
      else if (input.matches('[data-check]')) C.S.setSetupCheck(input.dataset.check, input.checked);
      else if (input.matches('[data-method]')) {
        const selectedTool = data.tools.find(item => item.id === input.dataset.method);
        const method = selectedTool.installMethods.find(item => item.id === input.value);
        installChoices[selectedTool.id] = method.id;
        C.$(`[data-method-content="${selectedTool.id}"]`, root).innerHTML = methodContent(method);
        if (selectedTool.id === 'codex') C.$('[data-method-update]', root).innerHTML = updateContent(method);
        return;
      } else if (input.matches('[data-auth]')) {
        const section = data.tools.find(item => item.id === 'codex').sections.find(item => item.id === 'auth');
        const method = section.authMethods.find(item => item.id === input.value);
        codexAuthChoice = method.id;
        C.$('[data-auth-content]', root).innerHTML = authMethodContent(method);
        return;
      } else return;
      refresh();
    });
    root.addEventListener('click', event => {
      const button = event.target.closest('[data-copy]');
      if (!button) return;
      const text = button.closest('.codebox').querySelector('pre').textContent;
      C.copyText(text, () => { button.textContent = '복사됨'; setTimeout(() => { button.textContent = '복사'; }, 1400); });
    });
    refresh();
    if (tool) {
      const target = C.$(`#setup-${tool.id}${validSection ? '-' + args[1] : ''}`, root);
      if (target.tagName === 'DETAILS') target.open = true;
      const heading = target.querySelector('summary,.step-title,h3,legend') || target;
      if (heading.tagName !== 'SUMMARY') heading.tabIndex = -1;
      return heading;
    }
  }

  function setupHref(toolId, sectionId) {
    const tail = [toolId, sectionId].filter(Boolean).map(encodeURIComponent).join('/');
    return tail ? `#/setup/${tail}` : '#/setup';
  }

  function preparationStatus() {
    const C = core(), state = C.S.getSetup(), progress = C.V.setup.progress(state);
    const label = progress.percent === null ? '사용할 AI 도구를 선택하세요.' : `완료 ${progress.done} / 필수 ${progress.total}`;
    return { state, progress, label, href: setupHref() };
  }

  window.VCL_ONBOARDING = { setup: setupView, setupHref, preparationStatus };
})();


