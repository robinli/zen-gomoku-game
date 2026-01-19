<#
.SYNOPSIS
    自動化測試並合併 dev 分支到 main 分支

.DESCRIPTION
    此腳本會:
    1. 啟動 server 和 client
    2. 執行所有 E2E 測試
    3. 如果測試通過,將 dev 分支合併到 main
    4. 推送到 GitHub

.EXAMPLE
    .\scripts\auto-merge.ps1
#>

# 設定錯誤時停止
$ErrorActionPreference = "Stop"

# 顏色輸出函數
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# 步驟標題
function Write-Step {
    param([string]$Message)
    Write-ColorOutput "`n========================================" "Cyan"
    Write-ColorOutput $Message "Cyan"
    Write-ColorOutput "========================================" "Cyan"
}

# 清理函數 - 確保進程被關閉
function Stop-Services {
    Write-ColorOutput "`n🛑 正在停止服務..." "Yellow"
    
    # 停止 server
    if ($null -ne $serverProcess -and !$serverProcess.HasExited) {
        Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
        Write-ColorOutput "✓ Server 已停止" "Gray"
    }
    
    # 停止 client
    if ($null -ne $clientProcess -and !$clientProcess.HasExited) {
        Stop-Process -Id $clientProcess.Id -Force -ErrorAction SilentlyContinue
        Write-ColorOutput "✓ Client 已停止" "Gray"
    }
    
    # 額外清理:殺掉可能殘留的 node 進程
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*tsx watch*" -or $_.CommandLine -like "*vite*"
    } | Stop-Process -Force -ErrorAction SilentlyContinue
}

# 註冊清理處理器
trap {
    Stop-Services
    Write-ColorOutput "`n❌ 腳本執行失敗: $_" "Red"
    exit 1
}

# 主流程開始
$rootDir = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
Set-Location $rootDir

Write-ColorOutput @"
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║        🚀 自動化測試與合併流程                           ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
"@ "Magenta"

# ============================================
# 步驟 1: 檢查當前分支
# ============================================
Write-Step "📋 步驟 1: 檢查當前分支"

$currentBranch = git branch --show-current
Write-ColorOutput "當前分支: $currentBranch" "White"

if ($currentBranch -ne "dev") {
    Write-ColorOutput "⚠️  警告: 當前不在 dev 分支" "Yellow"
    $response = Read-Host "是否要切換到 dev 分支? (y/n)"
    if ($response -eq "y") {
        git checkout dev
        Write-ColorOutput "✓ 已切換到 dev 分支" "Green"
    }
    else {
        Write-ColorOutput "❌ 已取消操作" "Red"
        exit 1
    }
}

# 檢查是否有未提交的更改
$status = git status --porcelain
if ($status) {
    Write-ColorOutput "⚠️  警告: 有未提交的更改" "Yellow"
    Write-ColorOutput $status "Gray"
    $response = Read-Host "是否繼續? (y/n)"
    if ($response -ne "y") {
        Write-ColorOutput "❌ 已取消操作" "Red"
        exit 1
    }
}

# ============================================
# 步驟 2: 停止現有服務
# ============================================
Write-Step "🛑 步驟 2: 停止現有服務"

Write-ColorOutput "檢查並停止正在運行的 server 和 client..." "White"

# 停止佔用 3000 端口的進程 (server)
$serverPort = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($serverPort) {
    Stop-Process -Id $serverPort.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-ColorOutput "✓ 已停止 Server (Port 3000)" "Gray"
}

# 停止佔用 5173 端口的進程 (client)
$clientPort = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($clientPort) {
    Stop-Process -Id $clientPort.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-ColorOutput "✓ 已停止 Client (Port 5173)" "Gray"
}

if (!$serverPort -and !$clientPort) {
    Write-ColorOutput "ℹ️  沒有發現運行中的服務" "Gray"
}
else {
    Write-ColorOutput "✓ 已停止現有服務" "Green"
}

# 等待端口釋放
Start-Sleep -Seconds 2

# ============================================
# 步驟 3: Build Server
# ============================================
Write-Step "🔨 步驟 3: Build Server"

Set-Location "$rootDir\server"
Write-ColorOutput "正在編譯 TypeScript..." "White"

try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Build 失敗"
    }
    Write-ColorOutput "✓ Server build 完成" "Green"
}
catch {
    Write-ColorOutput "❌ Server build 失敗" "Red"
    exit 1
}

# ============================================
# 步驟 4: Build Client
# ============================================
Write-Step "🔨 步驟 4: Build Client"

Set-Location "$rootDir\client"
Write-ColorOutput "正在編譯 TypeScript 和打包 Vite..." "White"

try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Build 失敗"
    }
    Write-ColorOutput "✓ Client build 完成" "Green"
}
catch {
    Write-ColorOutput "❌ Client build 失敗" "Red"
    exit 1
}

# ============================================
# 步驟 5: 啟動 Server
# ============================================
Write-Step "🖥️  步驟 5: 啟動 Server"

Set-Location "$rootDir\server"

# 檢查 .env 文件是否存在
if (!(Test-Path ".env")) {
    Write-ColorOutput "⚠️  未找到 .env 文件，從 .env.example 複製..." "Yellow"
    Copy-Item ".env.example" ".env"
    Write-ColorOutput "✓ 已創建 .env 文件" "Green"
}

Write-ColorOutput "正在啟動 server (http://localhost:3000)..." "White"

$serverProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 3

if ($serverProcess.HasExited) {
    throw "Server 啟動失敗"
}

Write-ColorOutput "等待 Socket.IO 完全初始化..." "White"
Start-Sleep -Seconds 3

Write-ColorOutput "✓ Server 已啟動 (PID: $($serverProcess.Id))" "Green"


# ============================================
# 步驟 6: 啟動 Client
# ============================================
Write-Step "🌐 步驟 6: 啟動 Client"

Set-Location "$rootDir\client"

# 檢查 .env.local 文件是否存在
if (!(Test-Path ".env.local")) {
    Write-ColorOutput "⚠️  未找到 .env.local 文件，從 .env.example 複製..." "Yellow"
    Copy-Item ".env.example" ".env.local"
    Write-ColorOutput "✓ 已創建 .env.local 文件" "Green"
}

Write-ColorOutput "正在啟動 client (http://localhost:5173)..." "White"

$clientProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 5

if ($clientProcess.HasExited) {
    Stop-Services
    throw "Client 啟動失敗"
}

Write-ColorOutput "等待 Vite 完成編譯和 HMR 準備..." "White"
Start-Sleep -Seconds 5

Write-ColorOutput "✓ Client 已啟動 (PID: $($clientProcess.Id))" "Green"


# ============================================
# 步驟 7: 等待服務就緒
# ============================================
Write-Step "⏳ 步驟 7: 等待服務就緒"

Write-ColorOutput "等待服務完全啟動..." "White"
Start-Sleep -Seconds 5

# 簡單的健康檢查
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 5
    Write-ColorOutput "✓ Client 服務就緒" "Green"
}
catch {
    Stop-Services
    throw "Client 服務未就緒"
}

# ============================================
# 步驟 8: 執行 E2E 測試
# ============================================
Write-Step "🧪 步驟 8: 執行 E2E 測試"

Set-Location "$rootDir\client"
Write-ColorOutput "正在執行所有 E2E 測試案例..." "White"

try {
    npx playwright test --headed
    $testExitCode = $LASTEXITCODE
    
    if ($testExitCode -eq 0) {
        Write-ColorOutput "`n✅ 所有測試通過!" "Green"
    }
    else {
        throw "測試失敗 (Exit Code: $testExitCode)"
    }
}
catch {
    Stop-Services
    Write-ColorOutput "`n❌ E2E 測試失敗,中止合併流程" "Red"
    Write-ColorOutput "查看測試報告: npx playwright show-report" "Yellow"
    exit 1
}

# ============================================
# 步驟 9: 停止服務
# ============================================
Write-Step "🛑 步驟 9: 停止服務"
Stop-Services
Write-ColorOutput "✓ 所有服務已停止" "Green"

# ============================================
# 步驟 10: 合併分支
# ============================================
Write-Step "🔀 步驟 10: 合併 dev 到 main"

Set-Location $rootDir

Write-ColorOutput "切換到 main 分支..." "White"
git checkout main

Write-ColorOutput "合併 dev 分支..." "White"
try {
    git merge dev --no-ff -m "chore: auto-merge dev to main after E2E tests passed"
    Write-ColorOutput "✓ 合併成功" "Green"
}
catch {
    Write-ColorOutput "❌ 合併失敗,可能有衝突需要手動解決" "Red"
    exit 1
}

# ============================================
# 步驟 11: 推送到 GitHub
# ============================================
Write-Step "📤 步驟 11: 推送到 GitHub"

Write-ColorOutput "推送 main 分支到 GitHub..." "White"
try {
    git push origin main
    Write-ColorOutput "✓ 推送成功" "Green"
}
catch {
    Write-ColorOutput "❌ 推送失敗" "Red"
    exit 1
}

# 切回 dev 分支
Write-ColorOutput "`n切回 dev 分支..." "White"
git checkout dev

# ============================================
# 完成
# ============================================
Write-ColorOutput @"

╔══════════════════════════════════════════════════════════╗
║                                                          ║
║        ✅ 自動化流程完成!                                ║
║                                                          ║
║        所有測試通過,已成功合併並推送到 GitHub            ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝

"@ "Green"

Write-ColorOutput "📊 查看測試報告: npx playwright show-report" "Cyan"
Write-ColorOutput "🌐 GitHub: https://github.com/your-username/zen-gomoku-game" "Cyan"
