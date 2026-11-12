@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

REM ==============================================================================
REM GitHub 동기화 자동화 스크립트 (Windows 배치 파일)
REM 저장소: https://github.com/Joshuariver/vibecoding_library
REM 더블클릭 실행 또는 명령줄 실행 지원: sync_to_github.bat "커밋 메시지"
REM ==============================================================================

set "REPO_URL=https://github.com/Joshuariver/vibecoding_library"
set "BRANCH=main"

echo ========================================================
echo   GitHub 자동 동기화 도구 (vibecoding_library)
echo ========================================================
echo.

REM 1. Git 저장소 초기화 여부 확인
if not exist ".git" (
    echo [1/4] Git 저장소가 감지되지 않아 초기화합니다...
    git init
    git branch -m %BRANCH%
    git remote add origin %REPO_URL%
    git fetch origin
) else (
    git remote | findstr /r "^origin$" > nul
    if errorlevel 1 (
        echo [1/4] 원격 저장소(origin)를 설정합니다...
        git remote add origin %REPO_URL%
    )
)

REM 2. 변경 사항 확인
for /f %%i in ('git status --porcelain 2^>nul') do (
    set HAS_CHANGES=1
    goto :has_changes
)

echo [안내] 커밋할 변경 사항이 없습니다. (Working tree clean)
echo.
pause
exit /b 0

:has_changes
REM 3. 커밋 메시지 처리
set "COMMIT_MSG=%~1"

if "%COMMIT_MSG%"=="" (
    echo 커밋 메시지를 입력하세요 (그냥 Enter를 누르면 날짜/시간으로 자동 생성됩니다):
    set /p "INPUT_MSG=> "
    if not "!INPUT_MSG!"=="" (
        set "COMMIT_MSG=!INPUT_MSG!"
    )
)

if "%COMMIT_MSG%"=="" (
    set "COMMIT_MSG=update: %date% %time% 동기화"
)

REM 4. 변경 사항 스테이징
echo.
echo [2/4] 변경 사항을 스테이징합니다 (git add -A)...
git add -A

REM 5. 커밋 생성
echo.
echo [3/4] 커밋을 생성합니다: "!COMMIT_MSG!"
git commit -m "!COMMIT_MSG!"

REM 6. 원격 푸시
echo.
echo [4/4] GitHub (%BRANCH% 브랜치)로 푸시합니다...
git push origin %BRANCH%

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo   동기화가 성공적으로 완료되었습니다!
    echo ========================================================
) else (
    echo.
    echo [오류] 푸시 중 문제가 발생했습니다. 네트워크 또는 권한을 확인해주세요.
)

echo.
pause
