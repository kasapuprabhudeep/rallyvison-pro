Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Starting RallyVision AI (Backend + Frontend)" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

# 1. Start Backend in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

# 2. Wait 2 seconds
Start-Sleep -Seconds 2

# 3. Start Frontend in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

# 4. Wait 3 seconds and launch browser
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"

Write-Host "Both Backend and Frontend are running in dedicated terminal windows!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Yellow

