# 🚀 快速開始 - 運行新的 E2E 測試

## 📋 測試內容

**完整遊戲流程與回放測試** - 涵蓋從玩家加入到遊戲結束再到回放的完整流程。

## ⚡ 快速運行

### 步驟 1: 啟動服務

打開兩個終端：

**終端 1 - 啟動服務器：**
```bash
cd server
npm run dev
```

**終端 2 - 啟動客戶端：**
```bash
cd client
npm run dev
```

等待兩個服務都啟動完成（通常幾秒鐘）。

### 步驟 2: 運行測試

**終端 3 - 運行 E2E 測試：**
```bash
cd client

# 方式 1: UI 模式（推薦，可視化）
npm run test:e2e:ui

# 方式 2: 有頭模式（看到瀏覽器）
npm run test:e2e:headed

# 方式 3: 無頭模式（後台運行）
npm run test:e2e

# 方式 4: 只運行新測試
npx playwright test full-game-replay.spec.ts --headed
```

## 📸 查看結果

### 測試通過
如果測試通過，你會看到：
```
✅ 所有測試通過！
```

### 查看截圖
測試會自動保存 8 張截圖在：
```
client/e2e/test-results/
├── 01-player1-created-room.png
├── 02-player1-ready.png
├── 03-player2-ready.png
├── 04-game-ended-player1.png
├── 05-game-ended-player2.png
├── 06-replay-started.png
├── 07-replay-completed.png
└── 08-replay-exited.png
```

### 查看測試報告
```bash
npx playwright show-report
```

## 🎯 測試流程

測試會自動執行以下步驟：

1. ✅ **玩家 1 創建房間**（執黑）
2. ✅ **玩家 2 加入房間**（執白）
3. ✅ **完成一局遊戲**（9 步，黑棋勝利）
4. ✅ **玩家 1 開始回放**（自動播放）
5. ✅ **等待回放完成**
6. ✅ **退出回放模式**

整個測試大約需要 **30-60 秒**。

## 🐛 常見問題

### 問題 1: 連線失敗
**解決**：確保服務器和客戶端都在運行
```bash
# 檢查服務器（應該在 3001 端口）
curl http://localhost:3001

# 檢查客戶端（應該在 5173 端口）
curl http://localhost:5173
```

### 問題 2: 測試超時
**解決**：可能是網絡延遲，重新運行測試
```bash
npm run test:e2e:headed
```

### 問題 3: 找不到元素
**解決**：查看截圖診斷問題
```bash
# 截圖位置
ls e2e/test-results/*.png
```

## 📚 更多資訊

- 詳細文檔：`e2e/README.md`
- 實作總結：`e2e/IMPLEMENTATION_SUMMARY.md`
- 故障排除：`e2e/TROUBLESHOOTING.md`

## 🎉 預期輸出

成功運行後，你會看到類似的輸出：

```
========== 階段 1: 玩家加入 ==========
🔵 玩家 1 創建房間...
✅ 房間已創建
🟢 玩家 2 加入房間...
✅ 兩個玩家都已準備好！

========== 階段 2: 完成一局遊戲 ==========
🎮 開始下棋，共 9 步...
✅ 遊戲完成！
✅ 遊戲已結束，黑棋勝利！

========== 階段 3: 第一個玩家回放 ==========
🎬 開始回放...
✅ 回放模式已啟動
⏳ 等待回放完成（共 9 步）...
✅ 回放完成！

========== 階段 4: 關閉回放 ==========
🚪 退出回放...
✅ 已退出回放模式！

✅ 所有測試通過！
```

享受測試吧！🎮
