"""11단계 회귀 검증 스크립트: 기존 학습(101/201/301), 47개 실습, 잠금 해제, 신규 기능 통합 검증"""

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

def run_regression(browser):
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
            console_errors = []
            page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
            page.on('pageerror', lambda err: console_errors.append(str(err)))

            # 1. 101 입문 학습 흐름 및 진도 기록
            page.goto(base + '#/101/guide', wait_until='networkidle')
            expect(page.locator('h1.page')).to_contain_text('101 입문')
            initial_count = page.evaluate('Store.guideCount("101")')
            page.evaluate('Store.markGuide("101", "s1")')
            page.reload(wait_until='networkidle')
            assert page.evaluate('Store.isGuideRead("101", "s1")') is True
            assert page.evaluate('Store.guideCount("101")') >= initial_count
            print("PASS: 101 guide navigation and reading progress recording", flush=True)

            # 2. 301 초기 잠금(Locked) 상태 확인
            page.goto(base + '#/300', wait_until='networkidle')
            expect(page.locator('#view')).to_contain_text('잠김')
            expect(page.locator('#view')).to_contain_text('201')
            print("PASS: 301 advanced level initially locked", flush=True)

            # 3. 201 체크리스트 완료 후 301 잠금 해제(Unlock) 확인
            page.goto(base + '#/201/quiz', wait_until='networkidle')
            total_checks = page.evaluate('VCL.levels["201"].checklist.items.length')
            assert total_checks > 0
            page.evaluate('''(total) => {
                for (let i = 0; i < total; i++) Store.setCheck("201", i, true);
            }''', total_checks)
            page.reload(wait_until='networkidle')
            assert page.evaluate('VCL_APP.isUnlocked(VCL_CORE.levelById("300"))') is True

            # 301 및 하위 트랙(301, 302) 접근 확인
            page.goto(base + '#/300', wait_until='networkidle')
            expect(page.locator('h1.page')).to_contain_text('301 고급')
            page.goto(base + '#/301/guide', wait_until='networkidle')
            expect(page.locator('h1.page')).to_contain_text('B2B 해외영업')
            page.goto(base + '#/302/guide', wait_until='networkidle')
            expect(page.locator('h1.page')).to_contain_text('비SW R&D')
            print("PASS: 201 checklist completion unlocks 301 hub and 301/302 tracks", flush=True)

            # 4. 47개 실습(Labs) 목록 및 대표 실습 iframe 로드 확인
            lab_count = page.evaluate('VCL.labs.length')
            assert lab_count == 47, f"Expected 47 labs, found {lab_count}"

            # 101-01, 201-01, 301-01, 302-01 샘플 실습 iframe 확인
            for sample_lab in ['101-01', '201-01', '301-01', '302-01']:
                lv, num = sample_lab.split('-')
                page.goto(base + f'#/{lv}/labs/{num}', wait_until='networkidle')
                iframe = page.locator('iframe.labframe')
                expect(iframe).to_be_visible()
                expect(page.locator('#doneBtn')).to_be_visible()
            print("PASS: 47 labs verified, sample iframe rendering validated", flush=True)

            # 5. 준비 상태(setup)와 기존 학습 상태(learning)의 격리 검증
            setup_before = page.evaluate('Store.getSetup()')
            page.evaluate('Store.markGuide("101", "s2")')
            page.evaluate('Store.setLab("101", "101-01", true)')
            page.evaluate('Store.saveQuiz("101", 3, 3)')
            setup_after = page.evaluate('Store.getSetup()')
            assert setup_before == setup_after, "Learning actions altered setup state"

            # 준비 체크 변경이 학습 진도에 영향을 주지 않는지 확인
            prog_before = page.evaluate('JSON.parse(localStorage.getItem("vcl:v1")).progress')
            page.evaluate('Store.setSetupCheck("vscode.path", true)')
            prog_after = page.evaluate('JSON.parse(localStorage.getItem("vcl:v1")).progress')
            assert prog_before == prog_after, "Setup actions altered learning progress"
            print("PASS: State isolation between setup checklist and learning progress", flush=True)

            # 6. 브라우저 콘솔 에러 없음 확인
            assert not console_errors, f"Console errors detected: {console_errors}"
            print("PASS: Zero console errors during entire learning flow", flush=True)

        finally:
            child.terminate()
            child.wait(timeout=5)

if __name__ == '__main__':
    with sync_playwright() as p:
        executable = os.environ.get('CHROME_PATH', r'C:\Program Files\Google\Chrome\Application\chrome.exe')
        browser = p.chromium.launch(executable_path=executable, headless=True)
        try:
            run_regression(browser)
        finally:
            browser.close()
    print("Stage 11 regression test passed completely.")
