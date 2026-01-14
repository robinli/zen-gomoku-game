# 項目 11: 添加單元測試 - 實施計劃

**預估工時**: 12-16 小時  
**優先級**: 🟡 中優先級 → 🔴 高優先級 (建議提升)  
**狀態**: 未開始

---

## 🎯 目標

建立完整的測試體系，確保：
1. ✅ 每次修改後可以自動測試
2. ✅ 重構時有信心不會破壞功能
3. ✅ 新功能有測試保護
4. ✅ 可以在 CI/CD 中自動運行

---

## 📊 測試策略

### 測試金字塔
```
        /\
       /  \  E2E (10%)
      /    \
     /------\  Integration (20%)
    /        \
   /----------\  Unit Tests (70%)
  /______________\
```

### 覆蓋率目標
- **核心邏輯**: 90%+
- **Hook**: 80%+
- **組件**: 70%+
- **整體**: 75%+

---

## 🛠️ 技術棧

### 測試框架
- **Vitest** - 快速、Vite 原生支持
- **React Testing Library** - 測試 React 組件
- **@testing-library/react-hooks** - 測試 Hook
- **@testing-library/user-event** - 模擬用戶操作
- **MSW** - 模擬 API/Socket 請求

### 為什麼選擇 Vitest？
- ✅ 與 Vite 完美整合
- ✅ 速度快 (使用 ESM)
- ✅ 兼容 Jest API
- ✅ 內建覆蓋率報告
- ✅ UI 模式方便調試

---

## 📝 實施階段

### 階段 1: 設置測試環境 (2-3h)

#### 1.1 安裝依賴
```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/react-hooks @testing-library/user-event @testing-library/jest-dom jsdom
```

#### 1.2 配置 Vitest
創建 `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
      ],
    },
  },
});
```

#### 1.3 創建測試設置文件
`src/test/setup.ts`:
```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// 每個測試後清理
afterEach(() => {
  cleanup();
});
```

#### 1.4 更新 package.json
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

### 階段 2: 測試核心邏輯 (3-4h)

#### 2.1 測試 gameLogic.ts
`src/utils/__tests__/gameLogic.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { checkWin, createEmptyBoard } from '../gameLogic';

describe('gameLogic', () => {
  describe('createEmptyBoard', () => {
    it('should create a 15x15 empty board', () => {
      const board = createEmptyBoard();
      expect(board).toHaveLength(15);
      expect(board[0]).toHaveLength(15);
      expect(board[0][0]).toBeNull();
    });
  });

  describe('checkWin', () => {
    it('should detect horizontal win', () => {
      const board = createEmptyBoard();
      // 放置 5 個黑子在橫排
      for (let i = 0; i < 5; i++) {
        board[7][i] = 'black';
      }
      const result = checkWin(board, { x: 4, y: 7 }, 'black');
      expect(result).toBeTruthy();
      expect(result?.length).toBe(5);
    });

    it('should detect vertical win', () => {
      const board = createEmptyBoard();
      // 放置 5 個白子在直排
      for (let i = 0; i < 5; i++) {
        board[i][7] = 'white';
      }
      const result = checkWin(board, { x: 7, y: 4 }, 'white');
      expect(result).toBeTruthy();
    });

    it('should not detect win with only 4 pieces', () => {
      const board = createEmptyBoard();
      for (let i = 0; i < 4; i++) {
        board[7][i] = 'black';
      }
      const result = checkWin(board, { x: 3, y: 7 }, 'black');
      expect(result).toBeNull();
    });
  });
});
```

#### 2.2 測試 secureStorage.ts
`src/utils/__tests__/secureStorage.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { secureStorage } from '../secureStorage';

describe('secureStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should encrypt and decrypt string data', () => {
    secureStorage.setItem('test', 'hello');
    const value = secureStorage.getItem('test');
    expect(value).toBe('hello');
  });

  it('should handle JSON data', () => {
    const data = { name: 'test', value: 123 };
    secureStorage.setItem('json', data);
    const result = secureStorage.getJSON('json');
    expect(result).toEqual(data);
  });

  it('should return null for non-existent key', () => {
    const value = secureStorage.getItem('nonexistent');
    expect(value).toBeNull();
  });
});
```

#### 2.3 測試 logger.ts
`src/utils/__tests__/logger.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { logger } from '../logger';

describe('logger', () => {
  it('should log in development mode', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    logger.log('test message');
    // 根據環境決定是否應該被調用
    if (import.meta.env.DEV) {
      expect(consoleSpy).toHaveBeenCalled();
    }
    consoleSpy.mockRestore();
  });

  it('should always log errors', () => {
    const consoleSpy = vi.spyOn(console, 'error');
    logger.error('error message');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
```

---

### 階段 3: 測試自定義 Hook (4-5h)

#### 3.1 測試 useRoomStats
`src/hooks/__tests__/useRoomStats.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useRoomStats } from '../useRoomStats';

describe('useRoomStats', () => {
  it('should initialize with zero stats', () => {
    const { result } = renderHook(() => useRoomStats());
    
    expect(result.current.roomStats).toEqual({
      black: { wins: 0, losses: 0, draws: 0 },
      white: { wins: 0, losses: 0, draws: 0 },
    });
  });

  it('should update stats when black wins', () => {
    const { result } = renderHook(() => useRoomStats());
    
    act(() => {
      result.current.updateStats('black');
    });

    expect(result.current.roomStats.black.wins).toBe(1);
    expect(result.current.roomStats.white.losses).toBe(1);
  });

  it('should handle draw', () => {
    const { result } = renderHook(() => useRoomStats());
    
    act(() => {
      result.current.updateStats('draw');
    });

    expect(result.current.roomStats.black.draws).toBe(1);
    expect(result.current.roomStats.white.draws).toBe(1);
  });

  it('should reset stats', () => {
    const { result } = renderHook(() => useRoomStats());
    
    act(() => {
      result.current.updateStats('black');
      result.current.resetStats();
    });

    expect(result.current.roomStats.black.wins).toBe(0);
  });

  it('should prevent duplicate updates', () => {
    const { result } = renderHook(() => useRoomStats());
    
    act(() => {
      result.current.updateStats('black');
      result.current.updateStats('black'); // 重複更新
    });

    expect(result.current.roomStats.black.wins).toBe(1); // 只計一次
  });
});
```

#### 3.2 測試 useEffectOnce
`src/hooks/__tests__/useEffectOnce.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react-hooks';
import { useEffectOnce } from '../useEffectOnce';

describe('useEffectOnce', () => {
  it('should run effect only once', () => {
    const effect = vi.fn();
    const { rerender } = renderHook(() => useEffectOnce(effect));
    
    expect(effect).toHaveBeenCalledTimes(1);
    
    // 重新渲染
    rerender();
    rerender();
    
    // 仍然只調用一次
    expect(effect).toHaveBeenCalledTimes(1);
  });

  it('should run cleanup on unmount', () => {
    const cleanup = vi.fn();
    const effect = vi.fn(() => cleanup);
    
    const { unmount } = renderHook(() => useEffectOnce(effect));
    
    unmount();
    
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
```

---

### 階段 4: 測試組件 (3-4h)

#### 4.1 測試 Board 組件
`src/components/__tests__/Board.test.tsx`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Board from '../Board';
import { createEmptyBoard } from '../../utils/gameLogic';

describe('Board', () => {
  it('should render 15x15 grid', () => {
    const board = createEmptyBoard();
    const { container } = render(
      <Board 
        board={board} 
        onCellClick={vi.fn()} 
        disabled={false}
      />
    );
    
    const cells = container.querySelectorAll('.cell');
    expect(cells).toHaveLength(225); // 15 * 15
  });

  it('should call onCellClick when cell is clicked', () => {
    const board = createEmptyBoard();
    const handleClick = vi.fn();
    
    render(
      <Board 
        board={board} 
        onCellClick={handleClick} 
        disabled={false}
      />
    );
    
    const firstCell = screen.getAllByRole('button')[0];
    fireEvent.click(firstCell);
    
    expect(handleClick).toHaveBeenCalledWith({ x: 0, y: 0 });
  });

  it('should not call onCellClick when disabled', () => {
    const board = createEmptyBoard();
    const handleClick = vi.fn();
    
    render(
      <Board 
        board={board} 
        onCellClick={handleClick} 
        disabled={true}
      />
    );
    
    const firstCell = screen.getAllByRole('button')[0];
    fireEvent.click(firstCell);
    
    expect(handleClick).not.toHaveBeenCalled();
  });
});
```

---

### 階段 5: CI/CD 整合 (1h)

#### 5.1 創建 GitHub Actions 工作流
`.github/workflows/test.yml`:
```yaml
name: Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        cd client && npm ci
        cd ../server && npm ci
        
    - name: Run client tests
      run: cd client && npm test
      
    - name: Run server tests
      run: cd server && npm test
      
    - name: Generate coverage
      run: cd client && npm run test:coverage
      
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./client/coverage/coverage-final.json
```

---

## 📊 預期成果

### 測試覆蓋率
- **gameLogic.ts**: 95%+
- **Hooks**: 85%+
- **Components**: 75%+
- **整體**: 80%+

### 測試數量
- **單元測試**: 50-70 個
- **集成測試**: 10-15 個
- **總計**: 60-85 個

### 執行時間
- **所有測試**: < 10 秒
- **覆蓋率報告**: < 15 秒

---

## 💡 最佳實踐

### 1. 測試命名
```typescript
describe('功能模塊', () => {
  it('should 預期行為 when 特定條件', () => {
    // ...
  });
});
```

### 2. AAA 模式
```typescript
it('should do something', () => {
  // Arrange (準備)
  const input = 'test';
  
  // Act (執行)
  const result = doSomething(input);
  
  // Assert (斷言)
  expect(result).toBe('expected');
});
```

### 3. 測試獨立性
- 每個測試應該獨立運行
- 使用 beforeEach 清理狀態
- 不依賴其他測試的結果

### 4. Mock 外部依賴
- Socket 連線
- LocalStorage
- API 請求

---

## 🎯 執行計劃

### Week 1 (6-8h)
- [ ] 設置測試環境
- [ ] 測試核心邏輯
- [ ] 測試 2-3 個 Hook

### Week 2 (6-8h)
- [ ] 測試剩餘 Hook
- [ ] 測試主要組件
- [ ] 設置 CI/CD

---

## ✅ 驗收標準

- [ ] 測試覆蓋率 > 75%
- [ ] 所有核心邏輯有測試
- [ ] 所有 Hook 有測試
- [ ] 主要組件有測試
- [ ] CI/CD 自動運行測試
- [ ] 測試文檔完整

---

**創建時間**: 2026-01-14 20:20  
**狀態**: 計劃已完成，待執行  
**優先級建議**: 提升為高優先級
