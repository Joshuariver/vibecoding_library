// 준비 콘텐츠와 계산만 제공한다. 설치 명령 실행·저장·화면 처리는 하지 않는다.
window.VCL = window.VCL || {};
(function () {
  'use strict';
  const aiToolIds = ['antigravity', 'codex'];
  // ref_app의 체크박스 DOM 순서. 도구 표시 순서와 독립적으로 유지한다.
  const legacyCheckIds = [
    'vscode.path', 'vscode.version', 'vscode.extensions',
    'antigravity.installed', 'antigravity.version', 'antigravity.auth',
    'python.path', 'python.version', 'python.first-run',
    'git.version', 'git.identity', 'git.vscode'
  ];
  const tools = [
    {
      id: 'vscode', title: 'VS Code', requiredFor: 'all',
      reason: '프로젝트 파일을 열고 편집하며, 터미널과 미리보기로 AI가 만든 결과를 확인합니다.',
      sourcePath: 'ref_app/course_guide.html#step-vscode',
      step: "STEP 1", stepTitle: "Visual Studio Code (VS Code) 설치", timeTag: "소요 시간: 약 5~10분", checklistTitle: "VS Code 준비 완료 체크리스트",
      checks: [
        { id: "vscode.path", label: "User Setup 설치 시 'PATH에 추가' 옵션을 체크하고 설치 완료함" },
        { id: "vscode.version", label: "터미널에서 `code --version` 실행 시 버전이 정상 출력됨" },
        { id: "vscode.extensions", label: "한국어 언어팩 및 마크다운/HTML 필수 확장을 설치함" }
      ],
      installMethods: [], sections: [],
      blocks: [
        {
          "type": "overview",
          "text": "**Visual Studio Code**는 AI(Antigravity CLI)가 만들어 주는 코드와 파일을 눈으로 직접 확인하고 편집하는 작업 화면(에디터)입니다."
        },
        {
          "type": "callout",
          "kind": "info",
          "icon": "💡",
          "text": "**회사 PC 권장 설치 방식: User Setup**\n관리자(Admin) 권한이 없어도 `%LOCALAPPDATA%` 경로에 안전하게 설치되며 자동 업데이트를 지원합니다."
        },
        {
          "type": "heading",
          "text": "1. 공식 다운로드 및 설치"
        },
        {
          "type": "text",
          "text": "공식 사이트에서 다운로드 후 실행합니다:\n[VS Code User Setup 다운로드 (Windows)](https://go.microsoft.com/fwlink/?LinkID=534107)"
        },
        {
          "type": "callout",
          "kind": "warning",
          "icon": "⚠️",
          "text": "**설치 마법사 실행 시 필수 체크 항목!**\n[추가 작업 선택] 화면에서 **\"PATH에 추가 (다시 시작한 후 사용 가능)\"** 옵션을 반드시 체크해야 터미널에서 `code .` 명령어를 바로 사용할 수 있습니다."
        },
        {
          "type": "heading",
          "text": "2. 한국어 팩 및 필수 확장(Extension) 원클릭 설치"
        },
        {
          "type": "text",
          "text": "새로 연 PowerShell 터미널에 아래 명령어를 복사하여 붙여넣으면 한글 언어팩과 AI 실습에 필요한 핵심 확장이 일괄 설치됩니다."
        },
        {
          "type": "code",
          "label": "PowerShell (필수 확장 일괄 설치)",
          "code": "code --install-extension MS-CEINTL.vscode-language-pack-ko\ncode --install-extension yzhang.markdown-all-in-one\ncode --install-extension ms-vscode.live-server\ncode --install-extension bierner.markdown-mermaid\ncode --install-extension yzane.markdown-pdf\ncode --install-extension tomoki1207.pdf"
        }
      ],
      sources: []
    },
    {
      id: 'antigravity', title: 'Antigravity CLI', requiredFor: 'selected-ai',
      reason: '터미널에서 자연어로 프로젝트를 조사하고 코드를 작성·수정하는 AI 도구입니다.',
      sourcePath: 'ref_app/course_guide.html#step-antigravity',
      step: "STEP 2", stepTitle: "Antigravity CLI (agy) 설치", timeTag: "소요 시간: 약 10~15분", checklistTitle: "Antigravity CLI 준비 완료 체크리스트",
      checks: [
        { id: "antigravity.installed", label: "원클릭 설치 스크립트 실행을 완료함" },
        { id: "antigravity.version", label: "새 터미널에서 `agy --version` 으로 버전이 정상 출력됨" },
        { id: "antigravity.auth", label: "`agy` 실행 후 브라우저 Google 계정 로그인을 완료함" }
      ],
      installMethods: [], sections: [],
      blocks: [
        {
          "type": "overview",
          "text": "**Antigravity CLI**는 터미널에서 AI 에이전트와 자연어로 대화하며 프로그램 코드를 생성하고 자율 디버깅을 수행하는 본 교육의 핵심 도구입니다."
        },
        {
          "type": "heading",
          "text": "1. 운영체제별 원클릭 설치 명령어"
        },
        {
          "type": "text",
          "text": "PowerShell(Windows) 또는 터미널(macOS) 창에 아래 명령어를 복사 후 Enter를 누르세요."
        },
        {
          "type": "code",
          "label": "Windows (PowerShell)",
          "code": "irm https://antigravity.google/cli/install.ps1 | iex"
        },
        {
          "type": "code",
          "label": "macOS / Linux",
          "code": "curl -fsSL https://antigravity.google/cli/install.sh | bash"
        },
        {
          "type": "heading",
          "text": "2. 설치 확인 및 최초 Google 로그인"
        },
        {
          "type": "text",
          "text": "열려 있는 터미널을 완전히 닫고 **새 터미널**을 연 후 실행합니다."
        },
        {
          "type": "code",
          "label": "터미널 (실행 및 로그인)",
          "code": "agy --version\nagy"
        },
        {
          "type": "callout",
          "kind": "success",
          "icon": "🎉",
          "text": "`agy`를 입력하면 웹 브라우저가 자동으로 열립니다. Google 계정으로 로그인하고 [허용/Allow]을 누르면 즉시 연동 완료됩니다!"
        }
      ],
      sources: []
    },
    {
      id: 'codex', title: 'Codex CLI', requiredFor: 'selected-ai',
      reason: '프로젝트 파일을 읽고 코드를 수정하며 개발 명령을 실행하는 코딩 에이전트입니다. 설명·오류 수정·기능 구현·리뷰와 반복 작업에 활용합니다.',
      sourcePath: 'ref_mds/Codex_CLI_설치_사용_가이드.md', originalReviewedAt: '2026-10-30',
      policyNotice: '한 가지 설치 방식을 선택하세요. 계정·조직 정책에 따라 사용 가능 기능이 달라집니다. 웹앱에는 키와 인증 파일을 입력하거나 저장하지 않습니다.',
      checks: [
        { id: 'codex.installed', label: '선택한 한 가지 방식으로 설치를 마쳤다.' },
        { id: 'codex.version', label: '새 터미널에서 버전과 도움말을 확인했다.' },
        { id: 'codex.auth', label: '허용된 인증 방식으로 로그인 상태를 확인했다.' },
        { id: 'codex.first-run', label: '프로젝트 폴더에서 첫 설명 요청을 보내고 결과를 확인했다.' }
      ],
      installMethods: [
        { id: 'windows-script', label: 'Windows 공식 스크립트', platforms: ['windows'], requires: [], text: '새 PowerShell에서 실행합니다. 회사의 설치 정책을 따르세요.', language: 'powershell', code: 'powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"', updateCode: 'powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"' },
        { id: 'unix-script', label: 'macOS / Linux 공식 스크립트', platforms: ['macos', 'linux'], requires: [], text: '설치 후 새 터미널에서 확인합니다.', language: 'bash', code: 'curl -fsSL https://chatgpt.com/codex/install.sh | sh', updateCode: 'curl -fsSL https://chatgpt.com/codex/install.sh | sh' },
        { id: 'npm', label: 'npm', platforms: ['windows', 'macos', 'linux'], requires: ['node', 'npm'], text: '이 방식을 선택한 경우에만 Node.js와 npm을 먼저 준비합니다. 브라우저에서 "Node.js download"를 검색해 nodejs.org에서 LTS 설치 프로그램을 받아 기본값으로 설치하고, 새 터미널에서 아래 두 명령으로 버전이 나오는지 확인한 뒤 설치 명령을 실행하세요.', language: 'shell', prerequisiteCode: 'node --version\nnpm --version', code: 'npm install -g @openai/codex', updateCode: 'npm install -g @openai/codex' },
        { id: 'homebrew', label: 'macOS Homebrew', platforms: ['macos'], requires: ['homebrew'], text: 'Homebrew가 준비된 macOS 환경에서 선택합니다.', language: 'bash', code: 'brew install --cask codex', updateCode: 'brew upgrade --cask codex' }
      ],
      sections: [
        { id: 'verify', title: '버전과 도움말', text: '설치 후 새 터미널에서 확인하세요. 프로젝트의 런타임·테스트 도구는 해당 프로젝트에 맞게 별도로 준비합니다.', commands: [{ language: 'shell', code: 'codex --version\ncodex --help' }] },
        {
          id: 'auth', title: '로그인과 인증 방식',
          text: 'ChatGPT 로그인은 계정·워크스페이스 권한과 한도가 적용됩니다. API 키 인증은 OpenAI Platform의 별도 API 과금이 적용됩니다. 기기 코드 인증은 계정 또는 관리자 허용이 필요한 beta 기능입니다. 실제 인증은 터미널·공식 로그인 화면에서 진행하세요.',
          authMethods: [
            { id: 'chatgpt', title: 'ChatGPT 계정', text: 'ChatGPT 계정으로 로그인합니다. 구독·워크스페이스의 접근 권한과 사용 한도가 적용됩니다. 브라우저 로그인 후 터미널에서 상태를 확인하세요.', commands: [
              { label: '로그인', language: 'shell', code: 'codex login' },
              { label: '로그인 상태 확인', language: 'shell', code: 'codex login status' }
            ] },
            { id: 'device', title: '기기 코드 (허용된 경우)', text: '브라우저 연결이 어려울 때 검토하는 beta 인증 방식입니다. 개인 계정 보안 설정 또는 워크스페이스 관리자가 허용해야 합니다. 터미널에 나온 공식 링크에서 로그인하고 일회용 코드를 입력하세요.', commands: [
              { label: '기기 코드 로그인', language: 'shell', code: 'codex login --device-auth' },
              { label: '로그인 상태 확인', language: 'shell', code: 'codex login status' }
            ] },
            { id: 'api', title: 'OpenAI API 키', text: 'API 사용량 과금은 ChatGPT 구독과 별도입니다. 허용된 API 키가 OPENAI_API_KEY 환경 변수에 안전하게 준비된 경우에만 OS에 맞는 명령을 선택합니다. 키를 이 웹앱·소스 코드·프롬프트에 입력하지 마세요.', commands: [
              { label: 'Windows PowerShell', language: 'powershell', code: '$env:OPENAI_API_KEY | codex login --with-api-key' },
              { label: 'macOS / Linux', language: 'bash', code: 'printenv OPENAI_API_KEY | codex login --with-api-key' },
              { label: '로그인 상태 확인', language: 'shell', code: 'codex login status' }
            ] }
          ],
          logout: { label: '필요할 때 로그아웃', language: 'shell', code: 'codex logout' },
          note: '인증은 OS 자격증명 저장소 등을 사용할 수 있습니다. 파일 기반일 때 ~/.codex/auth.json이 사용될 수 있으며, 키·인증 파일은 공유하거나 커밋하지 않습니다.'
        },
        {
          id: 'first-run', title: '첫 설명 요청',
          text: '경로는 실제 프로젝트로 바꾸세요. 신뢰 여부는 프로젝트 출처를 확인한 뒤 결정합니다. 먼저 파일을 읽고 설명만 요청한 뒤 결과를 확인하세요.',
          commands: [
            { label: 'Windows에서 시작', language: 'powershell', code: "Set-Location -LiteralPath 'C:\\work\\my-project'\ncodex" },
            { label: 'macOS / Linux에서 시작', language: 'bash', code: 'cd ~/work/my-project\ncodex' },
            { label: 'Codex 입력창에 넣을 교육용 예시', language: 'text', code: '이 프로젝트의 목적, 주요 폴더, 실행 방법과 테스트 방법을 설명해줘.\n먼저 파일을 읽고 설명만 해줘.' }
          ]
        },
        {
          id: 'usage', title: '터미널 명령과 내부 명령',
          text: 'codex 명령은 터미널, /로 시작하는 명령은 실행 중인 Codex 입력창에 입력합니다. resume --last는 현재 작업 폴더의 최근 세션, --search는 실시간 웹 검색입니다. @로 프로젝트 파일을 찾아 요청에 포함할 수 있습니다.',
          commandGroups: [
            { title: '터미널에서 실행', context: '터미널', items: [
              { code: 'codex', description: '대화형 세션 시작' },
              { code: 'codex "이 프로젝트의 구조를 설명해줘"', description: '첫 요청과 함께 시작' },
              { code: 'codex resume', description: '이전 세션 선택' },
              { code: 'codex resume --last', description: '현재 작업 폴더의 최근 세션 재개' },
              { code: 'codex --search', description: '실시간 웹 검색을 사용하는 세션 시작' },
              { code: 'codex resume --help', description: '세션 재개 옵션 확인' }
            ] },
            { title: '실행 중인 Codex 입력창', context: 'Codex 입력창', items: [
              { code: '/status', description: '세션 상태와 설정 확인' },
              { code: '/model', description: '사용 가능한 모델·추론 수준 선택' },
              { code: '/permissions', description: '허용 작업과 권한 확인·변경' },
              { code: '/review', description: '코드 변경 리뷰' },
              { code: '/init', description: 'AGENTS.md 초안 생성' },
              { code: '/exit', description: '세션 종료' }
            ] }
          ]
        },
        {
          id: 'review', title: '수정 요청과 결과 확인',
          text: '요청에 목표·관련 파일·유지할 동작·검증 방법을 포함하세요. 수정 전 미커밋 상태를 확인하고 필요한 백업을 남깁니다. 결과는 프로젝트 테스트·린트·빌드로 검토하고 실행하지 못한 검사를 구분하세요. Git 검토는 Git 사용 프로젝트에서 수행하며 Codex 첫 실행의 필수 조건은 아닙니다.',
          commands: [
            { label: '교육용 수정 요청', language: 'text', code: 'CSV를 읽을 때 한글이 깨지는 문제를 수정해줘.\n관련 파일과 기존 인코딩 처리부터 확인하고 필요한 부분을 수정해줘.\n기존 CSV 읽기 테스트를 실행하고 변경 내용과 결과를 한국어로 설명해줘.' },
            { label: 'Git 프로젝트의 변경 확인', language: 'shell', code: 'git status\ngit diff' }
          ]
        },
        {
          id: 'permissions', title: '샌드박스와 승인',
          text: '샌드박스는 접근 범위, 승인 정책은 추가 권한 요청 방식을 정합니다. /status와 /permissions로 현재 설정을 확인하세요. workspace-write가 외부 경로나 네트워크를 무제한 허용하지는 않습니다. 추가 폴더는 --add-dir 도움말을 확인합니다. 조직 정책은 개인 설정을 제한할 수 있습니다.',
          commands: [
            { label: '읽기 전용으로 시작하는 예시', language: 'shell', code: 'codex --sandbox read-only' },
            { label: '작업 폴더 수정·필요시 승인 예시', language: 'shell', code: 'codex --sandbox workspace-write --ask-for-approval on-request' }
          ],
          note: 'Windows 네이티브 샌드박스를 지원하며 WSL이 필수는 아닙니다. 현재 공식 문서의 MXC 권장 및 elevated/unelevated 대체 방식은 장비·조직 정책에 따라 확인하세요.'
        },
        {
          id: 'agents', title: '프로젝트 규칙: AGENTS.md',
          text: '전역 지침부터 프로젝트 경로의 지침을 읽고 가까운 하위 지침이 앞선 지침을 구체화합니다. 프로젝트 루트를 찾지 못하면 현재 폴더 기준으로 탐색합니다. /init 초안을 검토하고 지침 변경 후 새 세션으로 반영을 확인하세요.',
          commands: [{ language: 'markdown', code: '# 프로젝트 작업 지침\n\n- 설명과 작업 결과는 한국어로 작성한다.\n- 기존 코드 스타일을 따른다.\n- 요청한 변경에 필요한 파일을 중심으로 수정한다.\n- 실행 및 테스트 명령은 README.md를 확인한다.\n- 동작을 변경하면 관련 테스트를 실행한다.\n- 실행하지 못한 검사는 이유를 보고한다.\n- API 키와 인증 파일은 커밋하지 않는다.' }]
        },
        {
          id: 'config', title: '개인 설정: config.toml',
          text: '기본 개인 설정은 ~/.codex/config.toml입니다. CODEX_HOME을 지정했다면 해당 경로를 사용합니다. 신뢰한 프로젝트의 .codex/config.toml도 적용됩니다. 기존 키를 중복 선언하지 마세요. CLI 옵션이 기본값보다 우선해도 관리자 강제 정책을 우회할 수 없습니다.',
          commands: [{ language: 'toml', code: 'approval_policy = "on-request"\nsandbox_mode = "workspace-write"' }]
        },
        {
          id: 'automation', title: '반복 작업: codex exec',
          text: '비대화형 실행의 기본 샌드박스는 읽기 전용입니다. 수정이 필요하면 범위를 명시합니다. 일반 출력은 진행 상황이 stderr, 최종 답변이 stdout입니다. --json은 stdout에 JSONL 이벤트를 출력하므로 최종 답변 파일과 구분하세요. --full-auto는 현재 지원하지 않습니다.',
          commands: [
            { label: '구조 요약 예시', language: 'shell', code: 'codex exec "프로젝트 구조와 주요 진입점을 요약해줘"' },
            { label: '작업 폴더 수정 예시', language: 'shell', code: 'codex exec --sandbox workspace-write "README의 실행 방법을 실제 코드에 맞게 수정해줘"' },
            { label: 'PowerShell 최종 답변 저장', language: 'powershell', code: 'codex exec "최근 커밋을 요약해 릴리스 노트 초안을 작성해줘" | Set-Content -LiteralPath \'.\\release-notes.md\' -Encoding UTF8' },
            { label: 'JSONL 이벤트', language: 'shell', code: 'codex exec --json "프로젝트 구조를 요약해줘"' }
          ]
        },
        { id: 'updates', title: '설치 방식에 맞춰 업데이트', text: '처음 선택한 설치 방식의 업데이트 명령을 사용한 뒤 새 터미널에서 codex --version을 확인합니다. 설치 방법을 중복해서 추가하지 마세요.' },
        {
          id: 'troubleshooting', title: 'PATH·PowerShell·인증·권한 문제 해결',
          text: '아래는 점검 제안이며 모든 환경의 해결을 보장하지 않습니다. 오류 메시지와 공식 문서를 함께 확인하세요.',
          troubleshooting: [
            { symptom: 'codex를 찾을 수 없거나 업데이트 후 이전 버전이 실행됨', resolution: '새 터미널에서 실행 경로와 중복 설치의 PATH 우선순위를 확인하세요.', language: 'powershell', code: 'Get-Command codex -All' },
            { symptom: 'npm.ps1 실행 차단', resolution: 'npm 설치 방식을 사용하는 경우에만 조직 정책 안에서 npm.cmd 실행을 확인하세요.', language: 'powershell', code: 'npm.cmd install -g @openai/codex' },
            { symptom: 'npm 설치판 codex.ps1 실행 차단', resolution: 'npm 방식에서 codex.cmd 실행을 확인하세요.', language: 'powershell', code: 'codex.cmd --version' },
            { symptom: '브라우저 인증 후 터미널이 진행되지 않음', resolution: '계정·관리자 허용을 확인하고 허용된 환경에서 기기 코드 인증을 검토하세요.' },
            { symptom: '로그인했지만 사용 제한', resolution: 'codex login status로 인증 방식과 계정·워크스페이스 권한·한도를 확인하세요.' },
            { symptom: '파일 수정·명령 실행 거부', resolution: '/permissions, 작업 폴더, 조직 정책과 샌드박스 범위를 확인하세요.' },
            { symptom: '테스트 실패', resolution: '프로젝트 런타임·의존성·환경 변수와 README의 실행 방법을 확인하세요.' },
            { symptom: '사내 인증서·프록시 오류', resolution: '조직이 제공하는 CA·프록시 설정을 지원 담당자에게 확인하세요. 인증서 검증을 해제하지 않습니다.' }
          ]
        }
      ],
      sources: [
        { title: 'CLI 설치·시작', url: 'https://learn.chatgpt.com/docs/codex/cli' },
        { title: '명령어 레퍼런스', url: 'https://learn.chatgpt.com/docs/cli/reference' },
        { title: '내부 슬래시 명령', url: 'https://learn.chatgpt.com/docs/cli/slash-commands' },
        { title: '인증', url: 'https://learn.chatgpt.com/docs/auth' },
        { title: 'Windows 샌드박스', url: 'https://learn.chatgpt.com/docs/windows/windows-sandbox' },
        { title: 'AGENTS.md', url: 'https://learn.chatgpt.com/docs/agent-configuration/agents-md' },
        { title: '설정', url: 'https://learn.chatgpt.com/docs/config-file/config-basic' },
        { title: '비대화형 실행', url: 'https://learn.chatgpt.com/docs/non-interactive-mode' }
      ]
    },
    {
      id: 'python', title: 'Python', requiredFor: 'all',
      reason: '데이터 처리와 자동화 실습을 실행하는 언어입니다. 수강생 PC의 도구와 앱 서버 실행 환경은 구분합니다.',
      sourcePath: 'ref_app/course_guide.html#step-python',
      step: "STEP 3", stepTitle: "Python (파이썬) 설치", timeTag: "소요 시간: 약 10~15분", checklistTitle: "Python 준비 완료 체크리스트",
      checks: [
        { id: "python.path", label: "설치 시 'Add python.exe to PATH'에 체크하고 설치를 마침" },
        { id: "python.version", label: "새 터미널에서 `python --version` 으로 버전 3.11~3.12 확인됨" },
        { id: "python.first-run", label: "`python -c \"print('Hello, Vibe Coding!')\"` 실행 시 문구가 출력됨" }
      ],
      installMethods: [], sections: [],
      blocks: [
        {
          "type": "overview",
          "text": "**Python**은 수강생이 문법을 외우기 위한 것이 아니라, AI가 만들어 준 데이터 분석 및 엑셀 자동화 코드를 내 컴퓨터에서 작동시키는 **'실행 엔진'** 역할을 합니다."
        },
        {
          "type": "heading",
          "text": "1. 공식 인스톨러 다운로드"
        },
        {
          "type": "text",
          "text": "공식 웹사이트 접속:\n[Python 공식 다운로드 (Python 3.11 또는 3.12 권장)](https://www.python.org/downloads/)"
        },
        {
          "type": "callout",
          "kind": "warning",
          "icon": "⚠️",
          "text": "**[가장 중요] 첫 설치 화면 맨 아래 체크박스 필수 확인!**\n인스톨러 첫 화면 하단의 **[ Add python.exe to PATH ]** 체크박스에 반드시 체크 후 **[Install Now]**를 클릭해야 합니다. 체크하지 않으면 터미널에서 명령어가 인식되지 않습니다."
        },
        {
          "type": "heading",
          "text": "2. 정상 설치 1초 테스트 & pip 최신화"
        },
        {
          "type": "text",
          "text": "새 터미널을 열고 아래 명령어를 순서대로 실행하여 파이썬 런타임과 패키지 관리자가 정상 동작하는지 검증합니다."
        },
        {
          "type": "code",
          "label": "터미널 (버전 확인 & 1초 테스트)",
          "code": "python --version\npython -c \"print('Hello, Vibe Coding!')\"\npython -m pip install --upgrade pip"
        },
        {
          "type": "heading",
          "text": "💡 자주 겪는 문제 해결"
        },
        {
          "type": "faq",
          "q": "Q. 'python'을 입력했는데 마이크로소프트 스토어가 열립니다.",
          "a": "Windows 작업표시줄 검색창에 **\"앱 실행 별칭\"**을 검색하여 실행한 뒤, `python.exe` 및 `python3.exe` 항목의 스위치를 **[끔(Off)]**으로 변경하고 터미널을 재시작하세요."
        },
        {
          "type": "faq",
          "q": "Q. 'python은(는) 내부 또는 외부 명령... 이 아닙니다' 에러가 납니다.",
          "a": "설치 시 `Add python.exe to PATH`를 체크하지 않았을 때 발생합니다. 다운로드한 설치 파일을 다시 실행하여 **[Modify]**를 누르고 환경 변수 추가를 체크 후 다시 설치하세요."
        }
      ],
      sources: []
    },
    {
      id: 'git', title: 'Git', requiredFor: 'development-or-deploy',
      reason: '코드의 변경 이력을 관리하고 저장소를 통해 코드를 전달합니다. DEJ Publish 절차와는 구분합니다.',
      sourcePath: 'ref_app/course_guide.html#step-git',
      requirementNote: '배포 예정자는 필수, 그 외에는 선택입니다.',
      step: "STEP 4", stepTitle: "Git (깃) 설치", timeTag: "📌 DEJ 배포 예정자 필수 (그 외 선택)", checklistTitle: "Git 준비 완료 체크리스트",
      checks: [
        { id: "git.version", label: "새 터미널에서 `git --version` 으로 버전이 정상 출력됨" },
        { id: "git.identity", label: "`git config --global user.name` 및 `user.email` 등록을 마침" },
        { id: "git.vscode", label: "VS Code의 [소스 제어(Ctrl+Shift+G)] 메뉴에서 정상 인식됨" }
      ],
      installMethods: [], sections: [],
      blocks: [
        {
          "type": "overview",
          "text": "**Git**은 로컬 PC에서 AI와 함께 작성한 프로그램 코드와 설정을 사내 DEJ Workspace(서버)로 안전하게 올려서 배포(Publish)하기 위한 **'필수 전송 도구'**입니다. (DEJ 배포 예정자 필수)"
        },
        {
          "type": "heading",
          "text": "1. 다운로드 및 설치 핵심 3대 옵션"
        },
        {
          "type": "text",
          "text": "공식 다운로드 페이지:\n[Git for Windows 64-bit 다운로드](https://git-scm.com/download/win)"
        },
        {
          "type": "callout",
          "kind": "info",
          "icon": "💡",
          "text": "**설치 마법사 시 [Next] 누르며 주의할 3가지 화면:**\n1. **기본 편집기(Editor):** \"Use Visual Studio Code as Git's default editor\" 선택\n2. **PATH 환경변수:** \"Git from the command line and also from 3rd-party software\" 선택\n3. **줄바꿈(Line ending):** \"Checkout Windows-style, commit Unix-style line endings\" 선택"
        },
        {
          "type": "heading",
          "text": "2. 설치 확인 및 최초 1회 사용자 정보 등록"
        },
        {
          "type": "text",
          "text": "새 터미널을 열고 본인의 이름과 회사 이메일을 등록합니다. (사내 DEJ 서버 배포 시 필수)"
        },
        {
          "type": "code",
          "label": "PowerShell (사용자 등록 & 한글 깨짐 방지)",
          "code": "git --version\ngit config --global user.name \"홍길동\"\ngit config --global user.email \"gildong.hong@company.com\"\ngit config --global core.quotepath false"
        },
        {
          "type": "callout",
          "kind": "warning",
          "icon": "⚠️",
          "text": "**사내 보안망 SSL 인증서 에러 발생 시:**\n회사 네트워크(프록시)에서 `SSL certificate problem`이 발생하면 인증서 검증을 끄지 말고, 오류 메시지 전체를 복사해 교육 담당자 또는 IT 지원 부서에 사내 인증서 설정을 요청하세요."
        }
      ],
      sources: []
    }
  ];

  // 화면 순서는 원본 STEP 1~4(VS Code, Antigravity, Python, Git) 뒤에 Codex(선택 AI 도구)를 둔다.
  tools.push(tools.splice(tools.findIndex(tool => tool.id === 'codex'), 1)[0]);

  const objectOrEmpty = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  function selectedAiTools(options) {
    const selected = Array.isArray(options.aiTools) ? options.aiTools : [];
    return aiToolIds.filter(id => selected.includes(id));
  }
  function requiredCheckIds(value) {
    const options = objectOrEmpty(value);
    const selected = selectedAiTools(options);
    return tools.filter(tool => tool.requiredFor === 'all' ||
      (tool.requiredFor === 'selected-ai' && selected.includes(tool.id)) ||
      (tool.requiredFor === 'development-or-deploy' && options.deployPlanned === true)
    ).flatMap(tool => tool.checks.map(check => check.id));
  }
  function progress(value) {
    const options = objectOrEmpty(value), checks = objectOrEmpty(options.checks);
    const requiredIds = requiredCheckIds(options);
    const needsAiSelection = selectedAiTools(options).length === 0;
    const done = requiredIds.filter(id => Object.prototype.hasOwnProperty.call(checks, id) && checks[id] === true).length;
    const total = requiredIds.length;
    return { requiredIds, done, total, needsAiSelection,
      percent: needsAiSelection || !total ? null : Math.round(done / total * 100) };
  }

  window.VCL.setup = {
    reviewedAt: '2026-10-30', aiToolIds, legacyCheckIds, tools, requiredCheckIds, progress
  };
})();


