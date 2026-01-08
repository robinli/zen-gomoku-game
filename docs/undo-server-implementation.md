# Server 端悔棋功能實作完成

## ✅ 實作完成時間
2026-01-08 08:55

---

## 📋 已完成的修改

### 1. types.ts - WebSocket 事件定義

#### ServerToClientEvents（新增 3 個事件）
```typescript
UNDO_REQUESTED: (data: { requestedBy: Player }) => void;
UNDO_ACCEPTED: (data: { 
    board: BoardState; 
    turn: Player; 
    lastMove: Position | null;
    undoCount: { black: number; white: number };
}) => void;
UNDO_REJECTED: () => void;
```

#### ClientToServerEvents（新增 2 個事件）
```typescript
REQUEST_UNDO: () => void;
RESPOND_UNDO: (data: { accept: boolean }) => void;
```

---

### 2. roomManager.ts - 悔棋邏輯方法

#### canUndo() - 檢查是否可以悔棋
**檢查項目**：
- ✅ 房間是否存在
- ✅ 設定是否允許悔棋（undoLimit !== 0）
- ✅ 是否有歷史記錄
- ✅ 最後一步是否是該玩家下的
- ✅ 悔棋次數是否已用完
- ✅ 遊戲是否已結束

**返回**：
```typescript
{ canUndo: boolean; reason?: string }
```

#### undoLastMove() - 撤銷最後一步
**執行步驟**：
1. 檢查是否可以悔棋
2. 從 history 移除最後一步
3. 恢復棋盤（將該位置設為 null）
4. 切換回合（輪到請求方重新下）
5. 更新 lastMove
6. 清除勝利狀態（winner, winningLine）
7. 增加悔棋次數（undoCount[player]++）
8. 更新時間戳

---

### 3. index.ts - MAKE_MOVE 歷史記錄

**在下棋後添加歷史記錄**：
```typescript
updatedRoom.history.push({
    step: updatedRoom.history.length + 1,
    player: playerSide,
    position: pos,
    timestamp: Date.now(),
});
```

---

### 4. index.ts - 悔棋事件處理器

#### REQUEST_UNDO 處理器
**流程**：
1. 獲取房間和玩家身份
2. 檢查是否可以悔棋（canUndo）
3. 如果不可以，返回錯誤訊息
4. 如果可以，通知對方玩家（UNDO_REQUESTED）

**日誌**：
```
🤔 black 請求悔棋: ABC123
```

#### RESPOND_UNDO 處理器
**流程**：
1. 獲取房間和對方玩家
2. 如果同意（accept = true）：
   - 執行悔棋（undoLastMove）
   - 通知雙方（UNDO_ACCEPTED）
   - 包含新的棋盤、回合、lastMove、undoCount
3. 如果拒絕（accept = false）：
   - 通知請求方（UNDO_REJECTED）

**日誌**：
```
✅ 悔棋成功: ABC123 (black)
或
❌ 悔棋被拒絕: ABC123
```

---

## 🔄 完整流程

### 悔棋成功流程
```
玩家 A 下了一步棋（黑子）
    ↓
玩家 A 點擊「請求悔棋」
    ↓
Client A → Server: REQUEST_UNDO
    ↓
Server 檢查：
  - ✅ 房間存在
  - ✅ 允許悔棋（undoLimit = 3）
  - ✅ 有歷史記錄
  - ✅ 最後一步是玩家 A 下的
  - ✅ 悔棋次數未用完（0/3）
  - ✅ 遊戲未結束
    ↓
Server → Client B: UNDO_REQUESTED { requestedBy: 'black' }
    ↓
Client B 顯示確認對話框
    ↓
玩家 B 點擊「同意」
    ↓
Client B → Server: RESPOND_UNDO { accept: true }
    ↓
Server 執行悔棋：
  - 從 history 移除最後一步
  - 恢復棋盤
  - 切換回合
  - undoCount.black++
    ↓
Server → Client A & B: UNDO_ACCEPTED {
  board: [...],
  turn: 'black',
  lastMove: null,
  undoCount: { black: 1, white: 0 }
}
    ↓
Client A & B 更新棋盤狀態
    ↓
✅ 悔棋完成
```

### 悔棋被拒絕流程
```
玩家 A 請求悔棋
    ↓
Server → Client B: UNDO_REQUESTED
    ↓
玩家 B 點擊「拒絕」
    ↓
Client B → Server: RESPOND_UNDO { accept: false }
    ↓
Server → Client A: UNDO_REJECTED
    ↓
Client A 顯示「對方拒絕了悔棋請求」
    ↓
遊戲繼續
```

---

## 📊 功能驗證清單

| 功能 | 狀態 | 說明 |
|------|------|------|
| ✅ 歷史記錄 | 完成 | MAKE_MOVE 時記錄 |
| ✅ 檢查悔棋條件 | 完成 | canUndo() 方法 |
| ✅ 撤銷棋步 | 完成 | undoLastMove() 方法 |
| ✅ 請求悔棋 | 完成 | REQUEST_UNDO 處理器 |
| ✅ 回應悔棋 | 完成 | RESPOND_UNDO 處理器 |
| ✅ 通知對方 | 完成 | UNDO_REQUESTED 事件 |
| ✅ 悔棋成功 | 完成 | UNDO_ACCEPTED 事件 |
| ✅ 悔棋被拒絕 | 完成 | UNDO_REJECTED 事件 |
| ✅ 次數統計 | 完成 | undoCount 更新 |
| ✅ 次數限制 | 完成 | 檢查 undoLimit |
| ✅ 錯誤處理 | 完成 | 各種驗證和錯誤訊息 |

---

## 🎯 邊界情況處理

### ✅ 已處理的情況

1. **房間不存在**
   - 返回錯誤：「您不在任何房間中」

2. **不允許悔棋**（undoLimit = 0）
   - 返回錯誤：「此房間不允許悔棋」

3. **沒有歷史記錄**
   - 返回錯誤：「沒有可以悔棋的步驟」

4. **不是自己的棋**
   - 返回錯誤：「只能悔自己剛下的棋」

5. **次數用完**
   - 返回錯誤：「悔棋次數已用完（3/3）」

6. **遊戲已結束**
   - 返回錯誤：「遊戲已結束，無法悔棋」

7. **對方不在線**
   - 返回錯誤：「對方玩家不在線」

8. **對方拒絕**
   - 發送 UNDO_REJECTED 事件

---

## 📝 日誌輸出

### 成功情況
```
🤔 black 請求悔棋: ABC123
✅ 悔棋成功: ABC123 (black, 已使用 1 次)
```

### 失敗情況
```
🤔 black 請求悔棋: ABC123
❌ 無法悔棋: 悔棋次數已用完（3/3）
```

```
🤔 black 請求悔棋: ABC123
❌ 悔棋被拒絕: ABC123
```

---

## 🚀 下一步：Client 端實作

### 需要實作的功能

1. **更新 Client types.ts**
   - 同步 Server 端的事件定義

2. **更新 socketService.ts**
   - 添加 requestUndo() 方法
   - 添加 respondUndo() 方法
   - 添加事件監聽器

3. **UI 組件**
   - 悔棋按鈕
   - 悔棋請求對話框
   - 剩餘次數顯示

4. **App.tsx**
   - 處理 UNDO_REQUESTED 事件
   - 處理 UNDO_ACCEPTED 事件
   - 處理 UNDO_REJECTED 事件
   - 更新房間狀態

---

## ✅ Server 端悔棋功能：100% 完成

**所有 Server 端邏輯已完整實作並測試！**

---

**實作人員**：Antigravity AI  
**版本**：v2.3.0  
**狀態**：✅ Server 端完成，等待 Client 端實作
