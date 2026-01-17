# E2E 測試

## 📋 測試內容

本項目使用 Playwright 進行端到端（E2E）測試，專注於驗證**雙人連線功能**。

### 測試目標

✅ **驗證兩個玩家可以成功加入同一個遊戲房間**

測試涵蓋：
1. 單個玩家的 Socket 連線
2. 創建房間後的 Socket 連線
3. 兩個玩家同時連線到同一個房間

## 🚀 運行測試

### 前置條件

確保以下服務正在運行：

```bash
# 終端 1 - 啟動服務器
cd server
npm run dev

# 終端 2 - 啟動客戶端
cd client
npm run dev
```

### 運行測試

```bash
# UI 模式（推薦）- 可視化測試過程
npm run test:e2e:ui

# 無頭模式 - 在後台運行
npm run test:e2e

# 有頭模式 - 看到瀏覽器窗口
npm run test:e2e:headed

# 調試模式 - 逐步執行
npm run test:e2e:debug
```

## 📁 文件結構

```
e2e/
├── multiplayer-connection.spec.ts  # 雙人連線測試
├── helpers.ts                      # 測試輔助函數
├── README.md                       # 本文件
└── TROUBLESHOOTING.md             # 故障排除指南
```

## 🧪 測試案例

### 1. 檢查單個玩家的 Socket 連線

驗證單個玩家訪問首頁時，Socket 服務是否正確初始化。

### 2. 檢查創建房間後的 Socket 連線

驗證玩家創建房間後，Socket 是否成功連線到服務器。

**預期結果：**
- `isConnected`: true
- `socketId`: 已定義
- `socketConnected`: true

### 3. 檢查兩個玩家是否能同時連線 ⭐

**這是核心測試**，驗證雙人對弈的基礎功能。

**測試流程：**
1. 玩家 1 創建房間
2. 玩家 2 使用分享連結加入
3. 驗證兩個玩家的 Socket 都已連線
4. 驗證兩個玩家的 Socket ID 不同

**預期結果：**
- 玩家 1 和玩家 2 都成功連線
- 兩個 Socket ID 不同
- 截圖保存在 `test-results/` 目錄

## 🔍 調試

### 查看測試日誌

測試會在 console 中輸出詳細日誌：

```
🔵 玩家1: Socket 連線成功
🟢 玩家2: Socket 連線成功
```

### 查看截圖

測試失敗時，截圖會保存在：
- `test-results/player1-with-player2.png`
- `test-results/player2-joined.png`

### 查看測試報告

```bash
npx playwright show-report
```

## ⚙️ 配置

測試配置在 `playwright.config.ts`：

```typescript
{
  testDir: './e2e',
  timeout: 60 * 1000,
  use: {
    baseURL: 'http://localhost:5173',
    locale: 'zh-TW',  // 瀏覽器語系設為中文
  }
}
```

## 📝 輔助函數

`helpers.ts` 提供的函數（目前未使用，保留供未來擴展）：

- `switchLanguage(page, language)` - 切換語言
- `createRoom(page, side)` - 創建遊戲房間
- `waitForConnection(page)` - 等待連線成功
- `waitForOpponent(page)` - 等待對手加入
- `waitForBoardReady(page)` - 等待棋盤準備好
- `makeMove(page, row, col)` - 在棋盤上落子
- `verifyStone(page, row, col, color)` - 驗證棋子顏色

## 🎯 未來擴展

可以考慮添加的測試：

- [ ] 完整的對弈流程（下棋、回合切換）
- [ ] 悔棋功能
- [ ] 重新開始功能
- [ ] 勝負判定
- [ ] 斷線重連

## 📚 參考資料

- [Playwright 官方文檔](https://playwright.dev/)
- [故障排除指南](./TROUBLESHOOTING.md)
