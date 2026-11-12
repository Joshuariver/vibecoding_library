# 11단계 결과 — 기존 학습 기능과 새 기능의 전체 회귀 검증 완성

완료일: 2026-10-30  
범위: 기존 101, 102, 103s, 103d 가이드 및 44개 실습 iframe, 102 완료에 따른 103 잠금 해제 게이트, 학습 상태와 준비 상태의 격리, HTTP/브라우저 회귀 검증.

## 변경 및 검증 파일

| 파일 | 내용 |
|---|---|
| `tests/regression_test.py` | 101 학습/진도, 103 잠금 및 102 완주 시 103 해금, 44개 실습 데이터 무결성 및 샘플 iframe 서빙, 상태 격리, 브라우저 콘솔 에러 0건 검증 |
| `tests/test_app.py` | FastAPI 엔드포인트(`/`, `/healthz`, `/static/*`), 프록시 헤더, 파일 노출 방지 HTTP 검사 (8 passed) |
| `docs/stage-11-result.md` | 이 기록 |

## 회귀 검증 결과 상세

1. **기존 학습 기능 정상 동작 (101 / 102 / 103)**:
   - 101 입문 가이드 열람 및 진도 저장(`Store.markGuide`, `Store.isGuideRead`, `Store.guideCount`)이 신규 준비 기능 추가 후에도 완벽히 유지됨.
   - 103 고급 단계는 기본적으로 잠김(`locked`) 상태를 유지하며, 102 단계의 체크리스트를 모두 완료할 때 즉시 103 허브 및 하위 트랙(103s 해외영업, 103d 비SW R&D)이 정상 해금됨.
2. **44개 실습(Labs) 서빙 및 iframe 샌드박스 무결성**:
   - `VCL.labs` 배열 내 44개 실습 정의가 모두 보존되어 있음을 확인.
   - 대표 실습(`101-01`, `102-01`, `103s-01`, `103d-01`) 진입 시 실습 HTML이 `iframe.labframe` 내에서 스크립트 오류 없이 로드되며 완료 토글 버튼(`#doneBtn`)이 정상 상호작용함을 확인.
3. **상태 격리 (State Isolation)**:
   - 가이드 열람, 실습 완료, 퀴즈 점수 변경 등 학습 액션 수행 시 `Store.getSetup()` 상태에 아무런 부작용(Side Effect)이 발생하지 않음.
   - 준비 화면 체크박스(`Store.setSetupCheck`) 변경 시 `progress` 학습 진도 데이터가 변경되지 않고 독립성을 유지함.
4. **브라우저 콘솔 오류 무결성**:
   - 전체 회귀 테스트 실행 중 브라우저 콘솔 `error` 및 처리되지 않은 예외(Unhandled Exception) 발생 건수 0건.

## 검증 요약

- `python -B tests/regression_test.py`: 6개 종합 회귀 테스트 전체 PASS
- `python -m pytest tests`: 8 passed (1 warning)
- `node tests/search.cjs`: 8 passed
- `node tests/store.cjs`: 46 passed
- `python -B tests/check_onboarding.py`: 34 passed

## 다음 단계

12단계에서는 `app4/README.md` 및 `app4/static/README.txt`를 최종 갱신하고, 원본 대비 변경 내역 검토 및 최종 검증 결과를 정리하여 보고합니다.
