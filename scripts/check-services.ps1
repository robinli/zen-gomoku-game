#!/usr/bin/env pwsh
<#
.SYNOPSIS
    檢查 Server 和 Client 是否正在運行

.DESCRIPTION
    快速檢查本地開發環境的服務狀態

.EXAMPLE
    .\scripts\check-services.ps1
#>

Write-Host "`n🔍 檢查服務狀態...`n" -ForegroundColor Cyan

# 檢查端口 3000 (Server)
Write-Host "📡 Server (Port 3000):" -ForegroundColor Yellow
$serverPort = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($serverPort) {
    $serverProcess = Get-Process -Id $serverPort.OwningProcess -ErrorAction SilentlyContinue
    Write-Host "  ✅ 運行中" -ForegroundColor Green
    Write-Host "  PID: $($serverProcess.Id)" -ForegroundColor Gray
    Write-Host "  進程: $($serverProcess.ProcessName)" -ForegroundColor Gray
    Write-Host "  啟動時間: $($serverProcess.StartTime)" -ForegroundColor Gray
    
    # 測試健康檢查
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:3000/health" -TimeoutSec 2
        Write-Host "  狀態: $($health.status)" -ForegroundColor Green
        Write-Host "  房間數: $($health.rooms)" -ForegroundColor Gray
    }
    catch {
        Write-Host "  ⚠️  健康檢查失敗" -ForegroundColor Yellow
    }
}
else {
    Write-Host "  ❌ 未運行" -ForegroundColor Red
}

Write-Host ""

# 檢查端口 5173 (Client)
Write-Host "🌐 Client (Port 5173):" -ForegroundColor Yellow
$clientPort = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue

if ($clientPort) {
    $clientProcess = Get-Process -Id $clientPort.OwningProcess -ErrorAction SilentlyContinue
    Write-Host "  ✅ 運行中" -ForegroundColor Green
    Write-Host "  PID: $($clientProcess.Id)" -ForegroundColor Gray
    Write-Host "  進程: $($clientProcess.ProcessName)" -ForegroundColor Gray
    Write-Host "  啟動時間: $($clientProcess.StartTime)" -ForegroundColor Gray
    Write-Host "  URL: http://localhost:5173" -ForegroundColor Cyan
}
else {
    Write-Host "  ❌ 未運行" -ForegroundColor Red
}

Write-Host ""

# 總結
if ($serverPort -and $clientPort) {
    Write-Host "✅ 所有服務正常運行" -ForegroundColor Green
}
elseif ($serverPort -or $clientPort) {
    Write-Host "⚠️  部分服務未運行" -ForegroundColor Yellow
}
else {
    Write-Host "❌ 所有服務都未運行" -ForegroundColor Red
    Write-Host "`n💡 啟動服務:" -ForegroundColor Cyan
    Write-Host "   Server: cd server && npm run dev" -ForegroundColor Gray
    Write-Host "   Client: cd client && npm run dev" -ForegroundColor Gray
}

Write-Host ""
