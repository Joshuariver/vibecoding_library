# 4단계 결과 — 준비 상태 저장·조회

완료일: 2026-10-30  
범위: setup 기본값·구조 검증·저장 및 조회 API. 이전·내보내기·초기화 확장은 5단계에서 진행.

## 변경한 파일

| 파일 | 변경 |
|---|---|
| `static/js/store.js` | vcl:v1에 독립 setup 영역 추가. 기본값·로드 정규화·입력 검증·저장·조회 API, 저장 실패 시 메모리 유지와 성공 시 persistent 복구 |
| `static/index.html` | data/setup.js를 js/store.js 직전에 한 번 로드 |
| `tests/store.cjs` | 외부 의존성이 없는 저장소 행동 검증 24개 추가 |
| `docs/stage-4-result.md` | 이 단계 결과와 API 계약 기록 |

체크 ID를 Store에 중복 하드코딩하지 않기 위해 index.html의 데이터 로드를 원래의 화면 연결 단계보다 앞당겼다. 과정 데이터 로드와 신규 화면은 아직 연결하지 않았다. 기존 학습·UI 스크립트 순서는 그대로 유지했다.

## 저장 구조와 검증 정책

```javascript
setup: {
  course: null,          // sales / dev / null
  deployPlanned: false, // boolean
  aiTools: [],          // antigravity / codex, 중복 제거
  checks: {}            // 유효한 16개 고정 ID에 대한 boolean
}
```

- 기존 `vcl:v1`의 progress·theme·last·favs 및 그 밖의 정상 루트 필드를 유지한다.
- 준비 기록은 학습 진도나 기존 check 버킷에 합산하지 않는다. 준비 선택 변경으로 마지막 학습 위치를 갱신하지 않는다.
- 신규 로드는 디스크에 자동 쓰기하지 않는다. 기존 기록에 setup이 없어도 메모리에서 기본 상태로 사용할 수 있다.
- 루트·진도 버킷·즐겨찾기·준비 상태의 잘못된 구조는 안전한 기본 구조로 처리한다. 정상 학습 값은 변경하지 않는다.
- 알 수 없는 직군은 null, 잘못된 배포 값은 false, 잘못된 AI 목록은 빈 목록으로 정규화한다. AI 목록은 허용 ID만 남기고 일정한 순서로 중복 제거한다.
- 체크는 허용 ID에 대응하는 boolean만 유지한다. false도 명시적으로 보존해 이후 이전 과정에서 덮어쓰지 않을 수 있게 한다.
- 잘못된 API 입력은 기존 유효 상태를 변경하거나 저장하지 않는다.
- getSetup은 새 배열·체크 객체를 반환하므로 반환값을 변경해도 내부 상태나 디스크가 바뀌지 않는다.

## 추가 API

| API | 동작 |
|---|---|
| `Store.getSetup()` | 정규화한 준비 상태의 독립 사본 반환 |
| `Store.setSetupCourse(course)` | sales/dev/null 저장. 체크 보존 |
| `Store.setSetupDeployPlanned(boolean)` | 배포 예정 여부 저장. 체크 보존 |
| `Store.setSetupAiTools(ids)` | 허용 AI 도구 목록 저장. 선택 해제한 도구의 체크 보존 |
| `Store.setSetupCheck(id, boolean)` | 유효 체크의 true 또는 false 저장 |
| `Store.isSetupChecked(id)` | 유효한 준비 체크의 완료 여부 반환 |
| `Store.persistent` | 기존 속성 유지. 실제 저장 실패 시 false, 이후 저장 성공 시 true |

신규 변경 API는 저장 성공 시 true, 입력 거부 또는 저장 실패 시 false를 반환한다. 입력 거부는 상태를 그대로 두며, 저장 실패는 현재 메모리 상태를 유지한다. 저장 가능 여부는 persistent로 구분한다. 준비율은 `VCL.setup.progress(Store.getSetup())`로 계산한다.

저장소 접근·읽기·쓰기가 차단되어도 현재 창에서는 선택과 체크를 사용할 수 있다. 쓰기 실패 시 기존 디스크 값은 그대로다. 이후 저장이 허용되면 현재 메모리의 변경을 함께 저장한다. 차단 상태에서 닫은 창이나 새로고침 후에도 임시 상태가 남는다고 보장하지 않는다.

## 확인한 결과

| 검증 | 결과 |
|---|---|
| Store JavaScript 구문 | node --check 통과 |
| 준비 저장소 검사 | `node <app4/tests/store.cjs>`: 24개 통과 |
| 기존 준비율 검사 | `node <app4/tests/setup.cjs>`: 24개 통과 |
| HTTP 회귀 | `python -B -m pytest <app4/tests> -q -p no:cacheprovider`: 8 passed, 1 warning (10.10s) |
| 실제 스크립트 로드 | index의 순서대로 Store까지 실행. 준비 데이터·44개 실습·Store 초기화 확인 |
| 저장·재조회 | 동일한 vcl:v1에서 직군·AI·배포 여부·명시적 false·완료 체크 복구 |
| 기존 학습 보존 | 진도·퀴즈·즐겨찾기·테마·마지막 위치·102 체크 10개 및 정상 추가 필드 유지 |
| 선택 변경 | 직군·AI·배포 변경 후 체크 유지, Antigravity와 Codex 체크 독립 |
| 경계값 | 잘못된 JSON·루트·setup 컨테이너·입력 타입, 잘못된 학습 버킷, 중복·미지원 AI ID, 외부 참조 변경 확인 |
| 저장 차단·복구 | localStorage getter/read/write 오류를 각각 모사. 메모리 동작, 기존 디스크 보존, 저장 재개 후 재로드 확인 |
| 원본 보존 | app1·참조·계획 78개 해시 일치. 이번 변경 대상 2개를 제외한 app4 기존 사본 72개 해시 일치 |

검증 환경은 Python 3.13.7·Node.js 24.18.0이다. HTTP 경고는 이전 단계와 같은 Starlette TestClient의 httpx 사용 중단 예정 안내이며 의존성은 변경하지 않았다. Python 3.12 및 실제 브라우저 화면 검증과 구분한다.

잘못된 JSON을 읽으면 기존 방식과 같이 임시 상태로 시작하며, 이후 실제 저장 성공 시 persistent가 복구된다. 손상 기록의 복원 기능이나 저장 오류 안내 화면의 추가는 이번 단계에 포함하지 않았다. 기존 홈 화면은 persistent에 따른 저장 불가 안내를 계속 사용한다.

## 다음 단계

5단계에서는 같은 출처의 원본 12개 체크를 고정 ID로 이전하고 기존 명시값을 우선한다. 신규 저장 성공 후 이전 완료를 기록하고, 초기화 후 구 기록이 재유입되지 않도록 처리한다. 준비 기록을 JSON 내보내기와 초기화 정책에 포함한다.

사용자가 “다음”이라고 하기 전까지 여기서 멈춘다.
