# 🚀 Zen Gomoku Game - 部署指南

本專案採用 **Client-Server 分離架構**：
- **Client 端**：部署到 Vercel（已完成 ✅）
- **Server 端**：部署到 Render（本指南）

---

## 📋 部署前準備

### 1️⃣ 確認 Client 已部署
確保您的 Vercel 部署已完成，並取得 URL：
```
https://zen-gomoku-game.vercel.app
```

### 2️⃣ 檢查 Server 配置
確認 `server/package.json` 包含以下腳本：
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

---

## 🌐 部署到 Render

### **方法一：使用 render.yaml（推薦）**

1️⃣ **推送代碼到 GitHub**
```bash
git add .
git commit -m "Add Render deployment config"
git push origin main
```

2️⃣ **在 Render Dashboard 創建服務**
- 前往：https://dashboard.render.com/
- 點擊 **「New +」** → **「Blueprint」**
- 選擇您的 GitHub repository
- Render 會自動讀取 `render.yaml` 配置

3️⃣ **等待部署完成**
- 首次部署約需 3-5 分鐘
- 部署成功後，Render 會提供一個 URL，例如：
  ```
  https://zen-gomoku-server.onrender.com
  ```

---

### **方法二：手動設定**

1️⃣ **創建 Web Service**
- 前往 Render Dashboard
- 點擊 **「New +」** → **「Web Service」**
- 連接您的 GitHub repository

2️⃣ **配置設定**
| 設定項目 | 值 |
|---------|-----|
| **Name** | `zen-gomoku-server` |
| **Region** | Singapore 或其他接近地區 |
| **Runtime** | Node |
| **Build Command** | `cd server && npm install && npm run build` |
| **Start Command** | `cd server && npm start` |

3️⃣ **設定環境變數**
在 **Environment** 頁籤新增：
| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `CLIENT_URL` | `https://zen-gomoku-game.vercel.app` |

4️⃣ **配置健康檢查（可選）**
- Health Check Path: `/health`

5️⃣ **儲存並部署**
點擊 **「Create Web Service」**

---

## 🔗 更新 Client 端配置

部署完成後，需要更新 Vercel 上的環境變數：

1️⃣ **前往 Vercel Dashboard**
- 選擇您的專案：`zen-gomoku-game`
- 進入 **Settings** → **Environment Variables**

2️⃣ **新增或更新環境變數**
| Variable Name | Value |
|--------------|-------|
| `VITE_SOCKET_URL` | `https://zen-gomoku-server.onrender.com` |

3️⃣ **重新部署 Client**
```bash
# 本地觸發重新部署
git commit --allow-empty -m "Update server URL"
git push origin main
```

或在 Vercel Dashboard 點擊 **「Redeploy」**

---

## ✅ 驗證部署

### 1️⃣ 檢查 Server 健康狀態
訪問：
```
https://zen-gomoku-server.onrender.com/health
```

應該看到類似響應：
```json
{
  "status": "ok",
  "rooms": 0,
  "timestamp": "2026-01-02T12:00:00.000Z"
}
```

### 2️⃣ 測試完整流程
1. 開啟 Client：`https://zen-gomoku-game.vercel.app`
2. 點擊「創建遊戲房間」
3. 檢查瀏覽器控制台：
   - ✅ WebSocket 連線成功
   - ✅ 房間創建成功
   - ✅ 分享連結正常顯示

### 3️⃣ 測試多人對戰
1. 複製分享連結
2. 用另一個瀏覽器/無痕模式開啟
3. 確認雙方可以正常落子

---

## ⚠️ 常見問題

### 問題 1：首次連線很慢（冷啟動）
**原因**：Render 免費方案會在 15 分鐘無活動後休眠

**解決方案**：
- 升級到付費方案（$7/月起）
- 或使用 [UptimeRobot](https://uptimerobot.com/) 每 14 分鐘 ping 一次健康檢查端點

### 問題 2：CORS 錯誤
**檢查**：
- 確認 Render 環境變數 `CLIENT_URL` 設定正確
- 檢查 `server/src/index.ts` 的 CORS 配置

### 問題 3：WebSocket 連線失敗
**檢查**：
- 確認 Client 的 `VITE_SOCKET_URL` 使用 `https://`
- 查看 Render Logs：Dashboard → 您的服務 → Logs

---

## 📊 監控與維護

### 查看實時日誌
```
Render Dashboard → zen-gomoku-server → Logs
```

### 監控指標
- 活躍房間數：訪問 `/health` endpoint
- CPU/Memory 使用率：Render Metrics 頁面

### 手動重啟服務
```
Render Dashboard → zen-gomoku-server → Manual Deploy → Deploy latest commit
```

---

## 💰 成本估算

### 免費方案限制
- ✅ 750 小時/月（足夠個人專案）
- ⚠️ 15 分鐘無活動後休眠
- ⚠️ 冷啟動需 30-50 秒

### 付費方案（Starter $7/月）
- ✅ 無休眠
- ✅ 更快啟動速度
- ✅ 更多資源

---

## 🔄 更新部署

### 自動部署（推薦）
預設情況下，推送到 GitHub main 分支會自動觸發部署：
```bash
git add .
git commit -m "Update server logic"
git push origin main
```

### 手動部署
Render Dashboard → 您的服務 → Manual Deploy

---

## 📚 相關資源

- [Render 官方文檔](https://render.com/docs)
- [Socket.IO 部署指南](https://socket.io/docs/v4/server-deployment/)
- [本專案 README](./README.md)

---

**部署完成！🎉** 您的禪意五子棋現在可以全球訪問了！
