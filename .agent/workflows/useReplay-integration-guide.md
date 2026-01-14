# useReplay Hook 整合指南

**目標**: 將 useReplay Hook 整合到 App.tsx  
**預估時間**: 30-40 分鐘  
**當前狀態**: 已添加導入，待替換函數

---

## 步驟 1: 初始化 Hook ✅

已完成：
```typescript
import { useReplay } from './hooks/useReplay';
```

待完成：
```typescript
// 在 App 組件中添加
const replay = useReplay();
```

---

## 步驟 2: 移除舊的 State

找到並刪除這些行 (約第 60-66 行):
```typescript
// ❌ 刪除這些
const [isReplaying, setIsReplaying] = useState(false);
const [replayStep, setReplayStep] = useState(0);
const [isAutoPlaying, setIsAutoPlaying] = useState(false);
const autoPlayTimer = useRef<number | null>(null);
const [replayHistory, setReplayHistory] = useState<MoveHistory[]>([]);
```

---

## 步驟 3: 替換回放函數

### 3.1 刪除 getReplayBoard 函數 (約第 569-577 行)
```typescript
// ❌ 刪除整個函數
const getReplayBoard = (step: number): BoardState => {
  const board: BoardState = Array(15).fill(null).map(() => Array(15).fill(null));
  for (let i = 0; i <= step && i < replayHistory.length; i++) {
    const move = replayHistory[i];
    board[move.position.y][move.position.x] = move.player;
  }
  return board;
};
```

### 3.2 簡化 handleStartReplay (約第 580-586 行)
```typescript
// ❌ 舊代碼
const handleStartReplay = () => {
  if (!room || !room.history || room.history.length === 0) return;
  setReplayHistory([...room.history]);
  setIsReplaying(true);
  setReplayStep(0);
  setIsAutoPlaying(true);
};

// ✅ 新代碼
const handleStartReplay = () => {
  if (!room?.history || room.history.length === 0) return;
  replay.startReplay(room.history);
};
```

### 3.3 簡化 handleExitReplay (約第 589-598 行)
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

### 3.4 簡化其他回放函數 (約第 601-624 行)
```typescript
// ❌ 舊代碼
const handleReplayPrevious = () => {
  if (replayStep > 0) {
    setReplayStep(prev => prev - 1);
  }
};

const handleReplayNext = () => {
  if (replayStep < replayHistory.length - 1) {
    setReplayStep(prev => prev + 1);
  }
};

const handleReplayRestart = () => {
  setReplayStep(0);
  setIsAutoPlaying(false);
};

const handleToggleAutoPlay = () => {
  setIsAutoPlaying(prev => !prev);
};

// ✅ 新代碼
const handleReplayPrevious = () => {
  replay.previousStep();
};

const handleReplayNext = () => {
  replay.nextStep();
};

const handleReplayRestart = () => {
  replay.restartReplay();
};

const handleToggleAutoPlay = () => {
  replay.toggleAutoPlay();
};
```

### 3.5 刪除 useEffect (約第 626-645 行)
```typescript
// ❌ 刪除整個 useEffect（Hook 內部已處理）
useEffect(() => {
  if (isAutoPlaying) {
    autoPlayTimer.current = setInterval(() => {
      setReplayStep(prev => {
        if (prev >= replayHistory.length - 1) {
          setIsAutoPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, REPLAY_CONFIG.AUTO_PLAY_INTERVAL_MS);

    return () => {
      if (autoPlayTimer.current) {
        clearInterval(autoPlayTimer.current);
        autoPlayTimer.current = null;
      }
    };
  }
}, [isAutoPlaying, replayHistory]);
```

### 3.6 簡化 handleReplayFastForward (約第 648-652 行)
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

---

## 步驟 4: 更新所有狀態引用

使用全局搜尋替換 (Ctrl+H):

1. `isReplaying` → `replay.isReplaying`
2. `replayStep` → `replay.replayStep`
3. `isAutoPlaying` → `replay.isAutoPlaying`
4. `replayHistory` → `replay.replayHistory`
5. `getReplayBoard(` → `replay.getReplayBoard(`

**注意**: 不要替換函數定義中的名稱，只替換使用的地方

---

## 步驟 5: 測試

1. 運行構建: `npm run build`
2. 檢查是否有 TypeScript 錯誤
3. 測試回放功能

---

## 預期結果

- **代碼減少**: ~80 行
- **函數簡化**: 8 個函數從複雜邏輯變為單行調用
- **可維護性**: 大幅提升
- **測試性**: Hook 可獨立測試

---

## 快速執行方案

如果手動編輯太繁瑣，可以：

1. **使用 IDE 的重構功能**
   - 使用 VS Code 的多游標編輯
   - 使用搜尋替換功能

2. **分批提交**
   - 先替換函數
   - 再更新引用
   - 最後測試

3. **使用腳本**
   - 創建自動化腳本處理替換

---

**創建時間**: 2026-01-14 19:25  
**狀態**: 指南已創建，待執行
