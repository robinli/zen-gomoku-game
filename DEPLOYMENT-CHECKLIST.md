# ✅ Render 部署檢查清單

在部署前，請確認以下項目：

## 📋 部署前檢查

### 1️⃣ 代碼準備
- [ ] 所有代碼已提交到 Git
- [ ] `render.yaml` 存在於根目錄
- [ ] `server/package.json` 包含正確的 build 和 start 腳本

### 2️⃣ 環境配置
- [ ] `.env` 和 `.env.local` **未**被推送到 GitHub（已在 `.gitignore` 中）
- [ ] `server/.env.example` 包含所有必要的環境變數範例
- [ ] Client 端已部署到 Vercel，並取得 URL

### 3️⃣ Render 設定
- [ ] 已註冊 Render 帳號
- [ ] GitHub repository 可被 Render 訪問
- [ ] 準備設定以下環境變數：
  - `NODE_ENV=production`
  - `CLIENT_URL=https://zen-gomoku-game.vercel.app`

---

## 🚀 部署步驟

### Step 1: 推送到 GitHub
```bash
git add .
git commit -m "Add Render deployment config"
git push origin main
```

### Step 2: 在 Render 創建服務
1. 前往 https://dashboard.render.com/
2. 點擊 **「New +」** → **「Blueprint」**
3. 選擇您的 GitHub repository
4. Render 會自動讀取 `render.yaml`
5. 檢查配置無誤後點擊 **「Apply」**

### Step 3: 等待部署完成
- 首次部署約需 3-5 分鐘
- 可在 Logs 頁面查看進度
- 成功後會顯示 ✅ 綠色狀態

### Step 4: 取得 Server URL
部署成功後，Render 會提供一個 URL，例如：
```
https://zen-gomoku-server.onrender.com
```

### Step 5: 更新 Vercel 環境變數
1. 前往 Vercel Dashboard
2. 選擇 `zen-gomoku-game` 專案
3. Settings → Environment Variables
4. 新增或更新：
   ```
   VITE_SOCKET_URL=https://zen-gomoku-server.onrender.com
   ```
5. 重新部署 Client（或等待自動部署）

---

## ✅ 部署後驗證

### 1. 檢查 Server 健康狀態
訪問：`https://zen-gomoku-server.onrender.com/health`

預期響應：
```json
{
  "status": "ok",
  "rooms": 0,
  "timestamp": "2026-01-02T12:00:00.000Z"
}
```

### 2. 測試 Client 連線
1. 開啟：`https://zen-gomoku-game.vercel.app`
2. 打開瀏覽器開發者工具（F12）
3. 點擊「創建遊戲房間」
4. 檢查 Console 是否有：
   ```
   ✅ 連線到 Socket.IO 伺服器
   ✅ 房間創建成功
   ```

### 3. 測試多人對戰
1. 複製分享連結
2. 用無痕模式或另一個瀏覽器開啟
3. 確認雙方可以看到對方的落子

---

## 🐛 問題排查

### 問題：首次連線很慢
**原因**：Render 免費方案會休眠  
**解決**：等待 30-50 秒冷啟動完成

### 問題：CORS 錯誤
**檢查**：
1. Render 環境變數 `CLIENT_URL` 是否正確
2. URL 是否包含 `https://`（不要有尾隨斜線）

### 問題：WebSocket 連線失敗
**檢查**：
1. Vercel 的 `VITE_SOCKET_URL` 是否正確
2. 瀏覽器 Console 是否有錯誤訊息
3. Render Logs 是否有錯誤

---

## 📊 監控提示

### 查看實時日誌
```
Render Dashboard → zen-gomoku-server → Logs
```

### 監控房間數量
定期訪問 `/health` endpoint 查看活躍房間數

### 設定 Uptime 監控（可選）
使用 [UptimeRobot](https://uptimerobot.com/) 每 5 分鐘 ping 一次：
```
https://zen-gomoku-server.onrender.com/health
```

---

**完成！🎉** 您的專案已成功部署到 Render！
