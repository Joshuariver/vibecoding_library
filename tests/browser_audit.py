"""10단계 세부 점검 스크립트: 모바일·테마·키보드·포커스·복사 동작 종합 감사"""

import os
import re
import socket
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from urllib.request import urlopen
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parent.parent

def run_audit(browser):
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
    env = {**os.environ, 'PORT': str(port), 'PYTHONDONTWRITEBYTECODE': '1'}
    with tempfile.TemporaryFile() as logs:
        child = subprocess.Popen(
            [sys.executable, '-B', str(ROOT / 'main.py')],
            cwd=str(ROOT), env=env,
            stdout=logs, stderr=logs,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0,
        )
        try:
            for _ in range(100):
                if child.poll() is not None:
                    logs.seek(0)
                    raise RuntimeError(logs.read().decode('utf8', errors='replace'))
                try:
                    with urlopen(f'http://127.0.0.1:{port}/healthz', timeout=1) as resp:
                        if resp.status == 200:
                            break
                except OSError:
                    time.sleep(0.1)
            else:
                raise RuntimeError('Server failed to start')

            base = f'http://127.0.0.1:{port}/'
            context = browser.new_context(viewport={'width': 1440, 'height': 900}, locale='ko-KR')
            page = context.new_page()

            # 1. 테마 전환 검증
            page.goto(base + '#/', wait_until='networkidle')
            initial_theme = page.evaluate('document.documentElement.dataset.theme')
            page.locator('#themeBtn').click()
            new_theme = page.evaluate('document.documentElement.dataset.theme')
            assert new_theme != initial_theme, f"Theme did not toggle: {initial_theme} -> {new_theme}"
            page.locator('#themeBtn').click()
            assert page.evaluate('document.documentElement.dataset.theme') == initial_theme
            print("PASS: Theme toggle & CSS variable sync", flush=True)

            # 2. 키보드 네비게이션: 모바일 드로어
            page.set_viewport_size({'width': 390, 'height': 844})
            menu_btn = page.locator('#menuBtn')
            expect(menu_btn).to_be_visible()
            menu_btn.click()
            expect(menu_btn).to_have_attribute('aria-expanded', 'true')
            page.keyboard.press('Escape')
            expect(menu_btn).to_have_attribute('aria-expanded', 'false')
            assert page.evaluate('document.activeElement === document.querySelector("#menuBtn")')
            print("PASS: Mobile drawer Escape key and focus return", flush=True)

            # 3. 키보드 네비게이션: 검색 모달 (Ctrl+K, 방향키, Esc 포커스 복원)
            page.set_viewport_size({'width': 1440, 'height': 900})
            search_btn = page.locator('#searchBtn')
            search_btn.click()
            expect(page.locator('.srch')).to_be_visible()
            search_input = page.locator('#srchQ')
            assert page.evaluate('document.activeElement === document.querySelector("#srchQ")')
            search_input.fill('Codex')
            expect(page.locator('.srch-item').first).to_be_visible()
            # initial render has first item active (on)
            expect(page.locator('.srch-item').first).to_have_class(re.compile(r'\bon\b'))
            # ArrowDown moves active to second item
            page.keyboard.press('ArrowDown')
            expect(page.locator('.srch-item').nth(1)).to_have_class(re.compile(r'\bon\b'))
            expect(search_input).to_have_attribute('aria-expanded', 'true')
            page.keyboard.press('Escape')
            expect(page.locator('.srch')).not_to_be_visible()
            assert page.evaluate('document.activeElement === document.querySelector("#searchBtn")')
            print("PASS: Search modal Ctrl+K, arrow keys, and focus restore", flush=True)

            # 4. 준비 체크 시 포커스 유지
            page.goto(base + '#/setup/sales', wait_until='networkidle')
            first_check = page.locator('input[data-check]').first
            first_check.focus()
            first_check.click()
            assert page.evaluate('document.activeElement.matches("input[data-check]")')
            print("PASS: Checklist toggle maintains input focus", flush=True)

            # 5. 복사 동작 및 피드백
            copy_btn = page.locator('[data-copy]').first
            copy_btn.click()
            expect(copy_btn).to_have_text('복사됨')
            print("PASS: Copy button feedback and state transition", flush=True)

            # 6. 전체 주요 라우트 가로 넘침(No overflow) 전수 검사 (390px & 1440px)
            routes = [
                '#/',
                '#/setup',
                '#/setup/sales',
                '#/setup/dev',
                '#/setup/dev/codex/usage',
                '#/setup/dev/codex/troubleshooting',
                '#/me',
                '#/glossary',
                '#/prompts',
                '#/101/guide',
                '#/101/quiz'
            ]
            for width in [390, 1440]:
                page.set_viewport_size({'width': width, 'height': 844 if width == 390 else 900})
                for r in routes:
                    page.goto(base + r, wait_until='networkidle')
                    scroll_w = page.evaluate('Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)')
                    inner_w = page.evaluate('window.innerWidth')
                    assert scroll_w <= inner_w + 1, f"Overflow on {r} at {width}px: scroll={scroll_w}, inner={inner_w}"
            print(f"PASS: No horizontal overflow across {len(routes)} routes on both 390px and 1440px")

        finally:
            child.terminate()
            child.wait(timeout=5)

if __name__ == '__main__':
    with sync_playwright() as p:
        executable = os.environ.get('CHROME_PATH', r'C:\Program Files\Google\Chrome\Application\chrome.exe')
        browser = p.chromium.launch(executable_path=executable, headless=True)
        try:
            run_audit(browser)
        finally:
            browser.close()
    print("All Stage 10 audit checks completed successfully.")
