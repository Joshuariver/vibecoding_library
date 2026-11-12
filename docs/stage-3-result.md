# 3단계 결과 — 도구 데이터와 준비율 계산

완료일: 2026-10-30  
범위: app4의 준비 데이터·고정 ID·원본 매핑·순수 계산. 저장·화면·라우팅 연결은 미착수.

## 추가한 파일

| 파일 | 내용 |
|---|---|
| `static/data/setup.js` | VS Code → Antigravity CLI → Codex CLI → Python → Git 순서의 안내, 설치 방식, 확인 명령, 도움말, 공식 출처, 체크 16개, 이전 인덱스, 필수 항목·준비율 계산 |
| `tests/setup.cjs` | Node 내장 node:test를 사용하는 준비율·기록 독립성·데이터 계약 검증 24개. 외부 패키지 불필요 |
| `docs/stage-3-result.md` | 변경 내용, 계산 인터페이스와 검증 결과 |

기존 app1과 app4의 기존 파일은 수정하지 않았다. index.html 스크립트 로드는 화면 연결 단계에서 수행한다.

## 데이터 구성

- 공통: 출처 경로·도구별 공식 링크, 앱 검토일 `2026-10-30`, AI 도구 ID 목록.
- 각 도구: 사용 이유, 설치 방식과 OS, 필요 도구, 고정 체크, 확인·상세 사용법·문제 해결 절.
- 필수 조건은 `requiredFor`에 `all`, `selected-ai`, `development-or-deploy`로 표현한다. 항목 수를 계산 코드에 하드코딩하지 않는다.
- 체크는 VS Code 3개, Antigravity 3개, Codex 4개, Python 3개, Git 3개로 총 16개다.
- 기존 12개 배열의 매핑은 표시 순서와 별도로 `legacyCheckIds`에 고정했다. Codex는 구 기록 매핑에 포함하지 않는다.
- Codex는 설치 4방식과 로그인·첫 실행·명령·수정 결과 확인·권한·AGENTS.md·설정·자동화·업데이트·문제 해결을 데이터에 포함했다. 단계 8에서는 이 데이터를 상세 화면과 설치 방식 선택에 연결한다.
- npm 설치에만 Node.js/npm이 필요하다. Homebrew 방식은 Homebrew가 필요하고 독립 스크립트에 Node를 요구하지 않는다.
- 한국어 팩 ID를 검토 결과대로 수정하고 Mermaid는 버전별 선택 안내로 둔다. Git의 인증서 검증 해제 명령은 포함하지 않는다.
- 명령은 복사용 문자열이며 앱이나 이번 작업에서 설치·로그인을 실행하지 않았다.

## 다음 단계에서 사용할 인터페이스

`window.VCL.setup`에 `tools`, `aiToolIds`, `legacyCheckIds`, `requiredCheckIds`, `progress`를 제공한다. 기존 VCL 필드는 유지한다. Store·DOM·localStorage에 접근하지 않는다.

입력 상태는 다음 필드로 통일한다.

```javascript
{
  course: 'sales',             // 'sales' 또는 'dev'; 미선택은 null
  deployPlanned: false,        // 명시적인 boolean
  aiTools: ['codex'],          // 'antigravity', 'codex' 중 0~2개
  checks: { 'codex.installed': true } // 고정 ID별 boolean
}
```

- `requiredCheckIds(state)`: 현재 필수 ID 배열. 직군 미선택·알 수 없는 직군은 빈 배열.
- `progress(state)`: `requiredIds`, `done`, `total`, `needsCourseSelection`, `needsAiSelection`, `percent` 반환.
- AI 미선택이면 공통·Git의 항목 집합은 계산하되 `percent`는 null이다. 화면에서 도구 선택 안내를 먼저 표시한다. 직군 미선택도 percent가 null이다.
- 완료는 필수 ID에 대응하는 본인 소유 속성의 boolean true만 센다. 잘못된 타입·알 수 없는 ID·선택 해제한 도구·선택 Git의 체크는 분자에서 제외한다.
- 계산은 입력의 선택·체크·기존 학습 진도·마지막 위치를 변경하지 않는다. 선택 변경 후 재선택 시 기존 체크를 그대로 사용할 수 있다.
- 중복·알 수 없는 AI 도구 ID는 무시하며, 배포 여부의 문자열 "true"나 숫자 1을 필수 조건으로 해석하지 않는다. 저장 상태 정규화는 4단계에서 처리한다.

## 검증 결과

| 확인 | 결과 |
|---|---|
| JavaScript 구문·로드 | node --check와 vm 실행 성공, 기존 VCL 데이터 보존 |
| 계산 및 데이터 검증 | `node <app4/tests/setup.cjs>`: 24개 통과 |
| 선택 조합 | sales/dev × 배포 예정 true/false × 미선택/Antigravity/Codex/둘 다의 16개 조합에서 0개·전체 완료 확인 |
| 필수 수 | 일반 영업 9/10/13, dev 또는 배포 예정 12/13/16. 미선택 완료율 null |
| 부분 완료 | 7/10=70%, 1/13=8% 반올림 확인 |
| 선택 전환 | Antigravity 완료가 Codex로 복제되지 않고 체크·학습 데이터가 변하지 않음 |
| 경계값 | 직군 누락·잘못된 직군, 잘못된 체크·AI 목록·배포 타입, 상속된 체크, 알 수 없는 ID, 결과 배열 변경의 독립성 확인 |
| 원본 대응 | 검토 문서의 체크 ID 16개·이전 인덱스 12개, Codex 설치·업데이트 4방식의 원본 명령 일치 |
| 명령 문자열 | 코드 블록의 실제 줄바꿈과 Windows 경로 확인 |
| HTTP 회귀 | `python -B -m pytest <app4/tests> -q -p no:cacheprovider`: 8 passed, 1 warning (10.76s) |
| 원본 보존 | app1 및 참조·계획 78개가 기준선 해시와 일치. app4의 기존 사본 74개도 일치 |

Python 3.13.7·Node.js 24.18.0에서 검증했다. HTTP 경고는 기존 Starlette TestClient의 httpx 사용 중단 예정 안내이며 의존성을 바꾸지 않았다. 브라우저·새 화면 동작은 이번 단계 검증 대상이 아니다.

Node의 --test 옵션은 이 환경에서 UNC 파일을 찾지 못했으므로 node:test 파일을 Node로 직접 실행해 24개 검사를 완료했다. 별도의 명령 문자열 대조 첫 시도는 PowerShell 파이프의 한국어 파일명 인코딩으로 실패했고 데이터의 sourcePath를 그대로 읽도록 바꿔 통과했다. 앱 데이터 수정이 필요한 실패는 없었다.

## 다음 단계

4단계는 store.js에 독립 setup 상태의 기본값·구조 검증·조회/변경 API를 추가하는 작업이다. 기존 학습 기록을 보존하고 임시 저장 상태를 확인한다. 구 기록 이전과 내보내기·초기화는 계획대로 5단계에서 연결한다.

사용자가 “다음”이라고 하기 전까지 여기서 멈춘다.
