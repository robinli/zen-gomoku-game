# 項目 1 - 下一步行動方案

**時間**: 2026-01-14 19:31  
**當前狀態**: useReplay Hook 60% 完成  
**建議**: 調整策略，優先完成可測試的部分

---

## 🎯 當前情況分析

### 已完成
1. ✅ useRoomStats Hook (100%) - 完全整合並測試
2. 🔄 useReplay Hook (60%) - 已創建，部分整合

### 遇到的挑戰
- 手動編輯 App.tsx 比較複雜
- 需要替換多處代碼
- 容易出錯

---

## 💡 建議的三個方案

### 方案 A: 完成 useReplay 整合 (手動編輯)
**時間**: 20-30 分鐘  
**方式**: 您自己使用 VS Code 按照指南完成  
**優點**: 完成第二個 Hook  
**缺點**: 需要手動操作

**步驟**:
1. 打開 `useReplay-integration-guide.md`
2. 使用 VS Code 搜尋替換
3. 逐步完成

---

### 方案 B: 創建更簡單的 Hook (推薦) ⭐
**時間**: 1-2 小時  
**內容**: 創建並整合更小、更獨立的 Hook

**建議創建的 Hook**:

#### 1. useGameActions Hook (最簡單)
**功能**: 管理遊戲動作 (下棋、悔棋、重置)  
**工時**: 30-40 分鐘  
**優點**: 
- 邏輯獨立
- 容易整合
- 立即可測試

#### 2. useDialogs Hook (簡單)
**功能**: 管理所有對話框狀態  
**工時**: 30-40 分鐘  
**優點**:
- 純狀態管理
- 無複雜邏輯
- 快速完成

#### 3. useConnection Hook (中等)
**功能**: 管理連線狀態  
**工時**: 40-50 分鐘  
**優點**:
- 職責明確
- 提升可讀性

---

### 方案 C: 跳過 Hook，直接拆分組件
**時間**: 2-3 小時  
**內容**: 創建獨立組件

**建議組件**:
1. **DialogManager** - 統一管理對話框
2. **GameHeader** - 遊戲頂部資訊
3. **GameControls** - 遊戲控制按鈕

---

## 🎯 我的推薦

### 推薦方案：B1 - 創建 useGameActions Hook

**理由**:
1. ✅ 最簡單、最獨立
2. ✅ 1 小時內可完成
3. ✅ 立即可測試
4. ✅ 為後續重構提供範例

**內容**:
```typescript
// useGameActions.ts
export function useGameActions(room, localPlayer, socketService) {
  const handleMove = (pos: Position) => {
    // 下棋邏輯
  };
  
  const handleRequestUndo = () => {
    // 悔棋請求
  };
  
  const handleRequestReset = () => {
    // 重置請求
  };
  
  return {
    handleMove,
    handleRequestUndo,
    handleRequestReset,
  };
}
```

**收益**:
- 從 App.tsx 提取 ~50 行代碼
- 邏輯更清晰
- 易於測試

---

## 📊 各方案對比

| 方案 | 時間 | 難度 | 收益 | 推薦度 |
|------|------|------|------|--------|
| A. 完成 useReplay | 20-30分鐘 | 中 | 中 | ⭐⭐⭐ |
| B1. useGameActions | 30-40分鐘 | 低 | 高 | ⭐⭐⭐⭐⭐ |
| B2. useDialogs | 30-40分鐘 | 低 | 中 | ⭐⭐⭐⭐ |
| B3. useConnection | 40-50分鐘 | 中 | 中 | ⭐⭐⭐ |
| C. 拆分組件 | 2-3小時 | 高 | 高 | ⭐⭐⭐ |

---

## 🚀 建議執行順序

### 如果您有 1 小時
1. 創建 useGameActions Hook (40分鐘)
2. 測試 (10分鐘)
3. 提交 (10分鐘)

### 如果您有 2 小時
1. 創建 useGameActions Hook (40分鐘)
2. 創建 useDialogs Hook (40分鐘)
3. 測試和提交 (40分鐘)

### 如果您有 3+ 小時
1. 完成上述兩個 Hook
2. 手動完成 useReplay 整合 (30分鐘)
3. 創建 useConnection Hook (50分鐘)
4. 測試和提交 (40分鐘)

---

## ❓ 您的選擇

請告訴我您想要：

**A.** 我自己手動完成 useReplay 整合  
**B1.** 創建 useGameActions Hook (推薦) ⭐  
**B2.** 創建 useDialogs Hook  
**B3.** 創建 useConnection Hook  
**C.** 拆分組件  
**D.** 其他想法

---

**創建時間**: 2026-01-14 19:31  
**狀態**: 等待您的決定
