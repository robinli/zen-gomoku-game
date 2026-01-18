# 自動化腳本說明

本目錄包含用於自動化測試和部署的腳本。

## 📜 可用腳本

### 1. `auto-merge.ps1` (PowerShell)

**適用於:** Windows 系統

**功能:**
- 啟動 server 和 client 開發服務器
- 執行所有 E2E 測試案例
- 測試通過後,將 dev 分支合併到 main 分支
- 推送到 GitHub

**使用方式:**

```powershell
# 在專案根目錄執行
.\scripts\auto-merge.ps1
```

**注意事項:**
- 需要 PowerShell 5.1 或更高版本
- 確保已安裝所有依賴 (`npm install`)
- 確保當前在 dev 分支且沒有未提交的更改

---

### 2. `auto-merge.js` (Node.js)

**適用於:** 跨平台 (Windows / macOS / Linux)

**功能:**
- 與 PowerShell 版本相同
- 提供更強大的服務健康檢查
- 更好的錯誤處理和進程管理

**使用方式:**

```bash
# 在專案根目錄執行
node scripts/auto-merge.js
```

**注意事項:**
- 需要 Node.js 18 或更高版本
- 確保已安裝所有依賴 (`npm install`)
- 確保當前在 dev 分支且沒有未提交的更改

---

## 🔄 工作流程

兩個腳本都遵循相同的工作流程:

```
1. 檢查當前分支 (必須是 dev)
   └─ 檢查是否有未提交的更改

2. 啟動 Server (http://localhost:3000)
   └─ 等待服務就緒

3. 啟動 Client (http://localhost:5173)
   └─ 等待服務就緒

4. 執行 E2E 測試
   ├─ 測試通過 → 繼續
   └─ 測試失敗 → 停止服務並退出

5. 停止所有服務

6. 合併分支
   ├─ 切換到 main 分支
   ├─ 合併 dev 分支
   └─ 處理可能的衝突

7. 推送到 GitHub
   └─ 推送 main 分支

8. 切回 dev 分支
```

---

## ⚙️ 前置需求

### 必須安裝:
- Node.js >= 18.0.0
- npm
- Git
- PowerShell 5.1+ (僅限 Windows 使用 .ps1 腳本)

### 專案依賴:
```bash
# 在專案根目錄
npm install

# 在 server 目錄
cd server
npm install

# 在 client 目錄
cd client
npm install
```

### Playwright 安裝:
```bash
cd client
npx playwright install
```

---

## 🚨 常見問題

### Q1: 腳本執行失敗,服務沒有停止怎麼辦?

**手動停止服務:**

```powershell
# PowerShell
Get-Process -Name "node" | Stop-Process -Force
```

```bash
# Linux/macOS
pkill -f "node"
```

### Q2: 測試失敗了,如何查看詳細報告?

```bash
cd client
npx playwright show-report
```

### Q3: 合併時出現衝突怎麼辦?

腳本會自動停止。你需要:

1. 手動解決衝突
2. 提交合併結果
3. 推送到 GitHub

```bash
# 解決衝突後
git add .
git commit -m "chore: resolve merge conflicts"
git push origin main
git checkout dev
```

### Q4: 如何只執行測試而不合併?

```bash
# 手動執行測試
cd client
npm run test:e2e
```

### Q5: PowerShell 腳本無法執行 (執行策略限制)

```powershell
# 臨時允許執行
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# 然後執行腳本
.\scripts\auto-merge.ps1
```

---

## 🎯 最佳實踐

1. **定期執行:** 在合併到 main 之前,始終執行此腳本
2. **保持 dev 分支乾淨:** 確保沒有未提交的更改
3. **檢查測試報告:** 即使測試通過,也要查看報告確認沒有警告
4. **備份重要更改:** 在執行自動合併前,確保重要更改已推送到遠端

---

## 📝 自定義配置

### 修改端口

如果你的服務使用不同的端口,需要修改腳本中的 URL:

**auto-merge.ps1:**
```powershell
# 第 130 行左右
$response = Invoke-WebRequest -Uri "http://localhost:YOUR_PORT"
```

**auto-merge.js:**
```javascript
// checkServiceReady 調用處
await checkServiceReady('http://localhost:YOUR_PORT');
```

### 修改等待時間

**auto-merge.ps1:**
```powershell
# 調整 Start-Sleep 的秒數
Start-Sleep -Seconds 5
```

**auto-merge.js:**
```javascript
// 修改 maxRetries 和 interval 參數
checkServiceReady(url, maxRetries = 30, interval = 1000)
```

---

## 📚 相關文檔

- [Playwright 文檔](https://playwright.dev/)
- [Git 分支管理](https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging)
- [Node.js Child Process](https://nodejs.org/api/child_process.html)

---

## 🤝 貢獻

如果你發現腳本有問題或有改進建議,歡迎提交 Issue 或 Pull Request!
