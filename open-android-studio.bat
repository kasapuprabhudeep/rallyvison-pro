@echo off
echo ========================================================
echo  Opening RallyVision Pro in Android Studio
echo ========================================================
echo.

cd /d "%~dp0frontend"
call npx cap open android

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [NOTE] If Android Studio did not open automatically:
    echo 1. Download Android Studio from: https://developer.android.com/studio
    echo 2. Open Android Studio and select 'Open an Existing Project'
    echo 3. Navigate to and select folder: %~dp0frontend\android
    echo.
)
pause
