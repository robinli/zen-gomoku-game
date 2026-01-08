# ✅ 統一對話框系統完成

## 實作時間
2026-01-08 13:07

---

## 🎯 目標
創建統一的 Dialog 基礎組件，讓所有對話框使用相同的風格。

---

## 📋 創建的組件

### 1. BaseDialog（基礎對話框）✅
**檔案**：`BaseDialog.tsx` + `BaseDialog.css`

**功能**：
- 提供統一的對話框結構
- 支援 5 種圖示類型：question, error, success, warning, info
- 米白色背景（#faf8f5）
- 統一的動畫效果（淡入 + 滑上）

**Props**：
```typescript
{
  title: string;
  icon?: 'question' | 'error' | 'success' | 'warning' | 'info';
  children: React.ReactNode;
  actions: React.ReactNode;
  onOverlayClick?: () => void;
}
```

---

### 2. DialogButton（統一按鈕）✅
**檔案**：`DialogButton.tsx` + `DialogButton.css`

**功能**：
- 統一的按鈕樣式
- 白色背景 + 灰色邊框
- 支援圖示

**Props**：
```typescript
{
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  icon?: React.ReactNode;
}
```

---

### 3. UndoRequestDialog（悔棋請求）✅ 重構
**使用 BaseDialog + DialogButton**

**特點**：
- 問號圖示（灰色）
- 兩個按鈕：拒絕 / 同意
- 顯示玩家資訊

---

### 4. MessageDialog（訊息對話框）✅ 重構
**使用 BaseDialog + DialogButton**

**特點**：
- 支援三種圖示（error / success / info）
- 單一「確定」按鈕
- 可點擊遮罩關閉

---

### 5. ConfirmDialog（確認對話框）✅ 新增
**使用 BaseDialog + DialogButton**

**特點**：
- 警告圖示（黃色）
- 兩個按鈕：取消 / 確認
- 用於確認操作

---

## 🎨 統一的視覺風格

### 所有對話框共同特點

| 特性 | 值 |
|------|-----|
| 背景顏色 | `#faf8f5`（米白色） |
| 圓角 | `16px` |
| 陰影 | `0 20px 60px rgba(0, 0, 0, 0.3)` |
| 按鈕背景 | `white` |
| 按鈕邊框 | `2px solid #cbd5e1` |
| 按鈕文字 | `#1e293b` |
| 動畫 | 淡入 + 滑上 |

### 圖示顏色

| 類型 | 顏色 | 用途 |
|------|------|------|
| question | `#64748b` 灰色 | 問號 |
| error | `#ef4444` 紅色 | 錯誤 |
| success | `#22c55e` 綠色 | 成功 |
| warning | `#f59e0b` 黃色 | 警告 |
| info | `#3b82f6` 藍色 | 資訊 |

---

## 📊 三個對話框對比

### 1. 悔棋請求
```
┌─────────────────────────────────┐
│  ? 悔棋請求                     │ ← 灰色問號
│  ⚪ 白方 請求悔棋                │
│  是否同意撤銷最後一步？         │
│  [✕ 拒絕]  [✓ 同意]            │ ← 白色按鈕
└─────────────────────────────────┘
```

### 2. 悔棋被拒絕
```
┌─────────────────────────────────┐
│  ✕ 悔棋被拒絕                   │ ← 紅色 X
│  對方拒絕了您的悔棋請求         │
│         [確定]                  │ ← 白色按鈕
└─────────────────────────────────┘
```

### 3. 確認離開（統一後）
```
┌─────────────────────────────────┐
│  ⚠ 確認離開遊戲？               │ ← 黃色警告
│  遊戲正在進行中，離開後對局將   │
│  中斷，對手將收到您離線的通知。 │
│  [取消]  [確認離開]             │ ← 白色按鈕
└─────────────────────────────────┘
```

---

## 🔧 使用範例

### UndoRequestDialog
```tsx
<UndoRequestDialog
  requestedBy="black"
  onAccept={() => handleAccept()}
  onReject={() => handleReject()}
/>
```

### MessageDialog
```tsx
<MessageDialog
  title="悔棋被拒絕"
  message="對方拒絕了您的悔棋請求"
  icon="error"
  onClose={() => setMessageDialog(null)}
/>
```

### ConfirmDialog
```tsx
<ConfirmDialog
  title="確認離開遊戲？"
  message="遊戲正在進行中，離開後對局將中斷..."
  confirmText="確認離開"
  cancelText="取消"
  onConfirm={() => handleConfirm()}
  onCancel={() => handleCancel()}
/>
```

---

## ✅ 改善效果

### 修改前
- ❌ 三個對話框風格不一致
- ❌ 確認對話框：白色背景 + 黑色按鈕
- ❌ 重複的 CSS 代碼
- ❌ 難以維護

### 修改後
- ✅ 所有對話框風格完全一致
- ✅ 米白色背景 + 白色按鈕
- ✅ 共用 BaseDialog 和 DialogButton
- ✅ 易於維護和擴展

---

## 📁 檔案結構

```
components/
├── BaseDialog.tsx          # 基礎對話框組件
├── BaseDialog.css          # 基礎樣式
├── DialogButton.tsx        # 統一按鈕組件
├── DialogButton.css        # 按鈕樣式
├── UndoRequestDialog.tsx   # 悔棋請求（重構）
├── MessageDialog.tsx       # 訊息對話框（重構）
└── ConfirmDialog.tsx       # 確認對話框（新增）
```

**移除的檔案**：
- ~~UndoRequestDialog.css~~ - 不再需要
- ~~MessageDialog.css~~ - 不再需要

---

## 🎯 優勢

### 1. 一致性
- 所有對話框使用相同的基礎組件
- 視覺風格完全統一

### 2. 可維護性
- 修改一處，所有對話框都更新
- 減少重複代碼

### 3. 可擴展性
- 輕鬆添加新的對話框類型
- 只需使用 BaseDialog + DialogButton

### 4. 類型安全
- TypeScript 類型檢查
- 圖示類型限制

---

## 🚀 未來擴展

可以輕鬆創建新的對話框：

```tsx
// 例如：成功對話框
<BaseDialog
  title="操作成功"
  icon="success"
  actions={
    <DialogButton onClick={onClose}>
      確定
    </DialogButton>
  }
>
  <p>您的操作已成功完成！</p>
</BaseDialog>
```

---

## ✅ 完成清單

- ✅ 創建 BaseDialog 組件
- ✅ 創建 DialogButton 組件
- ✅ 重構 UndoRequestDialog
- ✅ 重構 MessageDialog
- ✅ 創建 ConfirmDialog
- ✅ 更新 App.tsx
- ✅ 統一所有對話框風格

---

**版本**：v2.6.0  
**狀態**：✅ 完成，可以測試

**三個對話框現在風格完全一致！** 🎨
