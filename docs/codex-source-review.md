# Codex CLI 원본 대조 및 공식 출처 검토

검토일: 2026-10-30  
대상: `ref_mds/Codex_CLI_설치_사용_가이드.md`  
단계: 1단계 콘텐츠·설치 안내 검토  
출력 앱: `app4/` — `app1/` 및 참조 원본은 수정하지 않음

공식 OpenAI documentation을 검색하고 실제 문서 본문을 열어 대조했다. 웹 추출에서 숨겨진 OS 탭이 생략되어 CLI 설치 및 명령 레퍼런스의 공식 `.md` 응답도 읽었다. 설치·로그인·Codex 작업 명령은 실행하지 않았다. 아래의 ‘확인’은 공식 문서와의 일치를 뜻하며 회사 장비 설치 성공, 계정 권한, 사내 승인을 뜻하지 않는다.

## 원본 12개 주제의 이관 결정

| 원본 장 | 확인 결과 | app4 반영 |
|---|---|---|
| 1. 개요 | 로컬 파일 조사·수정·명령 실행 및 자동화 설명 확인. [CLI 개요](https://learn.chatgpt.com/docs/codex/cli) | 소개 문구와 프로젝트 런타임 별도 준비 설명 유지. |
| 2. 설치 | Windows 독립 스크립트, macOS/Linux 독립 스크립트, npm, Homebrew의 원본 설치 명령이 공식 설치 탭과 일치. [설치 안내](https://learn.chatgpt.com/docs/codex/cli) | 네 방식 중 하나 선택. npm 방식에만 Node.js/npm 준비를 안내. 스크립트는 사용자가 자신의 터미널에서 실행. |
| 3. 로그인 | ChatGPT 구독 접근과 API 사용량 기반 접근, 기기 코드 인증과 허용 조건 확인. [인증](https://learn.chatgpt.com/docs/auth) | 인증 방식별 조건 유지. 웹앱에 로그인 실행·키 입력 기능을 넣지 않음. |
| 4. 첫 작업 | 프로젝트 디렉터리에서 실행·요청·검토하는 흐름 확인. [시작 안내](https://learn.chatgpt.com/docs/codex/cli) | 설명 요청 프롬프트는 교육용 예시임을 유지. Git 미설치 사용자에게 Git 명령 성공을 첫 실행 완료 조건으로 요구하지 않음. |
| 5. 기본 명령 | 대화형 실행·세션 재개·라이브 검색 및 슬래시 명령 존재 확인. [명령어](https://learn.chatgpt.com/docs/cli/reference), [슬래시 명령](https://learn.chatgpt.com/docs/cli/slash-commands) | 터미널과 Codex 입력창을 구분. 선택 가능한 모델명은 고정하지 않음. |
| 6. 권한 | 읽기 전용·작업 폴더 쓰기·추가 폴더 옵션 및 승인 정책 설명 확인. [명령어](https://learn.chatgpt.com/docs/cli/reference), [Windows 샌드박스](https://learn.chatgpt.com/docs/windows/windows-sandbox) | 권한 안내 유지. Windows 구현 종류에 관한 보강 사항은 아래 표 적용. |
| 7. AGENTS.md | 전역→프로젝트 경로 순서, 가까운 지침 우선, 세션 시작 시 탐색 확인. [AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md) | 원본 예시 유지. 프로젝트 루트를 못 찾으면 현재 폴더만 확인한다는 예외를 추가 설명. |
| 8. config.toml | 사용자·프로젝트 설정 위치, 신뢰한 프로젝트의 설정, CLI 우선과 관리자 제약 확인. [설정](https://learn.chatgpt.com/docs/config-file/config-basic) | 최소 설정 예시 유지. 이 앱에서 사용자 설정을 수정하지 않음. |
| 9. exec | 비대화형 실행, 읽기 전용 기본값, 수정 범위 명시, 출력 저장, JSONL과 full-auto 미지원 확인. [비대화형 실행](https://learn.chatgpt.com/docs/non-interactive-mode) | 원본 예시를 상세 사용법에 이관. 앱이 자동 실행하지 않음. |
| 10. 업데이트 | 원본의 독립 설치 스크립트 재실행, npm 재설치, Homebrew 업그레이드가 공식 업데이트 탭과 일치. [업데이트](https://learn.chatgpt.com/docs/codex/cli) | 설치 방식과 업데이트 안내를 함께 전환. 중복 설치를 권하지 않음. |
| 11. 문제 해결 | 인증·권한·Windows 문제의 기반 기능 확인. [인증](https://learn.chatgpt.com/docs/auth), [Windows](https://learn.chatgpt.com/docs/windows/windows-sandbox) | 원본의 PATH·PowerShell·버전 중복 점검은 진단 제안으로 제공하고 해결 보장 문구는 사용하지 않음. |
| 12. 출처 | 원본에 있는 공식 문서 7개 URL의 본문을 열어 확인. 슬래시 전용 문서를 추가 확인. | 원본 경로·원본 확인일·앱 검토일과 관련 공식 링크를 함께 제공. |

## 명령과 조건의 상세 판정

| 항목 | 판정 | 구현 시 주의 |
|---|---|---|
| 설치·업데이트의 4개 경로 | 확인 | 버전을 임의로 고정하지 않는다. 설치 방식 하나를 고른다. |
| 로그인·로그인 상태·로그아웃 | 확인 | 상태 조회는 인증 방식/자격증명의 확인이며 모든 조직 기능의 사용 권한을 보장하지 않는다. [레퍼런스](https://learn.chatgpt.com/docs/cli/reference) |
| 기기 코드 로그인 | 조건부 확인 | 개인 보안 설정 또는 워크스페이스 관리자 허용이 필요하며 공식 문서는 beta로 설명한다. [인증](https://learn.chatgpt.com/docs/auth) |
| API 키의 stdin 인증 | 확인 | 원본 PowerShell 예시는 환경 변수가 사전 설정된 경우의 셸 변형이다. 실제 키를 앱에 입력·저장하지 않는다. [레퍼런스](https://learn.chatgpt.com/docs/cli/reference) |
| 세션 재개와 최근 세션 | 확인 | 최근 세션은 기본적으로 현재 작업 디렉터리 기준이다. 다른 디렉터리의 세션은 별도 옵션/선택 조건이 있다. [레퍼런스](https://learn.chatgpt.com/docs/cli/reference) |
| 실시간 웹 검색 옵션 | 확인 | 기본 캐시 검색과 실시간 검색을 구분한다. [레퍼런스](https://learn.chatgpt.com/docs/cli/reference) |
| status·model·permissions·review·init·exit 슬래시 명령 | 확인 | 원본 6개 모두 전용 문서에 존재한다. 터미널에 입력하는 명령으로 표시하지 않는다. [슬래시 명령](https://learn.chatgpt.com/docs/cli/slash-commands) |
| 읽기 전용 / 작업 폴더 쓰기 + 필요시 승인 | 확인 | 원본 정책 옵션이 현재 레퍼런스에 존재한다. 외부 경로와 네트워크 무제한 허용으로 설명하지 않는다. [레퍼런스](https://learn.chatgpt.com/docs/cli/reference) |
| exec 기본 출력과 JSONL | 확인 | 일반 모드 진행은 stderr, 최종 응답은 stdout. JSON 모드는 stdout을 이벤트 스트림으로 바꾸므로 최종 답변 파일과 구분한다. [자동화](https://learn.chatgpt.com/docs/non-interactive-mode) |
| full-auto | 미지원 확인 | 원본의 미지원 경고를 유지한다. 대체로 작업 폴더 범위를 지정하는 안내를 제공한다. [자동화](https://learn.chatgpt.com/docs/non-interactive-mode) |

## 원본 표현을 보정할 사항

1. **인증 저장소:** 원본이 `auth.json`을 저장된 인증 파일로 설명하지만, 공식 문서는 파일·OS 자격증명 저장소·임시 저장 등을 구분한다. ‘파일 기반 저장을 사용하는 경우’로 조건을 붙이고 인증 파일이 반드시 생성된다고 약속하지 않는다. [인증 저장](https://learn.chatgpt.com/docs/auth#credential-storage)
2. **Windows 샌드박스:** WSL이 필수가 아니라는 원본 방향은 맞다. 현재 공식 문서는 호환 장비의 MXC를 권장하고 elevated/unelevated를 대체 방식으로 구분한다. 설치 성공이나 관리자 권한 불필요를 일괄 보장하지 않는다. [Windows 샌드박스](https://learn.chatgpt.com/docs/windows/windows-sandbox)
3. **사내 TLS 문제:** 공식 인증 문서에는 회사 CA 번들 설정이 있다. 인증서 검증을 끄는 우회를 추가하지 않고 조직이 제공한 인증서·프록시 설정과 지원 문의로 안내한다. [인증 및 CA](https://learn.chatgpt.com/docs/auth#custom-ca-bundles)
4. **문제 해결의 출처 구분:** PATH 조회, npm.cmd/codex.cmd 점검, 테스트 런타임 확인은 원본의 실무 점검 제안으로 표시한다. 모든 환경에서 공식 보장된 해결책으로 표시하지 않는다.

## 미확인 사항과 구현 제한

- 해당 조직의 Codex 사용 허용 여부, 계정·워크스페이스 역할, 기기 코드 허용, 결제·한도는 공개 문서만으로 확인할 수 없다.
- Windows/macOS/Linux 실제 설치, 인증 성공, npm의 최소 Node.js 요구 버전은 이번 검토에서 실기 검증하지 않았다. 확인되지 않은 최소 버전을 앱에 새로 단정하지 않는다.
- `codex --version`과 도움말 확인은 사용자 설치 후의 완료 체크로 유지한다. 이 검토는 사용자 PC 설치 완료를 대신하지 않는다.
- 원본에 대한 중대한 설치 명령 불일치는 발견하지 않았다. 위 조건과 표현 보정을 반영해 이관할 수 있다.

## 구현에 전달할 완료 조건

설치 방식 하나 완료 → 새 터미널에서 버전·도움말 확인 → 허용된 인증 방식으로 상태 확인 → 프로젝트 폴더에서 첫 설명 요청 결과 확인의 4개 체크를 독립 저장한다. 상세 사용법 전체 읽기, API 키 사용, Git 설치를 Codex 공통 완료 조건으로 추가하지 않는다. Antigravity 완료 기록을 복제하지 않는다.
