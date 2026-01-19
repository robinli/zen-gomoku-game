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

# 服務檢查函數
function Test-ServiceReady {
    param(
        [string]$Url, 
        [int]$MaxRetries = 30, 
        [int]$IntervalSeconds = 1
    )
    
    $retries = 0
    while ($retries -lt $MaxRetries) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                return $true
            }
        }
        catch {
            # 忽略連接錯誤,繼續重試
        }
        Start-Sleep -Seconds $IntervalSeconds
        $retries++
    }
    throw "服務未在 $MaxRetries 秒內就緒: $Url"
}

# 清理函數 - 確保進程被關閉
function Stop-Services {
    Write-ColorOutput "`n🛑 正在停止服務..." "Yellow"
    
    # 停止 server
    if ($Global:serverProcess -and !$Global:serverProcess.HasExited) {
        Stop-Process -Id $Global:serverProcess.Id -Force -ErrorAction SilentlyContinue
        Write-ColorOutput "✓ Server 已停止" "Gray"
    }
    
    # 停止 client
    if ($Global:clientProcess -and !$Global:clientProcess.HasExited) {
        Stop-Process -Id $Global:clientProcess.Id -Force -ErrorAction SilentlyContinue
        Write-ColorOutput "✓ Client 已停止" "Gray"
    }
    
    # Windows 額外清理 (使用 taskkill 確保子進程也被清理)
    try {
        Start-Process "taskkill" -ArgumentList "/F /IM node.exe /FI `"WINDOWTITLE eq server*`"" -WindowStyle Hidden -ErrorAction SilentlyContinue | Out-Null
        Start-Process "taskkill" -ArgumentList "/F /IM node.exe /FI `"WINDOWTITLE eq client*`"" -WindowStyle Hidden -ErrorAction SilentlyContinue | Out-Null
    }
    catch {
        # 忽略錯誤
    }
}

# 註冊清理處理器
# PowerShell 的 trap 類似於 try/catch/finally 或 signal handling
$script:MyInvocation = $MyInvocation
trap {
    Stop-Services
    if ($_.Exception.Message -ne "quit") {
        Write-ColorOutput "`n❌ 腳本執行失敗: $($_.Exception.Message)" "Red"
        exit 1
    }
    continue
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

$currentBranch = (git branch --show-current).Trim()
Write-ColorOutput "當前分支: $currentBranch" "White"

if ($currentBranch -ne "dev") {
    Write-ColorOutput "⚠️  警告: 當前不在 dev 分支" "Yellow"
    Write-ColorOutput "❌ 請先切換到 dev 分支: git checkout dev" "Red"
    exit 1
}

# 檢查是否有未提交的更改
$status = git status --porcelain
if ($status) {
    Write-ColorOutput "⚠️  警告: 有未提交的更改:" "Yellow"
    Write-ColorOutput $status "Gray"
    Write-ColorOutput "❌ 請先提交或暫存更改" "Red"
    exit 1
}

Write-ColorOutput "✓ 分支檢查通過" "Green"

# ============================================
# 步驟 2: 停止現有服務
# ============================================
Write-Step "🛑 步驟 2: 停止現有服務"

Write-ColorOutput "檢查並停止正在運行的 server 和 client..." "White"

# 停止佔用 3000 端口的進程 (server)
try {
    # 類似 JS 的 platform check，這裡是 Windows 專用腳本所以直接用 cmd
    cmd /c "for /f ""tokens=5"" %a in ('netstat -aon ^| findstr :3000') do taskkill /F /PID %a" 2>$null | Out-Null
}
catch {}

# 停止佔用 5173 端口的進程 (client)
try {
    cmd /c "for /f ""tokens=5"" %a in ('netstat -aon ^| findstr :5173') do taskkill /F /PID %a" 2>$null | Out-Null
}
catch {}

Write-ColorOutput "✓ 已停止現有服務" "Green"

# 等待端口釋放
Start-Sleep -Seconds 2

# ============================================
# 步驟 3: Build Server
# ============================================
Write-Step "🔨 步驟 3: Build Server"

Write-ColorOutput "正在編譯 TypeScript..." "White"

try {
    Set-Location "$rootDir\server"
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Build 失敗" }
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

Write-ColorOutput "正在編譯 TypeScript 和打包 Vite..." "White"

try {
    Set-Location "$rootDir\client"
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Build 失敗" }
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

Write-ColorOutput "正在啟動 server (http://localhost:3000)..." "White"

Set-Location "$rootDir\server"
# 使用 Start-Process 啟動，注意這裡無法像 JS 那樣方便地 pipe stdout 到主窗口，
# 但我們移除 -WindowStyle Hidden 讓它在變量中或者簡單後台運行。
# 為了對齊 JS 行為 (pipe output)，在 PS 中比較困難，我們這裡選擇後台運行但保留可用性。
$Global:serverProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -WindowStyle Minimized

# 等待 server 就緒
try {
    Test-ServiceReady -Url "http://localhost:3000/health"
    Write-ColorOutput "等待 Socket.IO 完全初始化..." "White"
    Start-Sleep -Seconds 3
    Write-ColorOutput "✓ Server 已啟動 (PID: $($Global:serverProcess.Id))" "Green"
}
catch {
    Write-ColorOutput "❌ Server 啟動失敗或超時" "Red"
    Stop-Services
    exit 1
}

# ============================================
# 步驟 6: 啟動 Client
# ============================================
Write-Step "🌐 步驟 6: 啟動 Client"

Write-ColorOutput "正在啟動 client (http://localhost:5173)..." "White"

Set-Location "$rootDir\client"
$Global:clientProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -WindowStyle Minimized

# 等待 client 就緒
try {
    Test-ServiceReady -Url "http://localhost:5173"
    Write-ColorOutput "等待 Vite 完成編譯和 HMR 準備..." "White"
    Start-Sleep -Seconds 5
    Write-ColorOutput "✓ Client 已啟動 (PID: $($Global:clientProcess.Id))" "Green"
}
catch {
    Write-ColorOutput "❌ Client 啟動失敗或超時" "Red"
    Stop-Services
    exit 1
}

# ============================================
# 步驟 7: 執行 E2E 測試
# ============================================
Write-Step "🧪 步驟 7: 執行 E2E 測試"

Write-ColorOutput "正在執行所有 E2E 測試案例..." "White"

Set-Location "$rootDir\client"
# 注意: JS 使用 execSync ('inherit')，所以在 PS 中直接運行命令即可顯示輸出
try {
    cmd /c "npx playwright test --headed"
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "✓ 所有測試通過!" "Green"
    }
    else {
        throw "測試失敗"
    }
}
catch {
    Write-ColorOutput "❌ E2E 測試失敗,中止合併流程" "Red"
    Write-ColorOutput "查看測試報告: npx playwright show-report" "Yellow"
    Stop-Services
    exit 1
}

# ============================================
# 步驟 8: 停止服務
# ============================================
Write-Step "🛑 步驟 8: 停止服務"
Stop-Services
Write-ColorOutput "✓ 所有服務已停止" "Green"

# ============================================
# 步驟 9: 合併分支
# ============================================
Write-Step "🔀 步驟 9: 合併 dev 到 main"

Set-Location $rootDir

Write-ColorOutput "切換到 main 分支..." "White"
git checkout main

Write-ColorOutput "合併 dev 分支..." "White"
try {
    git merge dev --no-ff -m "chore: auto-merge dev to main after E2E tests passed"
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "✓ 合併成功" "Green"
    }
    else {
        throw "合併失敗"
    }
}
catch {
    Write-ColorOutput "❌ 合併失敗,可能有衝突需要手動解決" "Red"
    exit 1
}

# ============================================
# 步驟 10: 推送到 GitHub
# ============================================
Write-Step "📤 步驟 10: 推送到 GitHub"

Write-ColorOutput "推送 main 分支到 GitHub..." "White"
try {
    git push origin main
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "✓ 推送成功" "Green"
    }
    else {
        throw "推送失敗"
    }
}
catch {
    Write-ColorOutput "❌ 推送失敗" "Red"
    exit 1
}

# 切回 dev 分支
Write-ColorOutput "切回 dev 分支..." "White"
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
