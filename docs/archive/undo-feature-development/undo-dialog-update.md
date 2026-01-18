# ✅ 悔棋請求對話框調整完成

## 修改時間
2026-01-08 12:45

---

## 🎨 調整內容

### 1. 圖示更新（Emoji → SVG）

#### 標題圖示
**修改前**：`🤔` Emoji  
**修改後**：Heroicons question-mark-circle SVG

#### 玩家圖示
**修改前**：`⚫` `⚪` Emoji  
**修改後**：SVG 圓圈（黑色填充 / 白色描邊）

#### 按鈕圖示
**修改前**：`❌` `✅` Emoji  
**修改後**：Heroicons X 和 check SVG

---

### 2. 按鈕樣式更新

#### 修改前（紫色）
```css
/* 拒絕按鈕 */
background: #f1f5f9;
color: #64748b;

/* 同意按鈕 */
background: #8b5cf6;  /* 紫色 */
color: white;
```

#### 修改後（灰色邊框）
```css
/* 拒絕按鈕 */
background: white;
color: #64748b;
border: 2px solid #cbd5e1;

/* 同意按鈕 */
background: white;
color: #1e293b;
border: 2px solid #cbd5e1;
```

---

## 📊 視覺對比

### 修改前
```
┌─────────────────────────────────┐
│  🤔 悔棋請求                    │ ← Emoji
│                                 │
│  ⚫ 黑方 請求悔棋                │ ← Emoji
│  是否同意撤銷最後一步？         │
│                                 │
│  [❌ 拒絕]  [✅ 同意]           │ ← 紫色按鈕
└─────────────────────────────────┘
```

### 修改後
```
┌─────────────────────────────────┐
│  ? 悔棋請求                     │ ← SVG 圖示
│                                 │
│  ● 黑方 請求悔棋                │ ← SVG 圖示
│  是否同意撤銷最後一步？         │
│                                 │
│  [✕ 拒絕]  [✓ 同意]            │ ← 灰色邊框
└─────────────────────────────────┘
```

---

## 🎯 使用的 SVG 圖示

### 標題圖示
**Heroicons: question-mark-circle**
```tsx
<svg className="undo-dialog-icon">
  <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0..." />
</svg>
```
- 尺寸：2rem × 2rem
- 顏色：#64748b（灰色）

### 玩家圖示
**黑方**：填充圓圈
```tsx
<svg viewBox="0 0 24 24" fill="currentColor" className="player-icon">
  <circle cx="12" cy="12" r="10" />
</svg>
```

**白方**：描邊圓圈
```tsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="player-icon">
  <circle cx="12" cy="12" r="10" />
</svg>
```
- 尺寸：1.5rem × 1.5rem

### 按鈕圖示
**拒絕（X）**：
```tsx
<svg className="w-4 h-4">
  <path d="M6 18L18 6M6 6l12 12" />
</svg>
```

**同意（✓）**：
```tsx
<svg className="w-4 h-4">
  <path d="M4.5 12.75l6 6 9-13.5" />
</svg>
```

---

## 🎨 CSS 樣式更新

### 圖示樣式
```css
.undo-dialog-icon {
  width: 2rem;
  height: 2rem;
  color: #64748b;
}

.player-icon {
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
}
```

### 按鈕樣式
```css
.undo-dialog-btn {
  flex: 1;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border: 2px solid;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.undo-dialog-btn-reject {
  background: white;
  color: #64748b;
  border-color: #cbd5e1;
}

.undo-dialog-btn-reject:hover {
  background: #f8fafc;
  color: #475569;
  border-color: #94a3b8;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.undo-dialog-btn-accept {
  background: white;
  color: #1e293b;
  border-color: #cbd5e1;
}

.undo-dialog-btn-accept:hover {
  background: #f8fafc;
  color: #0f172a;
  border-color: #94a3b8;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

---

## ✅ 改善效果

| 改善項目 | 說明 |
|---------|------|
| ✅ 風格統一 | 所有圖示都使用 SVG |
| ✅ 顏色協調 | 與整體灰色系設計一致 |
| ✅ 專業感 | SVG 比 Emoji 更專業 |
| ✅ 可控性 | 顏色可以透過 CSS 控制 |
| ✅ 清晰度 | 在不同螢幕上都清晰 |
| ✅ 一致性 | 與其他按鈕風格一致 |

---

## 🎯 設計一致性

### 與其他按鈕對比

**請求悔棋按鈕**：
```
border-2 border-slate-300 text-slate-700
```

**對話框按鈕**：
```
border-2 border-cbd5e1 text-slate-700  /* 拒絕 */
border-2 border-cbd5e1 text-slate-700  /* 同意 */
```

**共同特點**：
- ✅ 都使用 2px 邊框
- ✅ 都使用灰色系
- ✅ 都使用白色背景
- ✅ 懸停時都有淺灰背景

---

## 📝 完整組件代碼

```tsx
const UndoRequestDialog: React.FC<UndoRequestDialogProps> = ({
  requestedBy,
  onAccept,
  onReject,
}) => {
  const playerName = requestedBy === 'black' ? '黑方' : '白方';

  return (
    <div className="undo-dialog-overlay">
      <div className="undo-dialog">
        <div className="undo-dialog-header">
          {/* 問號圖示 */}
          <svg className="undo-dialog-icon">...</svg>
          <h3>悔棋請求</h3>
        </div>

        <div className="undo-dialog-content">
          <p className="undo-dialog-message">
            {/* 玩家圖示 */}
            {requestedBy === 'black' ? (
              <svg className="player-icon" fill="currentColor">...</svg>
            ) : (
              <svg className="player-icon" stroke="currentColor">...</svg>
            )}
            <strong>{playerName}</strong> 請求悔棋
          </p>
          <p>是否同意撤銷最後一步？</p>
        </div>

        <div className="undo-dialog-actions">
          <button onClick={onReject} className="undo-dialog-btn-reject">
            <svg className="w-4 h-4">...</svg>
            拒絕
          </button>
          <button onClick={onAccept} className="undo-dialog-btn-accept">
            <svg className="w-4 h-4">...</svg>
            同意
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## ✅ 調整完成

**悔棋請求對話框現在與整體設計完全一致！**

**改善效果**：
- ✅ 所有 Emoji 都改為 SVG
- ✅ 按鈕改為灰色邊框風格
- ✅ 顏色與整體設計協調
- ✅ 專業、簡潔、統一

---

**版本**：v2.4.4  
**狀態**：✅ 完成，可以測試
