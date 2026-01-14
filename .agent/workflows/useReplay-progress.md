# useReplay Hook 創建完成

**日期**: 2026-01-14  
**狀態**: ✅ Hook 已創建，⚠️ 整合進行中  
**完成度**: 50%

---

## ✅ 已完成

### 1. 創建 useReplay Hook
**文件**: `client/src/hooks/useReplay.ts`

**功能**:
- ✅ 管理回放狀態 (isReplaying, replayStep, isAutoPlaying, replayHistory)
- ✅ 自動播放功能 (使用 useEffect)
- ✅ 棋盤狀態重建 (getReplayBoard)
- ✅ 完整的播放控制 API

**API**:
```typescript
const replay = useReplay();

// 狀態
replay.isReplaying
replay.replayStep
replay.isAutoPlaying
replay.replayHistory

// 方法
replay.startReplay(history)  // 開始回放
replay.exitReplay()          // 退出回放
replay.previousStep()        // 上一步
replay.nextStep()            // 下一步
replay.restartReplay()       // 重新開始
replay.toggleAutoPlay()      // 切換自動播放
replay.fastForward()         // 快進到最後
replay.getReplayBoard(step)  // 獲取指定步驟的棋盤狀態
```

### 2. 部分整合到 App.tsx
- ✅ 導入 useReplay Hook
- ✅ 初始化 Hook: `const replay = useReplay();`
- ✅ 移除舊的回放 state

---

## 🔄 需要完成

### 替換所有回放函數調用

需要將以下舊函數替換為 Hook 方法：

#### 1. getReplayBoard (第 571-580 行)
```typescript
// ❌ 刪除整個函數
const getReplayBoard = (step: number): BoardState => { ... }

// ✅ 使用 Hook 方法
replay.getReplayBoard(step)
```

#### 2. handleStartReplay (第 583-588 行)
```typescript
// ❌ 舊代碼
const handleStartReplay = () => {
  setReplayHistory([...room.history]);
  setIsReplaying(true);
  setReplayStep(0);
  setIsAutoPlaying(true);
};

// ✅ 新代碼
const handleStartReplay = () => {
  if (!room?.history) return;
  replay.startReplay(room.history);
};
```

#### 3. handleExitReplay (第 591-600 行)
```typescript
// ❌ 舊代碼
const handleExitReplay = () => {
  setIsReplaying(false);
  setReplayStep(0);
  setIsAutoPlaying(false);
  setReplayHistory([]);
  if (autoPlayTimer.current) {
    clearInterval(autoPlayTimer.current);
    autoPlayTimer.current = null;
  }
};

// ✅ 新代碼
const handleExitReplay = () => {
  replay.exitReplay();
};
```

#### 4. handleReplayPrevious (第 603-607 行)
```typescript
// ❌ 舊代碼
const handleReplayPrevious = () => {
  if (replayStep > 0) {
    setReplayStep(prev => prev - 1);
  }
};

// ✅ 新代碼
const handleReplayPrevious = () => {
  replay.previousStep();
};
```

#### 5. handleReplayNext (第 610-614 行)
```typescript
// ❌ 舊代碼
const handleReplayNext = () => {
  if (replayStep < replayHistory.length - 1) {
    setReplayStep(prev => prev + 1);
  }
};

// ✅ 新代碼
const handleReplayNext = () => {
  replay.nextStep();
};
```

#### 6. handleReplayRestart (第 617-620 行)
```typescript
// ❌ 舊代碼
const handleReplayRestart = () => {
  setReplayStep(0);
  setIsAutoPlaying(false);
};

// ✅ 新代碼
const handleReplayRestart = () => {
  replay.restartReplay();
};
```

#### 7. handleToggleAutoPlay (第 623-624 行)
```typescript
// ❌ 舊代碼
const handleToggleAutoPlay = () => {
  setIsAutoPlaying(prev => !prev);
};

// ✅ 新代碼
const handleToggleAutoPlay = () => {
  replay.toggleAutoPlay();
};
```

#### 8. handleReplayFastForward (第 647-651 行)
```typescript
// ❌ 舊代碼
const handleReplayFastForward = () => {
  if (replayHistory.length > 0) {
    setReplayStep(replayHistory.length - 1);
  }
};

// ✅ 新代碼
const handleReplayFastForward = () => {
  replay.fastForward();
};
```

#### 9. 刪除 useEffect (第 626-644 行)
```typescript
// ❌ 刪除整個 useEffect（Hook 內部已處理）
useEffect(() => {
  if (isAutoPlaying) {
    autoPlayTimer.current = setInterval(() => { ... }, 1000);
    return () => { ... };
  }
}, [isAutoPlaying, replayHistory]);
```

#### 10. 更新所有狀態引用
將所有 `isReplaying` 改為 `replay.isReplaying`  
將所有 `replayStep` 改為 `replay.replayStep`  
將所有 `isAutoPlaying` 改為 `replay.isAutoPlaying`  
將所有 `replayHistory` 改為 `replay.replayHistory`

---

## 📊 預估工作量

- **剩餘工時**: 30-40 分鐘
- **需要修改**: ~10 個函數 + ~20 處狀態引用
- **代碼減少**: 預計減少 ~80 行

---

## 💡 建議

### 選項 A: 完成整合 (推薦)
**工時**: 30-40 分鐘  
**優點**: 完整的 Hook，可以測試  
**缺點**: 需要一次性修改較多地方

### 選項 B: 提交當前進度
**工時**: 5 分鐘  
**優點**: 保存已完成的工作  
**缺點**: Hook 未使用，無法測試

---

## 🎯 建議執行順序

1. **完成 useReplay 整合** (30-40 分鐘)
2. **測試回放功能** (10 分鐘)
3. **提交兩個 Hook** (5 分鐘)
4. **繼續創建其他 Hook** 或 **休息**

---

**創建時間**: 2026-01-14 13:58  
**狀態**: 等待決策
