# 1단계 — 콘텐츠 대조 및 설치 안내 검토

검토일: 2026-10-30  
대상: `design_v1.md`, `2_design_plan.md`, `ref_app/course_guide.html`, `ref_mds/Codex_CLI_설치_사용_가이드.md`  
상태: 콘텐츠 이관 기준 확정. 앱 구현은 다음 단계부터 진행.

## 저장 위치 변경

사용자 지시에 따라 통합 결과는 `app4/`에 저장한다. 기존 계획의 `app1/…` 변경 대상은 모두 `app4/…`로 치환한다. `app1/`은 읽기 전용 원본으로 보존한다. 루트의 기존 계획서는 수정하지 않는다.

다음 2단계에서는 app1의 앱 파일을 app4로 복사하고, 그 사본에 `static/data/courses.js`를 추가한다. app4에 먼저 작성된 `docs/` 검토 기록은 유지한다. 기존 파일이 있는 경우 무조건 덮어쓰지 않고 내용과 충돌을 확인한다. 가상환경·캐시·Git 메타데이터는 복사하지 않는다. 복사 직후 기존 자산과 원본의 해시 일치를 확인한 뒤 신규 파일을 추가한다.

app1과 app4를 같은 호스트·포트에서 번갈아 실행하면 동일한 `vcl:v1` 기록을 공유한다. 기존 학습 기록 보존이라는 설계를 유지하되, 개발 검증은 별도 포트·독립 브라우저 프로필로 격리한다. 경로만 다르다고 localStorage가 분리된다고 설명하지 않는다.

## 검토 방법과 한계

원본 HTML의 과정 영역·명령·확장 ID·체크 순서, Codex Markdown의 전체 목차를 대조했다. 설치 안내는 공식 문서와 배포자가 작성한 Marketplace 설명을 실제로 열어 확인했다. 검색 결과 요약만으로 검증 완료 처리하지 않았다.

문서와 명령 문법을 확인한 결과이며, 설치·로그인·실제 교육 신청·사내 배포를 수행한 결과는 아니다. 공개 문서에서 확인할 수 없는 사내 승인, 계정 권한, 신청 정보의 현재 운영 여부는 미확인으로 남긴다. 다운로드 링크는 공식 안내 페이지로 연결하고 실행 파일을 내려받아 실행하지 않았다.

## 교육 과정 대조표

출처는 `ref_app/course_guide.html`의 `#viewMkt`, `#viewDev`, `.sidebar-footer`다. `mkt`를 신규 데이터의 `sales`로 대응한다. 사내 교육 내용은 제공된 원본을 근거로 이관하며 공개 웹으로 검증한 정보로 표시하지 않는다.

| 항목 | 해외영업 sales | 비SW개발 dev |
|---|---|---|
| 과정명 | 해외영업 실무자를 위한 Vibe Coding 과정 | 비SW개발 직군을 위한 Vibe Coding 과정 |
| 러닝넷 검색명 | [MS][ID]B2B 해외영업 마케팅직군을 위한 바이브 코딩 | [MS][ID]비SW개발 직군을 위한 바이브코딩 |
| 신청 기간 | 2026-10-07 ~ 2026-10-13 | 2026-10-07 ~ 2026-10-20 |
| 교육일 | 2026-10-19 월요일 | 2026-10-26 월요일 |
| 시간 | 09:00 ~ 17:00, 교육 7시간 | 08:00 ~ 16:00, 교육 7시간 |
| 장소 | 트윈 15층 디지털룸 | G1동 205 강의장 |
| 정원 | 20명, 원본은 선착순 마감 안내 | 20명, 원본은 선착순 마감 안내 |
| 현재 표시 | 지난 회차 / 신청 기간 종료 | 지난 회차 / 신청 기간 종료 |
| 준비사항 | 업무용 노트북, 등록 후 도구 선정 설문 | 실습용 노트북, 등록 후 AI CLI·환경 설정 설문 |

요일은 날짜 계산으로도 확인한다. 원본 시간표의 수업 합계는 각 7시간이며 점심 시간은 학습 시간으로 합산하지 않는다. 일정과 신청 기간을 새 회차로 자동 갱신하지 않는다. 등록 후 설문은 지난 회차의 원본 안내임을 문맥에 표시한다.

### 개요와 학습 목표

- 해외영업 개요: 자연어로 AI Agent에 업무 의도를 전달하고 실적 엑셀 시각화와 ID Sales 프롬프트 kit을 활용하는 실습.
- 해외영업 목표 4개: 핵심 개념·AI CLI 환경 구축 / 바이어 맞춤 카탈로그 웹앱 / 실적 데이터 디버깅·대시보드 / 버티컬 수주와 고객 제안 자료.
- 비SW개발 개요: 품질·생산·기구·회로 직무의 부품 조회, 불량·공차 분석, 8D 보고서 자동화 실습.
- 비SW개발 목표 4개: 엔지니어링 AI 도구 활용 / 부품 스펙·규격 조회 / 불량·공차 시각화·원인 분석 / PPT Skill을 통한 8D 보고서·AX Studio 배포.

위 목표는 교육에서 다루는 내용이다. 통합 앱이 해당 산출물을 자동 생성하거나 배포하는 기능은 구현하지 않는다.

### 시간표 10개 행

| 직군 | 구분 | 시간 | 내용 |
|---|---|---|---|
| sales | 도입 | 09:00~11:00 | 바이브코딩 이해, AI CLI 설치, 기본 프롬프팅 |
| sales | 실습 1 | 11:00~12:00 | ID제품 바이어 맞춤 카탈로그 웹앱 제작·시연 |
| sales | 실습 2 | 13:00~14:00 | 엑셀 실적 에러 탐색·결측치 보정·디버깅 |
| sales | 실습 3 | 14:00~15:00 | 매출 실적 분석·인터랙티브 웹 대시보드 |
| sales | 실습 4 | 15:00~17:00 | 버티컬 수주, 고객 제안 PPT 생성·공유 |
| dev | 도입 | 08:00~10:00 | 바이브코딩 이해, 엔지니어링 AI CLI 설치·조작 |
| dev | 실습 1 | 10:00~11:00 | 부품 스펙·도면·규격 조회 대시보드 |
| dev | 실습 2 | 11:00~12:00 | 공정 불량률·공차 이탈 자율 분석 |
| dev | 실습 3 | 13:00~14:00 | PPT Skill 연동, 표준 8D 보고서 자동화 |
| dev | 실습 4 | 14:00~16:00 | AX Studio 퍼블리시, 부서 공유·배포 |

문의는 한 데이터에서 관리한다. 신청 담당은 정보연 선임 `boyoun.jeong@lge.com`, 강사는 IDHRBP 하재선 책임 `jaesun.ha@lge.com`이다. 현재 담당 여부는 운영 확인 전이다. 확인된 신청 URL이 없어 신청 버튼은 만들지 않고 원본 러닝넷 검색명을 제공한다.

## 도구별 검토와 이관 결정

### VS Code — 일부 수정 후 이관

User Setup과 설치 후 새 터미널에서 PATH를 확인하는 흐름은 유지한다. 다운로드 진입점은 [공식 Windows 설치 안내](https://code.visualstudio.com/docs/setup/windows)를 사용한다. `code --version`, `code --install-extension <ID>`는 [공식 CLI 안내](https://code.visualstudio.com/docs/configure/command-line)를 기준으로 제공한다.

| 원본 확장 ID | 확인 결과 | 이관 결정 |
|---|---|---|
| `MS-CJKLM.vscode-language-pack-ko` | 이 ID의 항목을 도구에서 확인하지 못함. `MS-CEINTL.vscode-language-pack-ko`의 한국어 팩은 확인됨 | 확인된 `MS-CEINTL.vscode-language-pack-ko`로 교체. 원본 ID를 유효하지 않다고 단정하지는 않음 |
| `yzhang.markdown-all-in-one` | 배포자 설명 확인 | Markdown 편집 보조로 유지 |
| `ms-vscode.live-server` | 실제 표시명은 Live Preview | ID는 유지하고 이름을 Live Preview로 표시. 모든 프로젝트의 필수 서버로 설명하지 않음 |
| `bierner.markdown-mermaid` | 배포자가 VS Code 1.121에 통합되어 deprecated라고 안내 | 최신 VS Code에서는 별도 설치를 요구하지 않음. 구버전에는 조건부 설명 제공 |
| `yzane.markdown-pdf` | 배포자 설명 확인 | PDF 변환 실습에 사용할 확장으로 유지 |
| `tomoki1207.pdf` | 배포자 설명 확인 | PDF 열람 기능으로 유지 |

확장 출처: [한국어 팩](https://marketplace.visualstudio.com/items?itemName=MS-CEINTL.vscode-language-pack-ko), [Markdown All in One](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one), [Live Preview](https://marketplace.visualstudio.com/items?itemName=ms-vscode.live-server), [Mermaid](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid), [Markdown PDF](https://marketplace.visualstudio.com/items?itemName=yzane.markdown-pdf), [PDF 뷰어](https://marketplace.visualstudio.com/items?itemName=tomoki1207.pdf).

설치 후 언어 전환은 [공식 언어 설정 안내](https://code.visualstudio.com/docs/configure/locales)에 연결한다. 준비 체크는 계속 3개이며 마지막 체크는 “현재 VS Code 버전에 필요한 언어·실습 확장을 준비했다”로 의미를 보완한다. 내장된 기능 때문에 폐기된 확장의 설치를 강요하지 않는다. 원본의 체크 의미를 유지하므로 이전 인덱스는 바꾸지 않는다.

### Antigravity CLI — 공개 설치법 확인, 조직 허용은 미확인

원본 PowerShell 및 Bash 설치 명령, `agy --version`은 [공식 Quickstart](https://antigravity.google/docs/getting-started?tab=cli)와 일치한다. 복사 가능한 설치 안내로 이관하되 “공식 문서 확인”과 “사내 사용 승인”을 구분한다.

로그인 문구는 “실행하면 항상 브라우저가 열려 Google 로그인만 하면 완료”에서 보완한다. 저장된 자격 증명이 있으면 조용히 인증할 수 있고, 없으면 승인된 개인 또는 비즈니스 계정 인증을 진행한다. [공식 인증 안내](https://antigravity.google/docs/install?tab=cli).

사내 사용 가능 여부·허용 계정은 공개 출처로 확인할 수 없다. 카드에 조직 정책에 따라 도구와 계정을 선택하도록 표시한다. 미확인 사내 승인을 완료된 사실로 쓰지 않는다. Antigravity 3개 체크와 Codex 4개 체크는 독립 유지한다.

### Python — 설치 방식별 안내 분리

원본의 “Add python.exe to PATH”는 [Python 3.12 전통적 설치 프로그램](https://docs.python.org/3.12/using/windows.html)에 해당한다. 현재 [Windows 공식 안내](https://docs.python.org/3/using/windows.html)는 Python install manager도 설명한다. 하나의 화면·체크박스가 모든 설치 방식에 있다고 안내하지 않는다.

교육 기준 버전은 원본의 3.11~3.12 범위를 보존한다. app4 서버의 pyproject/uv 환경은 3.12 요구 조건을 별도로 설명한다. 최신 다운로드 버튼이 교육 버전을 설치한다고 보장하지 않는다. install manager를 쓰면 공식 설치 문법으로 원하는 버전을 지정하고, 구형 launcher와 manager 차이를 구분한다. 다운로드 가능한 세부 패치·배포 채널은 설치 시 공식 페이지에서 확인하도록 한다.

`python --version`과 출력 명령 확인은 유지한다. `python -m pip install --upgrade pip`는 준비 완료 필수 조건에서 제외하고 필요할 때의 패키지 관리 설명에 둔다. 실행 별칭은 설치 방식과 실제 실행 경로를 확인한 뒤 점검하게 하며, 무조건 모든 Python 별칭을 끄라고 안내하지 않는다. 새 manager는 별칭 활성화가 필요한 경우가 있기 때문이다. 준비 체크는 PATH/실행 경로 준비, 버전 확인, 첫 출력 3개를 유지한다.

### Git — 역할·인증서·설치 옵션 문구 수정

Windows 다운로드는 [공식 설치 페이지](https://git-scm.com/install/windows)로 연결한다. 원본 구 링크보다 현재 안내 페이지를 우선한다. Git은 버전 관리와 코드 전달 도구로 설명하고 Git 자체가 DEJ Publish를 수행한다고 안내하지 않는다.

`git --version`, `git config --global user.name`, `git config --global user.email`은 [공식 최초 설정 안내](https://git-scm.com/book/en/v2/Getting-Started-First-Time-Git-Setup)를 기준으로 유지한다. 이름과 이메일은 예시를 본인 값으로 바꾸도록 한다. `core.quotepath false`는 경로 표시 방식에 관한 선택 설정으로 두고 “한글 인코딩을 고친다”는 표현을 쓰지 않는다. [설정 레퍼런스](https://git-scm.com/docs/git-config).

인증서 검증을 끄는 원본 안내는 이관하지 않는다. 사내 배포된 신뢰 인증서·프록시·TLS backend 구성을 지원 담당자에게 확인하도록 한다. 인증서 경로와 프록시 값을 추정해 설정하는 명령도 제공하지 않는다. Git 공식 설정에는 CA 파일과 플랫폼별 TLS backend 옵션이 정의되어 있다. [TLS 설정](https://git-scm.com/docs/git-config#Documentation/git-config.txt-httpsslCAInfo).

편집기·PATH·줄바꿈 설치 옵션은 사용 환경별 권장사항으로 표현한다. Git 설치 버전마다 동일한 화면이 나온다고 보장하지 않는다. 비SW개발 또는 배포 예정자는 필수, 일반 영업은 선택이라는 교육 조건을 유지한다.

### Codex — 별도 공식 검토 기록

[Codex 원본과 공식 문서 대조 결과](codex-source-review.md)에 12개 주제, 설치·인증·명령·권한·설정·자동화·업데이트·문제 해결의 근거와 보정 사항을 기록한다. 전체 주제를 앱으로 이관하고 설치·인증·첫 실행을 먼저 보여준다. 인증 파일·키를 웹앱에 수집하거나 저장하지 않는다.

## 고정 체크 ID와 원본 매핑

| 원본 인덱스 | ID | 준비 상태 의미 |
|---:|---|---|
| 0 | `vscode.path` | 설치 후 실행 경로 준비 |
| 1 | `vscode.version` | 새 터미널에서 버전 확인 |
| 2 | `vscode.extensions` | 버전에 필요한 언어·실습 확장 준비 |
| 3 | `antigravity.installed` | 설치 완료 |
| 4 | `antigravity.version` | 버전 확인 |
| 5 | `antigravity.auth` | 허용된 계정으로 인증 확인 |
| 6 | `python.path` | 설치·실행 경로 준비 |
| 7 | `python.version` | 교육 기준 버전 확인 |
| 8 | `python.first-run` | 첫 출력 명령 확인 |
| 9 | `git.version` | 버전 확인 |
| 10 | `git.identity` | 이름·이메일 설정 |
| 11 | `git.vscode` | VS Code 소스 제어 인식 |
| 신규 | `codex.installed` | 한 가지 방식으로 설치 |
| 신규 | `codex.version` | 버전·도움말 확인 |
| 신규 | `codex.auth` | 허용된 인증 방식의 로그인 상태 확인 |
| 신규 | `codex.first-run` | 프로젝트에서 첫 설명 요청·결과 확인 |

체크 ID는 문구·순서가 바뀌어도 유지한다. 선택하지 않은 AI 도구도 읽을 수 있고 체크는 보존한다. 필수 준비율 분모는 일반 영업 9/10/13, dev 또는 배포 예정자 12/13/16이며, AI 도구 미선택이면 완료율을 제시하지 않는다. 현재 학습 진도와 103 해제 조건에는 합산하지 않는다.

## 미확인 항목과 구현 시 처리

| 미확인 항목 | 처리 |
|---|---|
| 교육 문의처의 현재 담당 여부·신규 회차·신청 URL | 원본 회차와 연락처 보존, 운영 확인 필요 표시. 새 모집·신청 버튼 생성하지 않음 |
| 사내 Antigravity·Codex 사용 승인 및 계정 권한 | 조직 정책 안내와 별개로 표시. 자동 설치·인증 시도하지 않음 |
| 실제 장비에서 설치 명령 성공·확장 실행·로그인 | 이번 단계에서는 미실행. 사용자가 직접 확인하는 체크로 유지 |
| 실 DEJ 환경에서 Publish 절차와 접근 권한 | 기존 배포 안내와 구분. 이번 단계에서 게시하지 않음 |
| Python 3.12 환경의 서버 회귀 | 0단계의 Python 3.13 HTTP 8개 통과와 별도. 실행 환경 마련 후 따로 기록 |

## 1단계 산출물과 다음 단계 경계

- `app4/docs/content-review.md`: 이 문서. 과정·도구·체크 매핑·확인 필요 항목과 app4 저장 규칙.
- `app4/docs/codex-source-review.md`: Codex 공식 문서 대조.
- `app4/docs/source-baseline.json`: app1 및 참조 원본의 파일별 SHA-256. 이후 app1 보존과 사본 비교 기준.

1단계에서는 문서만 작성한다. 화면·상태 저장·라우팅을 구현하지 않고, app1을 app4로 복사하는 작업도 아직 수행하지 않는다. 사용자가 “다음”이라고 하면 2단계인 app4 사본 생성과 과정 데이터 추가를 진행한다.

## 단계 종료 확인

- 원본의 실제 input 체크박스 12개, 이관 고정 ID 16개·중복 0개 확인. JavaScript 선택자 문자열을 실제 체크 개수로 세지 않았다.
- 양 과정의 시간표 10개 행, Codex 원본 12개 장 대응표 확인.
- 교육일 두 날짜의 월요일 여부 확인.
- app1 74개 및 참조·설계 4개, 총 78개 파일의 SHA-256 재검사에서 변경 0개.
- Codex 검토 문서의 상대 링크 대상 존재 확인.
- 이번 신규 파일은 docs의 검토 문서 2개와 원본 해시 JSON 1개뿐이다. 설치·로그인·앱 실행·기능 테스트는 이 단계에서 수행하지 않았다.
