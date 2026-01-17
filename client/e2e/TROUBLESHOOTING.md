# E2E 測試故障排除指南

## 問題 1: 測試超時

### 症狀
```
Test timeout of 30000ms exceeded
browserContext.close: Target page, context or browser has been closed
```

### 原因
- 測試超時時間太短（30 秒）
- 網路延遲或服務器響應慢

### 解決方案
✅ 已將超時時間增加到 60 秒（`playwright.config.ts`）

---

## 問題 2: 找不到按鈕

### 症狀
測試無法找到「黑棋」或「白棋」按鈕

### 原因
按鈕文字使用 i18n 翻譯：
- 中文：`執黑 (先行)` 和 `執白 (後行)`
- 英文：`Black (First)` 和 `White (Second)`

### 解決方案
✅ 已更新 `e2e/helpers.ts` 中的 `createRoom` 函數，使用正確的中文文字

---

## 問題 3: 服務器端口被佔用

### 症狀
```
Error: listen EADDRINUSE: address already in use :::3000
```

### 原因
端口 3000 已被其他進程佔用

### 解決方案

#### 選項 1: 停止佔用端口的進程
```powershell
# 查找佔用端口的進程
netstat -ano | findstr :3000

# 停止進程（替換 PID）
taskkill /PID <PID> /F
```

#### 選項 2: 使用不同的端口
修改服務器配置使用其他端口

---

## 正確的測試執行流程

### 步驟 1: 確保服務器運行
```bash
# 終端 1
cd server
npm run dev
```

應該看到：
```
🎯 Socket.IO 伺服器已初始化
Server running on port 3000
```

### 步驟 2: 確保客戶端運行
```bash
# 終端 2
cd client
npm run dev
```

應該看到：
```
Local: http://localhost:5173/
```

### 步驟 3: 運行測試
```bash
# 終端 3
cd client
npm run test:e2e:ui
```

---

## 常見問題

### Q: 測試找不到元素怎麼辦？

**A:** 使用 Playwright UI 模式調試：
```bash
npm run test:e2e:ui
```

在 UI 中可以：
1. 看到測試執行的每一步
2. 檢查 DOM 結構
3. 查看選擇器是否正確

### Q: 如何確認客戶端正在運行？

**A:** 打開瀏覽器訪問 `http://localhost:5173`，應該能看到遊戲界面

### Q: 如何確認服務器正在運行？

**A:** 查看終端輸出，應該看到 "Server running on port 3000"

### Q: 測試一直失敗怎麼辦？

**A:** 檢查清單：
- [ ] 服務器正在運行（端口 3000）
- [ ] 客戶端正在運行（端口 5173）
- [ ] 沒有其他進程佔用這些端口
- [ ] 網路連線正常
- [ ] 瀏覽器可以正常訪問 http://localhost:5173

---

## 調試技巧

### 1. 使用 Playwright Inspector
```bash
npm run test:e2e:debug
```

可以逐步執行測試，查看每一步的狀態

### 2. 查看測試截圖
測試失敗時，截圖保存在 `test-results/` 目錄

### 3. 查看測試錄影
失敗的測試會保留錄影，可以回放查看問題

### 4. 增加等待時間
如果測試偶爾失敗，可能需要增加等待時間：
```typescript
await page.waitForTimeout(1000); // 等待 1 秒
```

---

## 已修復的問題

✅ 超時時間從 30 秒增加到 60 秒  
✅ 按鈕選擇器使用正確的中文文字  
✅ 添加更多等待時間確保元素加載完成  
✅ 簡化棋子驗證邏輯  

---

## 下次運行測試前

確保：
1. ✅ 服務器正在運行
2. ✅ 客戶端正在運行  
3. ✅ 沒有端口衝突
4. ✅ 使用 `npm run test:e2e:ui` 查看測試過程

---

**有問題？** 查看 Playwright 官方文檔：https://playwright.dev/
