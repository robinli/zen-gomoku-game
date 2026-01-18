# ✅ 悔棋按鈕圖示更新完成

## 修改時間
2026-01-08 12:43

---

## 🎨 圖示更新

### 修改前（Emoji）
```tsx
{/* 正常狀態 */}
<span>♻️</span>

{/* 等待狀態 */}
<span className="animate-spin">⏳</span>
```

### 修改後（SVG）
```tsx
{/* 正常狀態 - 撤銷箭頭 */}
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
</svg>

{/* 等待狀態 - 旋轉箭頭 */}
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 animate-spin">
  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
</svg>
```

---

## 📊 圖示說明

### 正常狀態圖示
**Heroicons: arrow-uturn-left**
- 向左彎曲的箭頭
- 表示「撤銷」、「返回」的動作
- 與「悔棋」的語意完美契合

### 等待狀態圖示
**Heroicons: arrow-path**
- 循環箭頭
- 配合 `animate-spin` 旋轉動畫
- 表示「載入中」、「等待中」

---

## 🎯 設計一致性

### 與「返回大廳」按鈕對比

**返回大廳**：
```tsx
<svg className="w-4 h-4">
  <path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
</svg>
返回大廳
```

**請求悔棋**：
```tsx
<svg className="w-4 h-4">
  <path d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
</svg>
請求悔棋
```

### 共同特點
- ✅ 相同的尺寸（`w-4 h-4`）
- ✅ 相同的描邊寬度（`strokeWidth={2}`）
- ✅ 相同的樣式（`fill="none"`）
- ✅ 都使用 Heroicons 圖示庫
- ✅ 都是箭頭類圖示

---

## 🎨 視覺效果

### 正常狀態
```
┌─────────────────────────────────┐
│  ↶ 請求悔棋 (1/3)               │ ← SVG 撤銷箭頭
└─────────────────────────────────┘
```

### 等待狀態
```
┌─────────────────────────────────┐
│  ⟲ 等待對方回應...              │ ← SVG 旋轉箭頭
└─────────────────────────────────┘
```

### 與其他按鈕對比
```
┌─────────────────────────────────┐
│  重新開始對局                   │
├─────────────────────────────────┤
│  ↶ 請求悔棋 (1/3)               │ ← SVG 圖示 ✅
├─────────────────────────────────┤
│  ← 返回大廳                     │ ← SVG 圖示 ✅
└─────────────────────────────────┘
```

---

## ✅ 改善效果

| 改善項目 | 說明 |
|---------|------|
| ✅ 風格統一 | 與「返回大廳」圖示風格一致 |
| ✅ 專業感 | SVG 比 Emoji 更專業 |
| ✅ 可控性 | 顏色隨文字顏色變化（`stroke="currentColor"`） |
| ✅ 清晰度 | 在不同螢幕上都清晰 |
| ✅ 語意明確 | 撤銷箭頭更符合「悔棋」語意 |

---

## 🔧 技術細節

### SVG 屬性
```tsx
xmlns="http://www.w3.org/2000/svg"  // SVG 命名空間
fill="none"                          // 無填充
viewBox="0 0 24 24"                  // 視圖框
strokeWidth={2}                      // 描邊寬度
stroke="currentColor"                // 使用當前文字顏色
className="w-4 h-4"                  // Tailwind 尺寸類別
```

### 動畫
```tsx
className="w-4 h-4 animate-spin"  // 等待狀態加上旋轉動畫
```

---

## 📝 完整按鈕代碼

```tsx
<button
  onClick={handleRequestUndo}
  disabled={!isConnected || isWaitingUndo || room.settings.undoLimit === 0}
  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 border-2 ${
    isWaitingUndo
      ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-wait'
      : isConnected && room.settings.undoLimit !== 0
        ? 'border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 active:scale-95'
        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
  }`}
>
  {isWaitingUndo ? (
    <>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 animate-spin">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
      <span>等待對方回應...</span>
    </>
  ) : (
    <>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
      </svg>
      <span>請求悔棋</span>
      {room.settings.undoLimit !== null && room.settings.undoLimit > 0 && (
        <span className="text-xs opacity-75">
          ({room.undoCount[localPlayer]}/{room.settings.undoLimit})
        </span>
      )}
    </>
  )}
</button>
```

---

## ✅ 更新完成

**悔棋按鈕現在使用 SVG 圖示，與「返回大廳」按鈕風格完全一致！**

**改善效果**：
- ✅ 風格統一（都使用 Heroicons）
- ✅ 更加專業（SVG 取代 Emoji）
- ✅ 語意明確（撤銷箭頭）
- ✅ 視覺協調（尺寸、樣式一致）

---

**版本**：v2.4.3  
**狀態**：✅ 完成，可以測試
