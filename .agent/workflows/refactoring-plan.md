---
description: 靜弈五子棋 - 程式碼重構計劃
---

# 🔧 靜弈五子棋 - 程式碼重構計劃

**創建日期**: 2026-01-14  
**狀態**: 待執行  
**預估工時**: 40-60 小時

---

## 📊 重構優先級分類

### 🔴 高優先級 (P0) - 架構與設計問題
必須優先處理，影響系統穩定性和可維護性

### 🟡 中優先級 (P1) - 程式碼品質問題
應盡快處理，影響開發效率和程式碼品質

### 🟢 低優先級 (P2) - 優化建議
可逐步改進，提升用戶體驗和性能

---

## 🔴 高優先級重構項目

### ✅ 項目 1: 拆分 App.tsx 龐大組件

**問題描述**:
- `App.tsx` 達 980 行，包含過多業務邏輯和狀態管理
- 違反單一職責原則，難以維護和測試

**重構方案**:
1. 創建自定義 Hook:
   - `useSocketEvents.ts` - 封裝所有 Socket 事件監聽邏輯
   - `useReplay.ts` - 封裝回放功能相關邏輯
   - `useRoomStats.ts` - 封裝房間統計邏輯
   - `useGameState.ts` - 封裝遊戲狀態管理

2. 創建 Context:
   - `GameContext.tsx` - 提供全局遊戲狀態
   - `SocketContext.tsx` - 提供 Socket 連線狀態

3. 拆分組件:
   - `GameContainer.tsx` - 遊戲主容器
   - `GameHeader.tsx` - 頂部資訊條
   - `DialogManager.tsx` - 統一管理所有對話框

**預估工時**: 8-12 小時

**影響範圍**:
- `client/src/App.tsx`
- 新增 `client/src/hooks/` 目錄
- 新增 `client/src/contexts/` 目錄

**驗收標準**:
- [ ] App.tsx 縮減至 200 行以內
- [ ] 所有自定義 Hook 有清晰的職責劃分
- [ ] 組件可獨立測試

---

### ✅ 項目 2: 統一狀態管理邏輯

**問題描述**:
- `roomStatsRef` 和 `roomStats` 同時存在，容易造成同步問題
- 狀態更新邏輯分散，難以追蹤

**重構方案**:
1. 使用 `useReducer` 替代多個 `useState`
2. 創建統一的狀態更新 actions
3. 實現狀態持久化機制

**程式碼範例**:
```typescript
// client/src/reducers/gameReducer.ts
type GameAction = 
  | { type: 'UPDATE_ROOM'; payload: Partial<GameRoom> }
  | { type: 'UPDATE_STATS'; payload: { winner: Player | 'draw' } }
  | { type: 'RESET_STATS' };

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'UPDATE_ROOM':
      return { ...state, room: { ...state.room, ...action.payload } };
    case 'UPDATE_STATS':
      // 統一的統計更新邏輯
      return updateStats(state, action.payload.winner);
    case 'RESET_STATS':
      return { ...state, roomStats: initialStats };
    default:
      return state;
  }
};
```

**預估工時**: 4-6 小時

**影響範圍**:
- `client/src/App.tsx`
- 新增 `client/src/reducers/gameReducer.ts`

**驗收標準**:
- [ ] 移除所有 ref 狀態管理
- [ ] 狀態更新邏輯集中在 reducer
- [ ] 無狀態同步問題

---

### ✅ 項目 3: 修復 Socket.IO CDN 依賴

**問題描述**:
- `socketService.ts` 使用全域 `io` 變數，依賴 CDN 載入
- 不符合現代前端開發最佳實踐
- 可能導致載入失敗或版本不一致

**重構方案**:
1. 移除 `index.html` 中的 Socket.IO CDN script
2. 修改 `socketService.ts` 使用 npm 套件

**程式碼範例**:
```typescript
// client/src/services/socketService.ts
import { io, Socket } from 'socket.io-client';
import type { GameRoom, Player, Position, GameSettings, BoardState } from '../types';

class SocketService {
    private socket: Socket | null = null;
    private serverUrl: string;

    constructor() {
        this.serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
        console.log('🏗️ SocketService 已創建，Server URL:', this.serverUrl);
    }

    connect(): Socket | null {
        if (this.socket?.connected) {
            console.log('✅ Socket 已連線，Socket ID:', this.socket.id);
            return this.socket;
        }

        console.log('🔗 開始連線到:', this.serverUrl);

        try {
            this.socket = io(this.serverUrl, {
                transports: ['polling', 'websocket'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            // ... 其他邏輯
            return this.socket;
        } catch (error) {
            console.error('❌ 創建 Socket 時發生錯誤:', error);
            return null;
        }
    }
    // ... 其他方法
}
```

**預估工時**: 2-3 小時

**影響範圍**:
- `client/src/services/socketService.ts`
- `client/index.html`

**驗收標準**:
- [ ] 移除 CDN script 標籤
- [ ] 使用 npm 套件導入
- [ ] 所有功能正常運作

---

## 🟡 中優先級重構項目

### ✅ 項目 4: 重構 Socket 事件監聽器

**問題描述**:
- `App.tsx` 中有大量的 Socket 事件監聽 (第 102-409 行)
- 缺少統一的清理機制，可能造成記憶體洩漏

**重構方案**:
1. 創建 `useSocketEvents` Hook
2. 實現自動清理機制
3. 使用事件映射表簡化代碼

**程式碼範例**:
```typescript
// client/src/hooks/useSocketEvents.ts
export const useSocketEvents = (
  setRoom: Dispatch<SetStateAction<GameRoom | null>>,
  setError: Dispatch<SetStateAction<string | null>>,
  // ... 其他 setters
) => {
  useEffect(() => {
    const handlers = {
      onConnect: () => {
        console.log('Socket 連線成功');
        setIsConnected(true);
      },
      onGameUpdate: (data: any) => {
        setRoom(prev => ({ ...prev, ...data }));
      },
      onError: ({ message }: { message: string }) => {
        setError(message);
      },
      // ... 其他事件處理器
    };

    // 註冊所有事件
    socketService.onConnect(handlers.onConnect);
    socketService.onGameUpdate(handlers.onGameUpdate);
    socketService.onError(handlers.onError);

    // 清理函數
    return () => {
      socketService.removeAllListeners();
    };
  }, []);
};
```

**預估工時**: 6-8 小時

**影響範圍**:
- `client/src/App.tsx`
- 新增 `client/src/hooks/useSocketEvents.ts`

**驗收標準**:
- [ ] 所有事件監聽器集中管理
- [ ] 正確實現清理機制
- [ ] 無記憶體洩漏

---

### ✅ 項目 5: 統一類型定義

**問題描述**:
- Client 和 Server 的 `types.ts` 有重複定義
- 類型不一致可能導致通訊錯誤

**重構方案**:
1. 創建共享類型套件 `@zen-gomoku/shared-types`
2. 使用 TypeScript Project References
3. 或使用 monorepo 工具 (如 Turborepo)

**目錄結構**:
```
zen-gomoku-game/
├── packages/
│   └── shared-types/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── game.types.ts
│           └── socket.types.ts
├── client/
│   └── package.json (依賴 @zen-gomoku/shared-types)
└── server/
    └── package.json (依賴 @zen-gomoku/shared-types)
```

**預估工時**: 4-6 小時

**影響範圍**:
- 新增 `packages/shared-types/`
- `client/src/types.ts`
- `server/src/types.ts`
- `package.json` (workspace 配置)

**驗收標準**:
- [ ] 移除重複的類型定義
- [ ] Client 和 Server 使用相同類型
- [ ] 類型變更自動同步

---

### ✅ 項目 6: 提取配置常數

**問題描述**:
- 硬編碼的魔術數字散落各處
- 難以統一調整配置

**重構方案**:
創建配置文件集中管理

**程式碼範例**:
```typescript
// client/src/config/constants.ts
export const GAME_CONFIG = {
  BOARD_SIZE: 15,
  REPLAY_INTERVAL_MS: 1000,
  THREAT_DISPLAY_DURATION_MS: 3000,
  AUTO_SAVE_INTERVAL_MS: 5000,
} as const;

// server/src/config/constants.ts
export const SERVER_CONFIG = {
  GRACE_PERIOD_MS: 30 * 1000,
  IDLE_ROOM_TIMEOUT_MS: 15 * 60 * 1000,
  MAX_UNDO_LIMIT: 10,
} as const;
```

**預估工時**: 2-3 小時

**影響範圍**:
- 新增 `client/src/config/constants.ts`
- 新增 `server/src/config/constants.ts`
- `App.tsx`, `roomManager.ts` 等多個文件

**驗收標準**:
- [ ] 所有魔術數字提取為常數
- [ ] 配置集中管理
- [ ] 添加配置說明註釋

---

### ✅ 項目 7: 統一錯誤處理機制

**問題描述**:
- 錯誤處理邏輯分散
- 缺少統一的錯誤類型和處理流程

**重構方案**:
1. 創建自定義錯誤類
2. 實現全局錯誤處理器
3. 統一錯誤訊息格式

**程式碼範例**:
```typescript
// client/src/utils/errors.ts
export class GameError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'info' | 'warning' | 'error'
  ) {
    super(message);
    this.name = 'GameError';
  }
}

export const handleError = (error: unknown, context: string) => {
  if (error instanceof GameError) {
    console.error(`[${context}] ${error.code}: ${error.message}`);
    // 顯示用戶友好的錯誤訊息
    showErrorDialog(error);
  } else {
    console.error(`[${context}] Unexpected error:`, error);
    showErrorDialog(new GameError('發生未知錯誤', 'UNKNOWN_ERROR', 'error'));
  }
};
```

**預估工時**: 4-5 小時

**影響範圍**:
- 新增 `client/src/utils/errors.ts`
- `socketService.ts`, `App.tsx` 等多個文件

**驗收標準**:
- [ ] 所有錯誤使用統一處理
- [ ] 錯誤訊息用戶友好
- [ ] 錯誤日誌完整

---

## 🟢 低優先級重構項目

### ✅ 項目 8: 移除生產環境 Console.log

**問題描述**:
- 生產環境仍有大量 console.log
- 可能洩露敏感資訊，影響性能

**重構方案**:
1. 創建日誌工具類
2. 使用環境變數控制日誌級別

**程式碼範例**:
```typescript
// client/src/utils/logger.ts
const LOG_LEVEL = import.meta.env.VITE_LOG_LEVEL || 'info';

class Logger {
  private shouldLog(level: string): boolean {
    if (import.meta.env.PROD && level === 'debug') return false;
    return true;
  }

  debug(...args: any[]) {
    if (this.shouldLog('debug')) console.debug('[DEBUG]', ...args);
  }

  info(...args: any[]) {
    if (this.shouldLog('info')) console.info('[INFO]', ...args);
  }

  error(...args: any[]) {
    console.error('[ERROR]', ...args);
  }
}

export const logger = new Logger();
```

**預估工時**: 3-4 小時

**影響範圍**:
- 新增 `client/src/utils/logger.ts`
- 所有包含 console.log 的文件

**驗收標準**:
- [ ] 生產環境無 debug 日誌
- [ ] 開發環境日誌完整
- [ ] 錯誤日誌保留

---

### ✅ 項目 9: 重構 CSS 樣式

**問題描述**:
- 組件中有大量 Tailwind 類名字串
- 難以維護和重用

**重構方案**:
1. 提取常用樣式為組件
2. 使用 CSS Modules 或 styled-components
3. 創建設計系統

**程式碼範例**:
```typescript
// client/src/components/ui/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'rounded-xl font-semibold transition-all active:scale-95',
  {
    variants: {
      variant: {
        primary: 'bg-slate-900 text-white hover:bg-slate-800',
        secondary: 'bg-slate-50 text-slate-900 hover:bg-slate-100',
      },
      size: {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export const Button = ({ variant, size, children, ...props }: ButtonProps) => (
  <button className={buttonVariants({ variant, size })} {...props}>
    {children}
  </button>
);
```

**預估工時**: 6-8 小時

**影響範圍**:
- 新增 `client/src/components/ui/` 目錄
- 所有組件文件

**驗收標準**:
- [ ] 常用樣式組件化
- [ ] 減少重複樣式代碼
- [ ] 設計系統文檔

---

### ✅ 項目 10: Server 端國際化

**問題描述**:
- Server 端錯誤訊息硬編碼中文
- 不支援多語言

**重構方案**:
使用 i18next 或類似庫

**程式碼範例**:
```typescript
// server/src/i18n/index.ts
import i18next from 'i18next';

i18next.init({
  lng: 'zh-TW',
  resources: {
    'zh-TW': {
      translation: {
        'error.room_not_found': '房間不存在',
        'error.room_full': '房間已滿',
      }
    },
    'en': {
      translation: {
        'error.room_not_found': 'Room not found',
        'error.room_full': 'Room is full',
      }
    }
  }
});

export const t = i18next.t.bind(i18next);
```

**預估工時**: 3-4 小時

**影響範圍**:
- 新增 `server/src/i18n/`
- `server/src/index.ts`

**驗收標準**:
- [ ] 所有訊息支援多語言
- [ ] 語言切換正常
- [ ] 翻譯完整

---

### ✅ 項目 11: 添加單元測試

**問題描述**:
- 專案缺少測試
- 重構風險高

**重構方案**:
1. 設置測試環境 (Vitest + React Testing Library)
2. 為核心邏輯添加測試

**測試範例**:
```typescript
// client/src/utils/__tests__/gameLogic.test.ts
import { describe, it, expect } from 'vitest';
import { checkWin, isBoardFull } from '../gameLogic';

describe('gameLogic', () => {
  describe('checkWin', () => {
    it('should detect horizontal win', () => {
      const board = createEmptyBoard();
      // 設置橫向五連珠
      for (let i = 0; i < 5; i++) {
        board[7][i] = 'black';
      }
      const result = checkWin(board, { x: 4, y: 7 });
      expect(result).not.toBeNull();
      expect(result?.winner).toBe('black');
      expect(result?.line).toHaveLength(5);
    });

    it('should return null for no win', () => {
      const board = createEmptyBoard();
      board[7][7] = 'black';
      const result = checkWin(board, { x: 7, y: 7 });
      expect(result).toBeNull();
    });
  });
});
```

**預估工時**: 12-16 小時

**影響範圍**:
- 新增測試配置文件
- 新增 `__tests__` 目錄
- 所有核心模組

**驗收標準**:
- [ ] 測試覆蓋率 > 70%
- [ ] 核心邏輯有完整測試
- [ ] CI/CD 整合測試

---

### ✅ 項目 12: 共享遊戲邏輯

**問題描述**:
- Client 和 Server 都有 `gameLogic.ts`
- 邏輯重複，維護困難

**重構方案**:
將遊戲邏輯移至共享套件

**目錄結構**:
```
packages/
└── game-logic/
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.ts
        ├── checkWin.ts
        ├── checkThreats.ts
        └── boardUtils.ts
```

**預估工時**: 4-6 小時

**影響範圍**:
- 新增 `packages/game-logic/`
- `client/src/utils/gameLogic.ts`
- `server/src/gameLogic.ts`

**驗收標準**:
- [ ] 邏輯只有一份實現
- [ ] Client 和 Server 共用
- [ ] 測試覆蓋完整

---

### ✅ 項目 13: 優化 React Strict Mode 相容性

**問題描述**:
- 使用 `hasInitialized.current` 避免重複初始化
- 不符合 React 最佳實踐

**重構方案**:
使用 React 18 的新特性或狀態管理庫

**程式碼範例**:
```typescript
// 使用 useEffectOnce (react-use)
import { useEffectOnce } from 'react-use';

const App = () => {
  useEffectOnce(() => {
    console.log('只執行一次');
    socketService.connect();
  });
};

// 或使用 Zustand
import create from 'zustand';

const useSocketStore = create((set) => ({
  isInitialized: false,
  initialize: () => {
    set({ isInitialized: true });
    socketService.connect();
  },
}));
```

**預估工時**: 2-3 小時

**影響範圍**:
- `client/src/App.tsx`

**驗收標準**:
- [ ] 移除 hasInitialized ref
- [ ] Strict Mode 正常運作
- [ ] 無重複初始化

---

### ✅ 項目 14: 加密 localStorage 資料

**問題描述**:
- 敏感資料直接存儲在 localStorage
- 可能被惡意腳本讀取

**重構方案**:
1. 使用 crypto-js 加密
2. 或改用 sessionStorage (會話級別)

**程式碼範例**:
```typescript
// client/src/utils/storage.ts
import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_STORAGE_SECRET || 'default-secret';

export const secureStorage = {
  setItem(key: string, value: any) {
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(value),
      SECRET_KEY
    ).toString();
    localStorage.setItem(key, encrypted);
  },

  getItem(key: string) {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    
    const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
    return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
  },

  removeItem(key: string) {
    localStorage.removeItem(key);
  }
};
```

**預估工時**: 2-3 小時

**影響範圍**:
- 新增 `client/src/utils/storage.ts`
- `client/src/App.tsx`

**驗收標準**:
- [ ] 敏感資料加密存儲
- [ ] 讀寫功能正常
- [ ] 向後相容處理

---

### ✅ 項目 15: 啟用 TypeScript 嚴格模式

**問題描述**:
- TypeScript 配置可能未啟用所有嚴格檢查
- 可能存在類型安全問題

**重構方案**:
更新 `tsconfig.json`

**程式碼範例**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**預估工時**: 4-6 小時 (修復所有類型錯誤)

**影響範圍**:
- `client/tsconfig.json`
- `server/tsconfig.json`
- 可能需要修復多個文件的類型問題

**驗收標準**:
- [ ] 嚴格模式啟用
- [ ] 無類型錯誤
- [ ] 類型覆蓋完整

---

### ✅ 項目 16: React 性能優化

**問題描述**:
- 組件可能不必要地重新渲染
- 影響性能和用戶體驗

**重構方案**:
1. 使用 React.memo
2. 使用 useMemo 和 useCallback
3. 使用 React DevTools Profiler 分析

**程式碼範例**:
```typescript
// client/src/components/Board.tsx
import React, { memo, useMemo, useCallback } from 'react';

const Board = memo(({ board, onMove, lastMove, winner, winningLine, turn, disabled }: BoardProps) => {
  // 緩存計算結果
  const gridLines = useMemo(() => {
    return Array.from({ length: BOARD_SIZE }, (_, i) => i);
  }, []);

  // 緩存回調函數
  const handleCellClick = useCallback((x: number, y: number) => {
    if (disabled || board[y][x]) return;
    onMove({ x, y });
  }, [disabled, board, onMove]);

  return (
    <div className="board">
      {gridLines.map(y => (
        gridLines.map(x => (
          <Cell
            key={`${x}-${y}`}
            x={x}
            y={y}
            value={board[y][x]}
            onClick={handleCellClick}
            isLastMove={lastMove?.x === x && lastMove?.y === y}
            isWinning={winningLine?.some(pos => pos.x === x && pos.y === y)}
          />
        ))
      ))}
    </div>
  );
});

// 自定義比較函數
const arePropsEqual = (prevProps: BoardProps, nextProps: BoardProps) => {
  return (
    prevProps.board === nextProps.board &&
    prevProps.winner === nextProps.winner &&
    prevProps.turn === nextProps.turn &&
    prevProps.disabled === nextProps.disabled
  );
};

export default memo(Board, arePropsEqual);
```

**預估工時**: 4-6 小時

**影響範圍**:
- `client/src/components/Board.tsx`
- `client/src/components/GameInfo.tsx`
- 其他組件

**驗收標準**:
- [ ] 關鍵組件使用 memo
- [ ] 減少不必要的渲染
- [ ] Profiler 顯示性能改善

---

### ✅ 項目 17: 棋盤渲染優化

**問題描述**:
- 每次狀態更新都重新渲染整個棋盤
- 225 個格子 (15x15) 全部重繪

**重構方案**:
1. 僅更新變化的格子
2. 使用虛擬化技術 (如果需要更大棋盤)
3. 使用 Canvas 渲染 (可選)

**程式碼範例**:
```typescript
// client/src/components/Cell.tsx
import React, { memo } from 'react';

interface CellProps {
  x: number;
  y: number;
  value: Player | null;
  onClick: (x: number, y: number) => void;
  isLastMove: boolean;
  isWinning: boolean;
}

const Cell = memo(({ x, y, value, onClick, isLastMove, isWinning }: CellProps) => {
  return (
    <div
      className={`cell ${isLastMove ? 'last-move' : ''} ${isWinning ? 'winning' : ''}`}
      onClick={() => onClick(x, y)}
    >
      {value && <Stone color={value} />}
    </div>
  );
}, (prev, next) => {
  // 只有這些屬性變化時才重新渲染
  return (
    prev.value === next.value &&
    prev.isLastMove === next.isLastMove &&
    prev.isWinning === next.isWinning
  );
});

export default Cell;
```

**預估工時**: 4-5 小時

**影響範圍**:
- `client/src/components/Board.tsx`
- 新增 `client/src/components/Cell.tsx`

**驗收標準**:
- [ ] 只更新變化的格子
- [ ] 渲染性能提升 50%+
- [ ] 無視覺差異

---

### ✅ 項目 18: 加強安全性

**問題描述**:
1. CORS 設定過於寬鬆
2. 缺少輸入驗證

**重構方案**:

#### 18.1 限制 CORS
```typescript
// server/src/index.ts
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = process.env.NODE_ENV === 'production'
        ? [process.env.CLIENT_URL]
        : [/^http:\/\/localhost:\d+$/];
      
      if (!origin || allowedOrigins.some(allowed => 
        typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
      )) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST']
  }
});
```

#### 18.2 輸入驗證
```typescript
// server/src/middleware/validation.ts
import { z } from 'zod';

const MakeMoveSchema = z.object({
  x: z.number().int().min(0).max(14),
  y: z.number().int().min(0).max(14),
});

export const validateMakeMove = (data: unknown) => {
  return MakeMoveSchema.parse(data);
};

// 使用
socket.on('MAKE_MOVE', (data) => {
  try {
    const { x, y } = validateMakeMove(data);
    // 處理落子
  } catch (error) {
    socket.emit('ERROR', { message: '無效的輸入' });
  }
});
```

#### 18.3 速率限制
```typescript
// server/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 100, // 限制 100 次請求
  message: '請求過於頻繁，請稍後再試'
});

// 使用
app.use('/health', apiLimiter);
```

**預估工時**: 4-6 小時

**影響範圍**:
- `server/src/index.ts`
- 新增 `server/src/middleware/`

**驗收標準**:
- [ ] CORS 僅允許指定來源
- [ ] 所有輸入經過驗證
- [ ] 實施速率限制
- [ ] 通過安全掃描

---

## 📋 執行計劃

### 第一階段 (Week 1-2): 高優先級項目
- [ ] 項目 1: 拆分 App.tsx
- [ ] 項目 2: 統一狀態管理
- [ ] 項目 3: 修復 Socket.IO CDN

**預估總工時**: 14-21 小時

### 第二階段 (Week 3-4): 中優先級項目
- [ ] 項目 4: 重構 Socket 事件監聽器
- [ ] 項目 5: 統一類型定義
- [ ] 項目 6: 提取配置常數
- [ ] 項目 7: 統一錯誤處理

**預估總工時**: 16-22 小時

### 第三階段 (Week 5-6): 低優先級項目
- [ ] 項目 8: 移除 Console.log
- [ ] 項目 9: 重構 CSS 樣式
- [ ] 項目 10: Server 端國際化
- [ ] 項目 11: 添加單元測試
- [ ] 項目 12: 共享遊戲邏輯

**預估總工時**: 28-38 小時

### 第四階段 (Week 7-8): 優化與加固
- [ ] 項目 13: 優化 Strict Mode
- [ ] 項目 14: 加密 localStorage
- [ ] 項目 15: TypeScript 嚴格模式
- [ ] 項目 16: React 性能優化
- [ ] 項目 17: 棋盤渲染優化
- [ ] 項目 18: 加強安全性

**預估總工時**: 20-29 小時

---

## 🎯 總結

**總預估工時**: 78-110 小時  
**建議執行週期**: 8 週  
**每週投入**: 10-14 小時

### 關鍵里程碑
- ✅ Week 2: 完成架構重構，代碼可維護性提升
- ✅ Week 4: 完成代碼品質改善，開發效率提升
- ✅ Week 6: 完成測試覆蓋，系統穩定性提升
- ✅ Week 8: 完成性能優化，用戶體驗提升

### 風險評估
- **高風險**: 項目 1, 2, 5 (架構變更大)
- **中風險**: 項目 4, 11, 15 (需要大量測試)
- **低風險**: 項目 6, 8, 10 (影響範圍小)

### 建議
1. 每完成一個項目立即測試
2. 使用 Git 分支管理，每個項目一個分支
3. 重要變更前先備份
4. 逐步推進，不要同時進行多個高風險項目

---

**最後更新**: 2026-01-14  
**維護者**: Robin Li
