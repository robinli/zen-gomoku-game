# 🐛 Socket 連線問題排查報告

##問題摘要
創建房間時顯示「連線失敗，網路連線中，請稍後再試」。

## ✅ 已驗證正常的部分
1. **Server 正常運行** - `http://localhost:3000` ✓
2. **HTTP 健康檢查正常** - `/health` 返回 OK ✓
3. **Socket.IO 端點可訪問** - `curl http://localhost:3000/socket.io/?EIO=4&transport=polling` 返回 session ✓
4. **測試頁面連線成功** - `http://localhost:5174/test-socket.html` 可以連接 ✓
5. **手動連線成功** - 在瀏覽器 Console 執行 `io('http://localhost:3000')` 成功 ✓
6. **CORS 已修復** - Server 允許所有 localhost 端口 ✓

## ❌ 問題所在
**React 應用內部的 `socketService` 無法成功建立 Socket.IO 連線**

### 現象
1. Console 顯示 `🚀 正在初始化 Socket 連線...`
2. Console 顯示 `🔗 嘗試連線到: http://localhost:3000`
3. **從未出現** `🔌 WebSocket 已連線` 訊息
4. 點擊「創建遊戲房間」時出現 `❌ Socket 未連線`

## 🔍 根本原因分析

經過詳細測試發現：
- **CDN 載入的 Socket.IO** (`window.io`) 可以成功連線
- **npm 安裝的 socket.io-client** 在 React 中無法連線

可能原因：
1. **npm 包版本不匹配** - Client 4.6.1 vs Server 4.6.1（版本一致但可能打包有問題）
2. **模組載入時機** - TypeScript / ESM 轉譯問題
3. **Vite 打包配置** - Socket.IO 被錯誤打包或樹搖優化
4. **環境變數問題** - `import.meta.env` 讀取時機

## 🛠️ 建議的解決方案

### 方案 A：使用 CDN + Window Global（最快）
已嘗試但未完全成功，需要確保載入時機正確。

**步驟**：
1. 在 `index.html` 中確保 Socket.IO CDN 在 React 之前載入
2. 等待 Socket.IO 載入完成後再初始化 React
3. 在 `socketService.ts` 中使用 `window.io`

**代碼修改**（待實施）：
```html
<!-- index.html -->
<script src="https://cdn.socket.io/4.6.1/socket.io.min.js"></script>
<script>
  // 確保 window.io 存在後才載入 React
  window.addEventListener('DOMContentLoaded', () => {
    if (typeof io !== 'undefined') {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = './index.tsx';
      document.body.appendChild(script);
    }
  });
</script>
```

### 方案 B：降級依賴版本
嘗試使用其他版本的 socket.io-client

```bash
npm install socket.io-client@4.5.0
```

### 方案 C：使用動態導入
延遲載入 socket.io-client

```typescript
const { io } = await import('socket.io-client');
```

### 方案 D：回到 P2P 架構（保守方案）
如果 Socket.IO 問題無法快速解決，可先回到原本的 PeerJS P2P 架構，之後再慢慢遷移。

## 📝 立即可執行的測試

### 測試 1：驗證 Socket.IO CDN 載入
打開 `http://localhost:5174`，在 Console 執行：
```javascript
console.log('io 是否存在:', typeof io !== 'undefined');
console.log('io 版本:', io.version);
```

### 測試 2：手動連線測試
在 Console 執行：
```javascript
const socket = io('http://localhost:3000');
socket.on('connect', () => console.log('✅ 手動連線成功:', socket.id));
socket.on('connect_error', (err) => console.error('錯誤:', err));
```

如果以上測試**成功**，問題確定在於 `socketService.ts` 的封裝。

## 🎯 下一步行動

1. **停止所有 dev 服務器** (5173, 5174, 3000)
2. **清理 node_modules**
```bash
rm -rf node_modules package-lock.json
rm -rf server/node_modules server/package-lock.json
```

3. **重新安裝依賴**
```bash
npm install
cd server && npm install
```

4. **使用指定端口啟動**
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
npm run dev
```

5. **驗證端口**
- Client: http://localhost:5173 (確保是 5173，不是 5174)
- Server: http://localhost:3000

6. **測試連線**
- 開啟 http://localhost:5173/test-socket.html
- 應該看到「✅ 已連線！Socket ID: xxx」

## 💡 臨時解決方案（快速修復）

如果需要立即展示或測試，可以：
1. 直接使用 `/public/test-socket.html` 頁面進行連線測試
2. 或者創建一個最簡化版本的創建房間功能

## 📞 需要協助的部分

如果以上方案無法解決，可能需要：
1. 檢查瀏覽器 Network 面板的 Socket.IO 請求詳情
2. 檢查是否有 Service Worker 或緩存問題
3. 嘗試其他瀏覽器（Chrome, Firefox, Edge）

---
**文檔創建時間**: 2025-12-31 21:57
**測試環境**: Windows, Node.js, Vite
