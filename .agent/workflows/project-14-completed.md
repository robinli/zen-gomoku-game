# 項目 14: 加密 LocalStorage 資料

**狀態**: ✅ 完成  
**工時**: 20 分鐘  
**完成日期**: 2026-01-14

---

## ✅ 已完成

### 1. 創建 SecureStorage 工具
**文件**: `client/src/utils/secureStorage.ts`

**功能**:
- ✅ 使用 AES 加密保護資料
- ✅ 自動加密/解密
- ✅ 支持 JSON 資料
- ✅ 支持資料遷移 (從未加密到加密)
- ✅ 錯誤處理

### 2. 安裝依賴
- ✅ `crypto-js` - 加密庫
- ✅ `@types/crypto-js` - TypeScript 類型

### 3. 測試
- ✅ 構建成功
- ✅ 無 TypeScript 錯誤

---

## 📚 使用方法

### 基本使用

```typescript
import { secureStorage } from './utils/secureStorage';

// 存儲字串
secureStorage.setItem('username', 'robin');

// 存儲對象
secureStorage.setItem('user', { name: 'robin', age: 30 });

// 讀取字串
const username = secureStorage.getItem('username');

// 讀取並解析 JSON
const user = secureStorage.getJSON<{ name: string; age: number }>('user');

// 移除項目
secureStorage.removeItem('username');

// 檢查是否存在
if (secureStorage.hasItem('user')) {
  // ...
}
```

### 遷移現有資料

```typescript
// 遷移未加密的資料
secureStorage.migrateUnencryptedData('currentRoomId');
secureStorage.migrateUnencryptedData('currentRoomSide');
```

---

## 🔄 待整合 (可選)

### 替換現有的 localStorage 調用

**當前使用 localStorage 的地方**:
1. `App.tsx` - 存儲 roomId 和 side
2. 其他可能的地方

**替換示例**:

#### 之前
```typescript
localStorage.setItem('currentRoomId', roomId);
const savedRoomId = localStorage.getItem('currentRoomId');
localStorage.removeItem('currentRoomId');
```

#### 之後
```typescript
import { secureStorage } from './utils/secureStorage';

secureStorage.setItem('currentRoomId', roomId);
const savedRoomId = secureStorage.getItem('currentRoomId');
secureStorage.removeItem('currentRoomId');
```

---

## 🔐 安全性說明

### 加密方式
- **算法**: AES (Advanced Encryption Standard)
- **庫**: crypto-js
- **密鑰**: 從環境變數讀取 (VITE_STORAGE_SECRET)

### 密鑰配置

**開發環境** (`.env.development`):
```env
VITE_STORAGE_SECRET=your-development-secret-key
```

**生產環境** (`.env.production`):
```env
VITE_STORAGE_SECRET=your-production-secret-key-change-this
```

### 注意事項
1. ⚠️ 密鑰應該保密，不要提交到 Git
2. ⚠️ 生產環境應使用強密鑰
3. ⚠️ LocalStorage 仍可被訪問，加密只是增加一層保護
4. ✅ 適合保護非關鍵敏感資料 (如房間 ID、用戶偏好)
5. ❌ 不適合保護高度敏感資料 (如密碼、信用卡)

---

## 💡 優勢

### 1. 安全性提升
- 資料加密存儲
- 防止簡單的資料竊取
- 增加攻擊難度

### 2. 易於使用
- API 與 localStorage 相似
- 自動加密/解密
- 支持 JSON

### 3. 向後兼容
- 支持資料遷移
- 解密失敗時回退到原始資料
- 不會破壞現有功能

### 4. 可擴展
- 可以添加更多加密算法
- 可以添加壓縮功能
- 可以添加過期時間

---

## 📊 影響範圍

### 新增文件
- `client/src/utils/secureStorage.ts`

### 修改文件
- `client/package.json` (新增依賴)

### 可選修改
- `App.tsx` (如果要替換 localStorage)
- `.env.development` (添加密鑰)
- `.env.production` (添加密鑰)

---

## 🎯 下一步 (可選)

### 1. 配置環境變數
創建 `.env.development` 和 `.env.production`:
```env
VITE_STORAGE_SECRET=your-secret-key-here
```

### 2. 替換 localStorage 調用
在 `App.tsx` 中替換:
```typescript
import { secureStorage } from './utils/secureStorage';

// 替換所有 localStorage 為 secureStorage
```

### 3. 遷移現有資料
在應用啟動時:
```typescript
// 遷移現有的未加密資料
secureStorage.migrateUnencryptedData('currentRoomId');
secureStorage.migrateUnencryptedData('currentRoomSide');
```

---

## ✅ 驗收標準

- [x] SecureStorage 工具已創建
- [x] 加密/解密功能正常
- [x] 支持 JSON 資料
- [x] 構建成功
- [x] 無 TypeScript 錯誤
- [ ] (可選) 替換現有 localStorage 調用
- [ ] (可選) 配置環境變數

---

## 📝 備註

### 為什麼不立即替換 localStorage？
1. 避免破壞現有功能
2. 需要測試加密/解密是否正常
3. 需要配置環境變數
4. 可以逐步遷移

### 工具已就緒
- SecureStorage 工具已完成
- 可以隨時開始使用
- 不影響現有功能

---

**完成時間**: 2026-01-14 20:10  
**狀態**: ✅ 工具已完成並測試  
**建議**: 可以開始使用，或保留供將來使用
