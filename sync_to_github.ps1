# ==============================================================================
# GitHub 동기화 자동화 스크립트 (PowerShell)
# 저장소: https://github.com/Joshuariver/vibecoding_library
# 사용법:
#   .\sync_to_github.ps1
#   .\sync_to_github.ps1 "feat: 새로운 기능 추가"
# ==============================================================================

param (
    [string]$CommitMessage = ""
)

$RepoUrl = "https://github.com/Joshuariver/vibecoding_library"
$Branch = "main"

# 1. Git 저장소 초기화 및 원격 연결 확인
if (-not (Test-Path ".git")) {
    Write-Host "[1/4] Git 저장소가 감지되지 않아 초기화합니다..." -ForegroundColor Cyan
    git init
    git branch -m $Branch
    git remote add origin $RepoUrl
    git fetch origin
} else {
    # 원격 origin 등록 여부 확인
    $remotes = git remote
    if ($remotes -notcontains "origin") {
        Write-Host "[1/4] 원격 저장소(origin)를 설정합니다..." -ForegroundColor Cyan
        git remote add origin $RepoUrl
    }
}

# 2. 변경 사항 확인
$status = git status --porcelain
if (-not $status) {
    Write-Host "커밋할 변경 사항이 없습니다. (Working tree clean)" -ForegroundColor Yellow
    exit 0
}

# 3. 변경 사항 스테이징
Write-Host "[2/4] 변경 사항을 스테이징합니다 (git add -A)..." -ForegroundColor Cyan
git add -A

# 4. 커밋 메시지 결정
if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
    # 대화형 환경인 경우 사용자에게 질문
    if ([Environment]::UserInteractive) {
        $inputMsg = Read-Host "커밋 메시지를 입력하세요 (Enter 입력 시 기본 메시지 사용)"
        if (-not [string]::IsNullOrWhiteSpace($inputMsg)) {
            $CommitMessage = $inputMsg
        }
    }
}

if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
    $now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $CommitMessage = "update: $now 동기화"
}

# 5. 커밋 생성
Write-Host "[3/4] 커밋을 생성합니다: '$CommitMessage'" -ForegroundColor Cyan
git commit -m "$CommitMessage"

# 6. 원격 저장소 푸시
Write-Host "[4/4] GitHub ($Branch 브랜치)로 푸시합니다..." -ForegroundColor Cyan
git push origin $Branch

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n동기화가 성공적으로 완료되었습니다!" -ForegroundColor Green
} else {
    Write-Host "`n푸시 중 오류가 발생했습니다. 네트워크 상태나 권한을 확인해주세요." -ForegroundColor Red
}
