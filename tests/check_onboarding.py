"""Standalone browser check: python -B tests/check_onboarding.py.
Uses the developer's existing Playwright and Chrome; no app runtime dependency.
"""
import os
import re
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import time
from urllib.request import urlopen

from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / 'docs' / 'qa'
checks = []


def passed(label):
    checks.append(label)
    print('PASS ' + label, flush=True)


def navigate(page, route):
    page.evaluate('(route) => { location.hash = route; }', route)
    expect(page).to_have_url(re.compile(re.escape(route) + '$'))


def no_overflow(page):
    sizes = page.evaluate("""() => ({width:innerWidth,scroll:document.documentElement.scrollWidth,hash:location.hash,
        overflow:[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1 && getComputedStyle(el).position!=='fixed').map(el=>({tag:el.tagName,cls:el.className,width:el.getBoundingClientRect().width,right:el.getBoundingClientRect().right})).slice(0,12)})""")
    assert sizes['scroll'] <= sizes['width'] + 1, sizes


def exercise_setup(page, prefix, original):
    def totals(done, total):
        expect(page.locator('#setupProgress')).to_contain_text(f'완료 {done} / 필수 {total}')
    expect(page.locator('#setupProgress')).to_contain_text('AI 도구를 선택하면')
    assert page.locator('#setupProgress [role="progressbar"]').count() == 0
    page.locator('[data-ai="codex"]').check()
    totals(0, 10)
    assert page.evaluate('document.activeElement.dataset.ai') == 'codex'
    for tool in ['vscode', 'antigravity', 'codex', 'python', 'git']:
        card = page.locator(f'.setup-tool[data-tool="{tool}"]')
        if not card.evaluate('(el) => el.open'):
            card.locator(':scope > summary').click()
        for check in card.locator('[data-check]').all():
            check.check()
            assert check.evaluate('(el) => el === document.activeElement')
        assert card.evaluate('(el) => el.open')
    totals(10, 10)
    assert page.evaluate('Object.keys(Store.getSetup().checks).length') == 16
    passed((prefix or '/') + ': 16 manual checks, unselected tools readable, input focus/open cards preserved')

    choices = [([], 6, 9), (['antigravity'], 9, 12), (['codex'], 10, 13), (['antigravity', 'codex'], 13, 16)]
    navigate(page, '#/setup')
    for deploy in [False, True]:
        page.locator('#setupDeploy').set_checked(deploy)
        for selected, base_count, git_count in choices:
            for tool in ['antigravity', 'codex']:
                page.locator(f'[data-ai="{tool}"]').set_checked(tool in selected)
            expected = git_count if deploy else base_count
            if selected:
                totals(expected, expected)
                expect(page.locator('#setupProgress [role="progressbar"]')).to_have_attribute('aria-valuenow', '100')
            else:
                expect(page.locator('#setupProgress')).to_contain_text('AI 도구를 선택하면')
            assert page.evaluate('Object.values(Store.getSetup().checks).filter(Boolean).length') == 16
    page.locator('[data-ai="antigravity"]').uncheck()
    totals(13, 13)
    page.reload(wait_until='networkidle')
    totals(13, 13)
    assert page.locator('[data-ai="codex"]').is_checked()
    assert page.locator('#setupDeploy').is_checked()
    passed((prefix or '/') + ': all 16 deployment/AI combinations and reload persistence')

    navigate(page, '#/setup/codex/auth')
    expect(page.locator('#setup-codex')).to_have_attribute('open', '')
    expect(page.locator('#setup-codex-auth')).to_have_attribute('open', '')
    assert page.evaluate('document.activeElement.parentElement.id') == 'setup-codex-auth'
    page.wait_for_function("""() => { const y=document.activeElement.getBoundingClientRect().top;return y>=54 && y<innerHeight; }""")
    page.locator('[data-check="codex.auth"]').uncheck()
    totals(12, 13)
    raw = page.evaluate("localStorage.getItem('vcl:v1')")
    page.evaluate("() => { window.__originalSetItem=Storage.prototype.setItem; Storage.prototype.setItem=function(){throw new Error('blocked');}; }")
    page.locator('[data-check="codex.auth"]').check()
    totals(13, 13)
    expect(page.locator('.storage-notice')).to_contain_text('저장할 수 없어')
    assert page.evaluate("localStorage.getItem('vcl:v1')") == raw
    page.evaluate('() => { Storage.prototype.setItem=window.__originalSetItem; }')
    page.locator('[data-check="codex.auth"]').uncheck()
    page.locator('[data-check="codex.auth"]').check()
    assert page.locator('.storage-notice').count() == 0
    totals(13, 13)
    method = page.locator('[data-method="codex"]')
    method.select_option('npm')
    expect(page.locator('[data-method-content="codex"]')).to_contain_text('Node.js')
    method.select_option('windows-script')
    assert 'Node.js' not in page.locator('[data-method-content="codex"]').inner_text()
    passed((prefix or '/') + ': partial progress, section focus, write blocking/recovery and one install method at a time')

    navigate(page, '#/setup/dev/git')
    expect(page.locator('#setup-git')).to_have_attribute('open', '')
    assert page.evaluate('document.activeElement.parentElement.id') == 'setup-git'
    page.evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copied=text;}}})")
    page.locator('#setup-git-verify [data-copy]').click()
    expect(page.locator('#setup-git-verify [data-copy]')).to_have_text('복사됨')
    assert page.evaluate('window.__copied') == 'git --version'
    navigate(page, '#/setup/dev/git/verify')
    page.evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied')}}});document.execCommand=()=>false")
    page.locator('#setup-git-verify [data-copy]').click()
    expect(page.locator('.toast')).to_contain_text('복사하지 못했어요')
    expect(page.locator('#setup-git-verify pre')).to_have_text('git --version')
    for route in ['#/setup/dev/missing', '#/setup/dev/git/missing']:
        navigate(page, route)
        expect(page.locator('.setup-route-note')).to_contain_text('세부 안내를 찾지 못했습니다')
    navigate(page, '#/setup/dev/codex/usage')
    expect(page.locator('#setup-codex-usage')).to_have_attribute('open', '')
    for theme in ['light', 'dark']:
        for width, height in [(1440, 1000), (390, 844)]:
            page.set_viewport_size({'width': width, 'height': height})
            if page.evaluate('document.documentElement.dataset.theme') != theme:
                page.locator('#themeBtn').click()
            no_overflow(page)
    navigate(page, '#/setup')
    page.set_viewport_size({'width': 1440, 'height': 1000})
    if page.evaluate('document.documentElement.dataset.theme') != 'light':
        page.locator('#themeBtn').click()
    expect(page.locator('.toast')).not_to_be_visible(timeout=5000)
    if not prefix:
        page.screenshot(path=str(ARTIFACTS / 'stage-7-setup-1440-light.png'), full_page=True, animations='disabled')
    page.set_viewport_size({'width': 390, 'height': 844})
    page.locator('#themeBtn').click()
    no_overflow(page)
    if not prefix:
        page.screenshot(path=str(ARTIFACTS / 'stage-7-setup-390-dark.png'), full_page=True, animations='disabled')
    current = page.evaluate("""() => {const s=JSON.parse(localStorage.getItem('vcl:v1'));return {progress:s.progress,last:s.last,favs:s.favs};}""")
    assert current == original
    passed((prefix or '/') + ': deep links, copy success/failure, invalid paths, responsive themes and learning isolation')


def exercise_codex(page, prefix, original):
    navigate(page, '#/setup/dev/codex')
    expect(page.locator('#setup-codex')).to_have_attribute('open', '')
    assert page.locator('.codex-path a').count() == 3
    assert page.locator('#setup-codex-usage').get_attribute('open') is None
    before = page.evaluate('Store.getSetup().checks')
    page.evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copied=text;}}})")
    page.locator('.codex-path a[href$="/auth"]').click()
    expect(page.locator('#setup-codex-auth')).to_have_attribute('open', '')
    for auth, fragment, count in [('chatgpt', '워크스페이스', 2), ('device', 'beta', 2), ('api', 'ChatGPT 구독과 별도', 3)]:
        page.locator('[data-auth]').select_option(auth)
        expect(page.locator('[data-auth-content]')).to_contain_text(fragment)
        assert page.locator('[data-auth-content] pre').count() == count
    assert page.locator('#setup-codex input:not([type="checkbox"])').count() == 0
    page.locator('[data-auth-content] [data-copy]').first.click()
    expect(page.locator('[data-auth-content] [data-copy]').first).to_have_text('복사됨')
    assert page.evaluate('window.__copied') == '$env:OPENAI_API_KEY | codex login --with-api-key'
    assert page.locator('.codex-logout').get_attribute('open') is None
    page.locator('.codex-path a[href$="/first-run"]').click()
    expect(page.locator('#setup-codex-first-run')).to_have_attribute('open', '')
    assert page.locator('.codex-first-steps > li').count() == 3
    expect(page.locator('.codex-first-steps .setup-command-label').first).to_contain_text('터미널')
    expect(page.locator('.codex-first-steps .setup-command-label').last).to_contain_text('Codex 입력창')
    assert page.locator('.codex-first-steps details').get_attribute('open') is None
    assert page.evaluate('Store.getSetup().checks') == before
    passed((prefix or '/') + ': Codex three-step entry, three auth choices, copy-only API example, guided first run')

    navigate(page, '#/setup/dev/codex/usage')
    rows = page.locator('.codex-command-row')
    assert rows.count() == 12
    assert page.locator('[data-command-context="터미널"]').count() == 6
    assert page.locator('[data-command-context="Codex 입력창"]').count() == 6
    for row in rows.all():
        code = row.locator('pre').inner_text()
        assert '\n' not in code
        row.locator('[data-copy]').click()
        page.wait_for_function('(code) => window.__copied === code', arg=code)
    navigate(page, '#/setup/dev/codex/updates')
    methods = page.evaluate("VCL.setup.tools.find(t=>t.id==='codex').installMethods")
    for method in methods:
        page.locator('[data-method="codex"]').select_option(method['id'])
        expect(page.locator('[data-method-update] pre').first).to_have_text(method['updateCode'])
        expect(page.locator('[data-method-update] pre').last).to_have_text('codex --version')
        assert ('Node.js' in page.locator('[data-method-content="codex"]').inner_text()) == (method['id'] == 'npm')
    assert page.evaluate('Store.getSetup().checks') == before
    passed((prefix or '/') + ': 12 individual commands with context labels, four matching installer/update pairs')

    for section in ['install', 'verify', 'auth', 'first-run', 'usage', 'review', 'permissions', 'agents', 'config', 'automation', 'updates', 'troubleshooting', 'checks']:
        navigate(page, f'#/setup/codex/{section}')
        target = page.locator('#setup-codex-' + section)
        expect(target).to_be_visible()
        if target.evaluate('(el) => el.tagName') == 'DETAILS':
            expect(target).to_have_attribute('open', '')
    for legacy in ['#/setup/codex/auth', '#/setup/dev/codex/auth', '#/setup/choose/codex/auth']:
        navigate(page, legacy)
        expect(page.locator('#setup-codex-auth')).to_be_visible()
    navigate(page, '#/setup/codex/permissions')
    assert page.locator('#setup-codex-permissions pre').count() == 2
    navigate(page, '#/setup/codex/automation')
    assert page.locator('#setup-codex-automation pre').count() == 4
    expect(page.locator('#setup-codex-automation')).to_contain_text('JSONL')
    expect(page.locator('#setup-codex-automation')).to_contain_text('--full-auto는 현재 지원하지 않습니다')
    navigate(page, '#/setup/codex/troubleshooting')
    assert page.locator('#setup-codex-troubleshooting dt').count() == 8
    expect(page.locator('#setup-codex .setup-sources')).to_contain_text('원본 확인일 2026-10-30')
    expect(page.locator('#setup-codex .setup-sources')).to_contain_text('앱 검토일 2026-10-30')
    navigate(page, '#/setup/codex')
    page.locator('[data-method="codex"]').select_option('windows-script')
    page.locator('[data-auth]').select_option('chatgpt')
    expect(page.locator('.toast')).not_to_be_visible(timeout=5000)
    for theme, width, height in [('light', 1440, 1000), ('dark', 390, 844)]:
        page.set_viewport_size({'width': width, 'height': height})
        if page.evaluate('document.documentElement.dataset.theme') != theme:
            page.locator('#themeBtn').click()
        no_overflow(page)
        if not prefix:
            page.evaluate("window.scrollTo({top:0,behavior:'instant'})")
            page.screenshot(path=str(ARTIFACTS / f'stage-8-codex-{width}-{theme}.png'), full_page=True, animations='disabled')
    current = page.evaluate("""() => {const s=JSON.parse(localStorage.getItem('vcl:v1'));return {progress:s.progress,last:s.last,favs:s.favs};}""")
    assert current == original
    assert page.evaluate('Store.getSetup().checks') == before
    passed((prefix or '/') + ': all Codex sections sources, responsive themes and unchanged checks/learning')


def exercise_connections(browser, base, prefix):
    with browser.new_context(viewport={'width': 1440, 'height': 1000}, locale='ko-KR') as context:
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda err: errors.append(str(err)))
        page.goto(base + '#/', wait_until='networkidle')
        assert page.locator('.home-start-card').count() == 2
        assert page.locator('.lv-card').count() == 3
        expect(page.locator('.home-start-card').last).to_contain_text('AI 도구를 선택')
        assert page.evaluate('Store.getLast()') is None
        navigate(page, '#/me')
        expect(page.locator('.me-setup')).to_contain_text('AI 도구를 선택')
        assert page.locator('.prep-table tbody tr').count() == 5
        page.locator('.prep-table a', has_text='Codex CLI').click()
        expect(page.locator('#setup-codex')).to_have_attribute('open', '')
        navigate(page, '#/')
        page.keyboard.press('Control+k')
        page.locator('#srchQ').fill('Codex device-auth')
        entry = page.locator('#srchRes a[href="#/setup/codex/auth"]')
        expect(entry.locator('.srch-k')).to_have_text('시작 준비')
        entry.click()
        expect(page.locator('#setup-codex-auth')).to_have_attribute('open', '')
        assert page.evaluate('Store.getLast()') is None
        page.locator('#setup-codex-auth > summary').click()
        page.keyboard.press('Control+k')
        page.locator('#srchQ').fill('Codex device-auth')
        page.keyboard.press('Enter')
        expect(page.locator('#setup-codex-auth')).to_have_attribute('open', '')
        assert page.evaluate('document.activeElement.parentElement.id') == 'setup-codex-auth'
        assert not page.locator('.srch').is_visible()
        passed((prefix or '/') + ': home/learning entry, search destination, same-route search focus')

        page.keyboard.press('Control+k')
        page.locator('#srchQ').fill('해외영업 Vibe Coding')
        assert page.locator('#srchRes a[href^="#/courses"]').count() == 0
        page.keyboard.press('Escape')
        page.evaluate("""() => {Store.setLast('#/101/guide/s4');Store.markGuide('101','s4');Store.setCheck('201',0,true);}""")
        navigate(page, '#/')
        expect(page.locator('.hero a.primary')).to_have_attribute('href', '#/101/guide/s4')
        before = page.evaluate("""() => {const s=JSON.parse(localStorage.getItem('vcl:v1'));return {progress:s.progress,last:s.last,favs:s.favs};}""")
        overall = page.locator('#overall').inner_text()
        navigate(page, '#/setup')
        page.locator('[data-ai="codex"]').check()
        page.locator('[data-check="vscode.path"]').check()
        page.evaluate("""() => {for(const id of ['vscode.version','vscode.extensions','codex.installed','codex.version','codex.auth','python.path'])Store.setSetupCheck(id,true);}""")
        navigate(page, '#/')
        expect(page.locator('.home-start-card').last).to_contain_text('완료 7 / 필수 10')
        expect(page.locator('.home-start-card [role="progressbar"]')).to_have_attribute('aria-valuenow', '70')
        expect(page.locator('.hero a.primary')).to_have_attribute('href', '#/101/guide/s4')
        navigate(page, '#/me')
        expect(page.locator('.me-setup [role="progressbar"]')).to_have_attribute('aria-valuenow', '70')
        expect(page.locator('.me-setup')).to_contain_text('완료 7 / 필수 10')
        expect(page.locator('.prep-table tr', has_text='Antigravity CLI')).to_contain_text('선택 안 함')
        expect(page.locator('.prep-table tr', has_text='Git')).to_contain_text('선택')
        page.locator('.prep-table a', has_text='Git').click()
        expect(page.locator('#setup-git')).to_be_visible()
        expect(page).to_have_url(re.compile(r'#/setup/git$'))
        page.locator('#setupDeploy').check()
        navigate(page, '#/me')
        expect(page.locator('.prep-table tr', has_text='Git')).to_contain_text('필수')
        expect(page.locator('.me-setup [role="progressbar"]')).to_have_attribute('aria-valuenow', '54')
        current = page.evaluate("""() => {const s=JSON.parse(localStorage.getItem('vcl:v1'));return {progress:s.progress,last:s.last,favs:s.favs};}""")
        assert current == before
        assert page.locator('#overall').inner_text() == overall
        passed((prefix or '/') + ': home and learning share 7/10, Git condition updates to 7/13, prior learning unchanged')

        for query, target in [('Codex device-auth', '#/setup/dev/codex/auth'), ('brew upgrade', '#/setup/dev/codex/updates'), ('Antigravity', '#/setup/dev/antigravity')]:
            page.keyboard.press('Control+k')
            page.locator('#srchQ').fill(query)
            expected = page.locator(f'#srchRes a[href="{target}"]')
            expect(expected).to_be_visible()
            expected.click()
            expect(page).to_have_url(re.compile(re.escape(target) + '$'))
        assert page.evaluate("VCL_TOOLS.search('Codex JSONL').some(e=>e.toolId==='codex'&&e.sectionId==='automation')")
        assert page.evaluate("VCL_TOOLS.search(VCL.search.find(e=>e.lv==='301'&&e.k==='guide').title).every(e=>e.lv!=='301')")
        page.keyboard.press('Control+k')
        page.locator('#srchQ').fill('토큰')
        expect(page.locator('#srchRes .srch-k').first).to_have_text('용어')
        page.keyboard.press('Escape')
        passed((prefix or '/') + ': auth/update/Antigravity results, original glossary and advanced lock filter')

        for theme, width, height in [('light', 1440, 1000), ('dark', 390, 844)]:
            page.set_viewport_size({'width': width, 'height': height})
            if page.evaluate('document.documentElement.dataset.theme') != theme:
                page.locator('#themeBtn').click()
            for route, name in [('#/', 'home'), ('#/me', 'learning')]:
                navigate(page, route)
                expect(page.locator('.home-start' if name == 'home' else '.me-setup')).to_be_visible()
                no_overflow(page)
                if not prefix:
                    page.evaluate("window.scrollTo({top:0,behavior:'instant'})")
                    page.screenshot(path=str(ARTIFACTS / f'stage-9-{name}-{width}-{theme}.png'), full_page=True, animations='disabled')
        page.reload(wait_until='networkidle')
        expect(page.locator('.me-setup')).to_contain_text('완료 7 / 필수 13')
        assert not errors, errors
        passed((prefix or '/') + ': home/learning desktop-mobile themes, reload and no browser errors')


def exercise(browser, prefix):
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
    env = {**os.environ, 'PORT': str(port), 'APP_ROOT_PATH': prefix, 'PYTHONDONTWRITEBYTECODE': '1'}
    with tempfile.TemporaryFile() as logs:
        child = subprocess.Popen(
            [sys.executable, '-B', str(ROOT / 'main.py')],
            cwd='C:\\' if os.name == 'nt' else str(ROOT), env=env,
            stdout=logs, stderr=logs,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0,
        )
        context = None
        try:
            for _ in range(100):
                if child.poll() is not None:
                    logs.seek(0)
                    raise RuntimeError(logs.read().decode('utf8', errors='replace'))
                try:
                    with urlopen(f'http://127.0.0.1:{port}/healthz', timeout=1) as response:
                        if response.status == 200:
                            break
                except OSError:
                    time.sleep(.1)
            else:
                raise RuntimeError('App server did not start')
            base = f'http://127.0.0.1:{port}{prefix}/'
            context = browser.new_context(viewport={'width': 1440, 'height': 1000}, locale='ko-KR')
            page = context.new_page()
            errors, failures = [], []
            page.on('pageerror', lambda err: errors.append(str(err)))
            page.on('requestfailed', lambda req: failures.append(req.url))
            page.on('response', lambda res: failures.append(f'{res.status} {res.url}') if res.status >= 400 else None)
            page.goto(base + '#/setup', wait_until='networkidle')
            expect(page.locator('h1.page')).to_have_text('시작 준비')
            assert page.locator('.course-choice').count() == 0 and page.locator('.setup-step').count() == 4
            assert page.evaluate('Store.getLast()') is None
            page.evaluate("""() => {
                Store.markGuide('101', 's4'); Store.setCheck('201', 0, true);
                Store.toggleFav('101-p4-1'); Store.setLast('#/101/guide/s4');
            }""")
            original = page.evaluate("""() => { const s=JSON.parse(localStorage.getItem('vcl:v1')); return {progress:s.progress,last:s.last,favs:s.favs}; }""")
            passed((prefix or '/') + ': no course split, selection persistence')

            # 교육 안내 메뉴는 제거되었다: 사이드바에 없고 예전 경로는 홈으로 이동한다.
            assert page.locator('#side a[href="#/courses"]').count() == 0
            navigate(page, '#/courses')
            assert page.evaluate('location.hash') in ('#/', '')
            navigate(page, '#/setup')
            for bad_route in ['#/setup/unknown', '#/setup/codex/unknown']:
                navigate(page, bad_route)
                expect(page.locator('.note')).to_contain_text('찾지 못했습니다')
                assert page.locator('.course-choice').count() == 2
            current = page.evaluate("""() => { const s=JSON.parse(localStorage.getItem('vcl:v1')); return {progress:s.progress,last:s.last,favs:s.favs}; }""")
            assert current == original
            passed((prefix or '/') + ': removed courses route, invalid routes, learning records preserved')

            navigate(page, '#/setup')
            expect(page.locator('h1.page')).to_have_text('시작 준비')
            assert page.locator('.setup-tool').count() == 5
            assert page.evaluate('Store.getLast()') == original['last']
            exercise_setup(page, prefix, original)
            exercise_codex(page, prefix, original)
            navigate(page, '#/301')
            expect(page.locator('#view')).to_contain_text('잠김')
            navigate(page, '#/setup')
            expect(page.locator('h1.page')).to_have_text('시작 준비')
            assert page.locator('#tabbar a').count() == 5
            page.locator('#menuBtn').click()
            page.locator('#side a[href="#/setup"]').click()
            expect(page.locator('h1.page')).to_have_text('시작 준비')
            assert page.locator('#menuBtn').get_attribute('aria-expanded') == 'false'
            page.locator('a[href="#/101/guide"]').click()
            expect(page.locator('h1.page')).to_contain_text('101')
            passed((prefix or '/') + ': preparation entry, 301 gate, mobile drawer and 101 start')
            with browser.new_context(viewport={'width': 390, 'height': 844}) as temporary:
                temporary.add_init_script("Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });")
                blocked_page = temporary.new_page()
                blocked_page.on('pageerror', lambda err: errors.append(str(err)))
                blocked_page.goto(base + '#/setup', wait_until='networkidle')
                expect(blocked_page.locator('h1.page')).to_have_text('시작 준비')
                expect(blocked_page.locator('.storage-notice')).to_contain_text('저장할 수 없어')
                no_overflow(blocked_page)
            passed((prefix or '/') + ': unavailable storage and visible notice')
            exercise_connections(browser, base, prefix)
            assert not errors, errors
            assert not failures, failures
            passed((prefix or '/') + ': no browser errors or failed assets')
        finally:
            if context:
                context.close()
            child.terminate()
            try:
                child.wait(timeout=10)
            except subprocess.TimeoutExpired:
                child.kill()
                child.wait(timeout=5)


if __name__ == '__main__':
    with sync_playwright() as p:
        executable = os.environ.get('CHROME_PATH', r'C:\Program Files\Google\Chrome\Application\chrome.exe')
        browser = p.chromium.launch(executable_path=executable, headless=True)
        try:
            exercise(browser, '')
            exercise(browser, '/project/academy/test-user/proxy/8000')
        finally:
            browser.close()
    print(f'All {len(checks)} browser check groups passed', flush=True)









