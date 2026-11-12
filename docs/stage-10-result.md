# 10단계 결과 — 모바일·테마·키보드·포커스·복사 동작 점검 완성

완료일: 2026-10-30  
범위: 모바일(390px) 및 데스크톱(1440px) 반응형 레이아웃, 라이트/다크 테마 전환, 키보드 내비게이션, 포커스 제어, 클립보드 복사 피드백 점검.

## 변경 및 검증 파일

| 파일 | 내용 |
|---|---|
| `static/css/app.css` | `.layout` 그리드에 `minmax(0, 1fr)` 및 `#view`에 `min-width: 0`을 적용하여 390px 모바일 환경의 테이블/코드 가로 넘침 방지 |
| `tests/browser_audit.py` | 테마 전환, 모바일 드로어 Esc/포커스 복원, 검색창 방향키/Esc, 체크 시 포커스 유지, 복사 피드백, 14개 라우트 가로 스크롤 전수 검사 |
| `docs/stage-10-result.md` | 이 기록 |

## 세부 점검 결과

1. **반응형 레이아웃 및 가로 넘침 (No Horizontal Overflow)**:
   - 390px(모바일) 및 1440px(데스크톱) 뷰포트에서 총 14개 주요 경로(`#/`, `#/courses`, `#/courses/sales`, `#/courses/dev`, `#/setup`, `#/setup/sales`, `#/setup/dev`, `#/setup/dev/codex/usage`, `#/setup/dev/codex/troubleshooting`, `#/me`, `#/glossary`, `#/prompts`, `#/101/guide`, `#/101/quiz`) 전수 검사 완료.
   - 모든 화면에서 `document.documentElement.scrollWidth <= window.innerWidth`를 만족하여 가로 스크롤이 발생하지 않음을 확인.
2. **테마 전환 (Light / Dark)**:
   - 상단바 `#themeBtn` 클릭 시 `dataset.theme` 속성 및 CSS 커스텀 속성(`--surface`, `--text`, `--border`, `--accent` 등)이 올바르게 반영됨.
   - 다크 모드에서도 충분한 명도 대비와 시각적 가독성 유지 확인.
3. **키보드 접근성 및 포커스 관리**:
   - 모바일 환경에서 드로어 메뉴 열림 시 `Escape` 키 입력으로 드로어가 닫히고 포커스가 `#menuBtn`으로 안전하게 복귀됨.
   - 검색 모달(Ctrl+K 또는 `/`) 진입 시 검색창으로 포커스 이동, 방향키(ArrowDown/ArrowUp)로 결과 목록 선택 이동 및 `aria-activedescendant` 동기화 확인.
   - 검색 모달에서 `Escape` 키 입력 시 모달이 닫히고 검색을 호출했던 기존 버튼/요소로 포커스 복원 확인.
   - 준비 화면 체크박스 토글 시 다른 위치로 포커스가 튀지 않고 해당 체크 요소에 포커스 유지 확인.
4. **코드 복사 동작**:
   - 복사 버튼 클릭 시 클립보드에 명령 텍스트가 정상 기록되며, 버튼 텍스트가 일시적으로 `복사됨`으로 변경된 후 원래 상태(`복사`)로 복원되는 시각적 피드백 확인.

## 검증 요약

- `python -B tests/browser_audit.py`: 6개 종합 감사 항목 전체 통과
- `python -B tests/check_onboarding.py`: 34개 브라우저 E2E 검증 그룹 전체 통과
- `node tests/search.cjs`: 8개 단위 테스트 통과
- `node tests/store.cjs`: 46개 저장소 단위 테스트 통과

## 다음 단계

11단계에서는 기존 101, 102, 103s, 103d 학습 콘텐츠, 44개 실습 iframe, 퀴즈, 그리고 102 체크리스트 완료 시 103 해금 동작 등 기존 기능 전체에 대한 통합 회귀 검증(Full Regression Test)을 수행합니다.
