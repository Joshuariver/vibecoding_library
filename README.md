# DEJ FastAPI용 바이브코딩 라이브러리 (온보딩 통합본)

`04.apps/academy/dist/`의 학습 앱에 **시작 준비(5개 도구 체크 및 준비율)**, **Codex CLI 상세 가이드**를 단일 FastAPI 프로세스로 통합 제공합니다.
가이드, 47개 실습, 퀴즈, 용어 사전, 프롬프트, 통합 검색, 학습 진도 및 시작 준비율 기능을 포함합니다.
Node.js 빌드, 별도 프론트엔드 서버, 데이터베이스 및 외부 LLM API 키가 필요하지 않습니다.

## 주요 기능 및 구성

1. **시작 준비 (`#/setup`)**:
   - 사내 배포 예정 여부, 사용할 AI 도구(Antigravity CLI / Codex CLI) 선택.
   - 5개 도구(VS Code, Antigravity CLI, Codex CLI, Python, Git)를 외부 사이트 이동 없이 본문의 OS별 단계 안내(다운로드 검색어·설치 화면 선택값·명령·확인·문제 해결)만으로 설치할 수 있도록 제공하고, 총 16개 고정 ID 체크리스트를 둡니다.
   - 선택 도구 및 배포 조건에 따른 동적 준비율(%) 산출 (학습 진도 및 301 잠금과 독립 운영).
2. **Codex CLI 상세 가이드 (`#/setup/codex`)**:
   - 12개 주제: 개요, 설치 4방식, 인증 3방식(ChatGPT 웹/기기 코드/API 키), 첫 실행 3단계, 개별 터미널/내부 명령, 권한 모드, AGENTS.md, config.toml, 자동화(JSONL), 업데이트 및 문제 해결 8종.
3. **통합 검색 (Ctrl+K 또는 `/`)**:
   - 기존 학습 레벨, 용어 사전, 프롬프트 라이브러리와 함께 설치 도구/세부 절을 한곳에서 검색 및 바로가기 지원.
4. **내 학습 (`#/me`)**:
   - 레벨별 학습 진도와 함께 '시작 준비 현황' 패널 제공.
   - JSON 내보내기 및 초기화 시 학습 기록과 준비 상태를 함께 처리(테마 및 이전 이력 보존).

## 빠른 실행

Python 3.10 이상에서 이 폴더를 터미널의 현재 폴더로 지정한 뒤 실행합니다.

```sh
python -m pip install -r requirements.txt
python main.py
```

브라우저에서 `http://localhost:8000/`를 엽니다.
표준 ASGI 진입점은 `main:app`이며 다음 명령으로도 실행할 수 있습니다.

```sh
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Linux/DEJ에서는 `sh start.sh`로 실행할 수 있습니다.
`python main.py`와 `start.sh`는 환경 변수 `PORT`를 사용합니다(기본 8000).

## DEJ FastAPI 템플릿에 적용

1. DEJ Workspace에서 FastAPI 템플릿 프로젝트를 생성하고 프로젝트 권한과 GitLab을 설정합니다.
2. 이 폴더의 `main.py`, `static/`, `requirements.txt`를 실행 폴더에 복사합니다.
3. 템플릿이 `main:app`을 실행하면 그대로 사용합니다.
4. Python 의존성을 설치하고 `0.0.0.0:8000` 주소에서 실행합니다.
5. IDE Web URL에 표시된 프록시 경로를 `APP_ROOT_PATH`에 설정하여 테스트한 후, **Publish 전에는 `APP_ROOT_PATH`를 해제**하고 배포합니다.

```sh
APP_ROOT_PATH=/project/<프로젝트>/<사용자>/proxy/8000 sh start.sh
```

## 파일 구성

- `main.py`: FastAPI 진입점, 정적 자산 제공, DEJ 프록시 경로 정규화, 폰트 CORS 및 `/healthz` 상태 확인.
- `static/`:
  - `data/setup.js`: 5개 도구 안내, 설치/명령/인증 구조화 데이터, 16개 체크 정의 및 필수 항목 계산 로직.
  - `data/search.js`: 기존 학습 색인에 온보딩/도구 색인을 결합한 통합 검색 데이터.
  - `js/onboarding.js`: 도구 선택, 시작 준비 및 Codex 상세 뷰 렌더러.
  - `js/app.js`: 앱 셸 라우터, 홈 시작하기 카드, 사이드바 내비게이션, 모바일 드로어.
  - `js/store.js`: 브라우저 localStorage(`vcl:v1`) 기반 학습 및 시작 준비 상태 저장, 구버전 마이그레이션, JSON 내보내기/리셋.
  - `js/tools.js`: 용어 사전, 프롬프트, 내 학습(준비 현황 포함), 통합 검색 모달.
  - `css/app.css`: 반응형 디자인 시스템 토큰 및 모바일 390px 가로 넘침 방지 레이아웃.
  - `labs/`: 인터랙티브 실습 47개 HTML.
- `tests/`:
  - `test_app.py`: pytest 기반 FastAPI HTTP 응답, 프록시, 정적 파일 서빙 검사.
  - `store.cjs`: Node.js 기반 저장소 기본값, 마이그레이션, 예외 복구, 내보내기/초기화 단위 테스트 (46 passed).
  - `search.cjs`: Node.js 기반 통합 검색 색인 및 동적 링크, 301 잠금 필터 단위 테스트 (9 passed).
  - `check_onboarding.py`: Playwright 기반 루트 및 DEJ 프록시 환경 온보딩 종합 검증 (34 passed).
  - `browser_audit.py`: Playwright 기반 테마, 모바일 드로어 Esc, 검색 모달, 포커스, 14개 라우트 가로 넘침 감사 (6 passed).
  - `regression_test.py`: 기존 101/201/301 학습, 47개 실습 iframe, 301 잠금 해제 게이트 회귀 검증.

## 검증 실행 방법

```sh
# 1. HTTP 서버 및 자산 서빙 검사
python -m pytest tests -q -p no:cacheprovider

# 2. 저장소 및 검색 단위 검사
node tests/store.cjs
node tests/search.cjs

# 3. 온보딩 브라우저 E2E 검사 (루트 및 프록시 환경)
python -B tests/check_onboarding.py

# 4. 세부 사용성 및 반응형 가로 넘침 전수 감사
python -B tests/browser_audit.py

# 5. 기존 학습 기능 전체 회귀 검사
python -B tests/regression_test.py
```

## 내용 갱신 시 주의사항

원본 academy를 빌드한 후 `dist/` 내용을 `static/`에 반영할 때, 이번 온보딩 기능으로 추가된 파일(`data/setup.js`, `js/onboarding.js`)과 수정된 파일(`index.html`, `js/app.js`, `js/store.js`, `js/tools.js`, `data/search.js`, `css/app.css`)이 덮어쓰여 손실되지 않도록 병합해야 합니다.

마크다운·메타 프롬프팅·ICL/RAG/CPT 추가 콘텐츠(`data/level-101.js`, `data/level-201.js`, `data/glossary.js`, `data/prompts.js`, `data/labs.js`, `data/search.js`의 관련 항목과 `labs/101-11.html`, `labs/201-17.html`, `labs/201-18.html`)도 같은 방식으로 보존해야 합니다. 원본 빌드로 위 데이터 파일을 교체한 뒤에는 실습이 47개인지, 검색어 `마크다운`·`메타 프롬프팅`·`ICL`·`RAG`·`CPT`가 가이드와 실습으로 이동하는지 `node tests/search.cjs`로 확인하세요.
