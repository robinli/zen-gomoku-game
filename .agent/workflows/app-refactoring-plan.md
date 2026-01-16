# App.tsx 重構計劃

**日期**: 2026-01-15  
**當前狀態**: App.tsx 有 935 行，包含太多職責  
**目標**: 拆分成更小、更易維護的模塊

---

## 📊 當前問題分析

### 文件統計
- **總行數**: 935 行
- **總字節**: 33.5 KB
- **函數數量**: 21 個
- **狀態變量**: 15+ 個
- **useEffect**: 10+ 個

### 主要問題
1. ❌ **單一職責原則違反** - 一個組件做太多事情
2. ❌ **難以測試** - 邏輯耦合嚴重
3. ❌ **難以維護** - 修改一處可能影響多處
4. ❌ **代碼重複** - 有些邏輯可以抽取
5. ❌ **狀態管理混亂** - 太多 useState

---

## 🎯 重構目標

### 短期目標（本次重構）
1. ✅ 提取 Socket 事件處理邏輯到 Hook
2. ✅ 提取對話框狀態管理到 Hook
3. ✅ 整合已有的 Hook（useReplay, useGameActions）
4. ✅ 簡化 App.tsx 到 < 300 行

### 長期目標（未來迭代）
1. ⏳ 使用 Context 管理全局狀態
2. ⏳ 提取路由邏輯
3. ⏳ 提取連線管理邏輯

---

## 📋 重構步驟

### 階段 1：創建新的 Hook ✅

#### 1.1 創建 `useSocketEvents` Hook
**職責**: 管理所有 Socket 事件監聽和處理

**包含邏輯**:
- ✅ roomCreated 事件
- ✅ roomJoined 事件
- ✅ playerJoined 事件
- ✅ moveMade 事件
- ✅ gameOver 事件
- ✅ undoRequested 事件
- ✅ undoResponse 事件
- ✅ resetRequested 事件
- ✅ resetResponse 事件
- ✅ opponentLeft 事件
- ✅ error 事件

**輸入**:
```typescript
{
  room: GameRoom | null;
  setRoom: (room: GameRoom | null) => void;
  setLocalPlayer: (player: Player | null) => void;
  // ... 其他回調
}
```

**輸出**:
```typescript
{
  // 可能不需要返回任何東西，只是副作用
}
```

---

#### 1.2 創建 `useDialogs` Hook
**職責**: 管理所有對話框狀態

**包含狀態**:
- ✅ undoRequest
- ✅ resetRequest
- ✅ messageDialog
- ✅ showOpponentLeftDialog
- ✅ showConfirm

**輸入**: 無

**輸出**:
```typescript
{
  undoRequest, setUndoRequest,
  resetRequest, setResetRequest,
  messageDialog, setMessageDialog,
  showOpponentLeftDialog, setShowOpponentLeftDialog,
  showConfirm, setShowConfirm,
}
```

---

#### 1.3 創建 `useConnection` Hook
**職責**: 管理連線狀態和重連邏輯

**包含狀態**:
- ✅ isConnected
- ✅ isConnecting
- ✅ isReconnecting
- ✅ error

**包含邏輯**:
- ✅ Socket 連線初始化
- ✅ 重連邏輯
- ✅ 錯誤處理

**輸入**: 無

**輸出**:
```typescript
{
  isConnected,
  isConnecting,
  isReconnecting,
  error,
  setError,
  connect,
  disconnect,
}
```

---

### 階段 2：整合現有 Hook ✅

#### 2.1 整合 `useReplay` Hook
**當前狀態**: 已創建但未完全使用

**需要做的**:
- ✅ 移除 App.tsx 中重複的回放狀態
- ✅ 移除重複的回放函數
- ✅ 使用 useReplay 提供的所有方法

**移除的狀態**:
```typescript
// ❌ 移除這些
const [isReplaying, setIsReplaying] = useState(false);
const [replayStep, setReplayStep] = useState(0);
const [isAutoPlaying, setIsAutoPlaying] = useState(false);
const autoPlayTimer = useRef<number | null>(null);
const [replayHistory, setReplayHistory] = useState<MoveHistory[]>([]);
```

**使用**:
```typescript
// ✅ 使用這個
const replay = useReplay();
// replay.isReplaying
// replay.replayStep
// replay.startReplay(history)
// replay.exitReplay()
// ...
```

---

#### 2.2 整合 `useGameActions` Hook
**當前狀態**: 已創建但未完全使用

**需要做的**:
- ✅ 移除 App.tsx 中重複的遊戲動作函數
- ✅ 使用 useGameActions 提供的所有方法

**移除的函數**:
```typescript
// ❌ 移除這些
handleMove()
handleRequestUndo()
handleRespondUndo()
handleReset()
handleRespondReset()
```

**使用**:
```typescript
// ✅ 使用這個
const gameActions = useGameActions(room, localPlayer, socketService, ...);
// gameActions.handleMove(pos)
// gameActions.handleRequestUndo()
// ...
```

---

### 階段 3：重構 App.tsx ✅

#### 3.1 新的 App.tsx 結構

```typescript
const App: React.FC = () => {
  // 1. 基本狀態（不可再拆分）
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [localPlayer, setLocalPlayer] = useState<Player | null>(null);
  const [roomSettings, setRoomSettings] = useState<GameSettings>(...);
  
  // 2. 使用自定義 Hook
  const connection = useConnection();
  const dialogs = useDialogs();
  const roomStats = useRoomStats();
  const replay = useReplay();
  const gameActions = useGameActions(...);
  
  // 3. Socket 事件處理
  useSocketEvents({
    room, setRoom,
    localPlayer, setLocalPlayer,
    dialogs,
    roomStats,
    connection,
  });
  
  // 4. 房間加入邏輯
  const { handleCreate, handleJoinRoom } = useRoomJoin(...);
  
  // 5. 導航邏輯
  const { goHome, handleGoHome } = useNavigation(...);
  
  // 6. 渲染
  return (
    // JSX (保持不變)
  );
};
```

#### 3.2 預期結果
- ✅ App.tsx < 300 行
- ✅ 邏輯清晰分離
- ✅ 易於測試
- ✅ 易於維護

---

## 🔄 重構流程

### Step 1: 創建 Hook（不影響現有代碼）
1. 創建 `hooks/useConnection.ts`
2. 創建 `hooks/useDialogs.ts`
3. 創建 `hooks/useSocketEvents.ts`
4. 創建 `hooks/useRoomJoin.ts`（可選）
5. 創建 `hooks/useNavigation.ts`（可選）

### Step 2: 在 App.tsx 中使用新 Hook
1. 引入新 Hook
2. 逐步替換舊邏輯
3. 運行測試確保沒有破壞

### Step 3: 清理
1. 移除重複代碼
2. 移除未使用的 import
3. 格式化代碼

### Step 4: 驗證
1. 運行所有測試 ✅
2. 手動測試應用
3. 檢查代碼覆蓋率

---

## ⚠️ 注意事項

### 不要改變的東西
1. ❌ **不要改變組件的 Props 接口** - Board, GameInfo 等組件的 props 保持不變
2. ❌ **不要改變 Socket 事件的處理邏輯** - 只是移動位置，不改變行為
3. ❌ **不要改變 UI 結構** - JSX 保持不變

### 測試策略
1. ✅ **運行現有測試** - 確保 Board 和 GameInfo 測試仍然通過
2. ✅ **手動測試** - 測試創建房間、加入房間、下棋、悔棋、重置等功能
3. ✅ **回歸測試** - 確保沒有破壞現有功能

---

## 📊 重構前後對比

### 重構前
```
App.tsx (935 lines)
├── 15+ useState
├── 10+ useEffect
├── 21 functions
└── 混亂的邏輯
```

### 重構後
```
App.tsx (~250 lines)
├── 3-5 useState (基本狀態)
├── 2-3 useEffect (必要的)
├── 5-8 functions (UI 相關)
└── 清晰的邏輯

+ hooks/useConnection.ts (~100 lines)
+ hooks/useDialogs.ts (~50 lines)
+ hooks/useSocketEvents.ts (~200 lines)
+ hooks/useRoomJoin.ts (~100 lines)
+ hooks/useNavigation.ts (~50 lines)
```

---

## 🎯 成功標準

### 代碼質量
- ✅ App.tsx < 300 行
- ✅ 每個 Hook < 250 行
- ✅ 單一職責原則
- ✅ 易於測試

### 功能完整性
- ✅ 所有現有功能正常工作
- ✅ 所有測試通過
- ✅ 沒有新的 bug

### 可維護性
- ✅ 代碼結構清晰
- ✅ 易於理解
- ✅ 易於擴展

---

## 🚀 開始重構

### 第一步：創建 useDialogs Hook
這是最簡單的，風險最低，可以快速看到效果。

需要我開始創建 `useDialogs` Hook 嗎？
