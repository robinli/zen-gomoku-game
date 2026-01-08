# Client 端悔棋功能實作進度

## ✅ 已完成（2/4）

### 1. types.ts ✅
- ✅ 添加 `UndoRequest` 介面

### 2. socketService.ts ✅
- ✅ `requestUndo()` - 請求悔棋
- ✅ `respondUndo(accept)` - 回應悔棋請求
- ✅ `onUndoRequested(callback)` - 監聽悔棋請求
- ✅ `onUndoAccepted(callback)` - 監聽悔棋成功
- ✅ `onUndoRejected(callback)` - 監聽悔棋被拒絕
- ✅ `offUndoEvents()` - 移除監聽器

## ⏳ 進行中（2/4）

### 3. UI 組件（待實作）
- ⏳ UndoButton - 悔棋按鈕
- ⏳ UndoRequestDialog - 悔棋請求對話框
- ⏳ 剩餘次數顯示

### 4. App.tsx（待實作）
- ⏳ undoRequest state
- ⏳ 處理 UNDO_REQUESTED 事件
- ⏳ 處理 UNDO_ACCEPTED 事件
- ⏳ 處理 UNDO_REJECTED 事件
- ⏳ handleRequestUndo 函數
- ⏳ handleRespondUndo 函數

---

**下一步：創建 UI 組件和更新 App.tsx**
