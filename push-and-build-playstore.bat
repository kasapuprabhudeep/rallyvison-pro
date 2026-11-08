@echo off
setlocal enabledelayedexpansion
cls
echo ========================================================
echo   RallyVision Pro - Automated Play Store Cloud Builder
echo ========================================================
echo.
echo This script pushes your project to GitHub, where GitHub's
echo cloud servers will automatically compile:
echo  1. The Google Play Store Bundle (app-release.aab)
echo  2. The Direct-Install Mobile APK (app-debug.apk)
echo.
echo ========================================================
echo.

git remote get-url origin >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%a in ('git remote get-url origin') do set CURRENT_REMOTE=%%a
    echo Current GitHub Remote: !CURRENT_REMOTE!
    echo.
    set /p CHANGE="Do you want to use this remote? (Y/N, default=Y): "
    if /i "!CHANGE!"=="N" (
        set /p REPO_URL="Enter your new GitHub repository URL: "
        git remote set-url origin !REPO_URL!
    )
) else (
    echo Please enter your GitHub Repository URL.
    echo (Example: https://github.com/YOUR_USERNAME/rallyvison-pro.git)
    echo.
    set /p REPO_URL="Repository URL: "
    if "!REPO_URL!"=="" (
        echo [ERROR] No URL entered. Aborting.
        pause
        exit /b 1
    )
    git remote add origin !REPO_URL!
)

echo.
echo [1/3] Checking branch status...
git branch -M main

echo [2/3] Staging any final updates...
git add .
git commit -m "chore: automated trigger for Play Store AAB and APK build" >nul 2>&1

echo [3/3] Pushing to GitHub to trigger automated cloud compilation...
echo.
git push -u origin main
if %ERRORLEVEL% NEQ 0 goto :failed

:success
echo.
echo ========================================================
echo   SUCCESS! Automated Play Store Cloud Build Triggered!
echo ========================================================
echo.
echo GitHub Actions is now compiling your Android package in the cloud.
echo.
echo Where to find your completed Play Store files:
echo 1. Open your GitHub repository in your browser:
echo    https://github.com/kasapuprabhudeep/rallyvison-pro
echo 2. Click the 'Actions' tab at the top.
echo 3. Click the workflow: 'Build Android Play Store App Bundle and APK'
echo 4. Under 'Artifacts', download:
echo    - rallyvision-pro-playstore-aab [Upload to Google Play Console]
echo    - rallyvision-pro-phone-apk     [Install directly on your phone]
echo.
goto :done

:failed
echo.
echo ========================================================
echo   [ERROR] Git push encountered an issue.
echo ========================================================
echo Please verify your GitHub URL and internet connection.
echo.

:done
pause
