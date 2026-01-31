# 登入與用戶管理功能測試指南

## 功能概述

已成功實作登入後的用戶管理功能：

### ✅ 已實作功能

1. **用戶資訊顯示**
   - 顯示用戶頭像（名稱首字母）
   - 顯示用戶名稱
   - 歡迎訊息

2. **修改名稱功能**
   - 點擊名稱旁的編輯圖示
   - 輸入新名稱
   - 按 Enter 或點擊確認按鈕儲存
   - 支援中英文

3. **登出功能**
   - 點擊右上角的登出按鈕
   - 清除用戶資料
   - 返回登入頁面（如果啟用認證）或重新載入頁面

## 開發模式 vs 生產模式

### 開發模式 (`VITE_ENABLE_AUTH=false`)

- ✅ **不需要登入**：直接進入大廳
- ✅ **訪客模式**：自動創建本地訪客用戶
- ✅ **可修改名稱**：名稱儲存在 `localStorage`
- ✅ **登出功能**：清除訪客資料並重新載入頁面

**訪客用戶資訊：**
```javascript
{
  uid: 'guest-{timestamp}',
  email: 'guest@local',
  displayName: localStorage.getItem('guestDisplayName') || 'Guest'
}
```

### 生產模式 (`VITE_ENABLE_AUTH=true`)

- 🔐 **需要登入**：顯示 Firebase 登入頁面
- 🔐 **真實用戶**：使用 Firebase Authentication
- 🔐 **可修改名稱**：同步到 Firebase
- 🔐 **登出功能**：呼叫 Firebase signOut

## 測試步驟

### 1. 測試訪客模式（開發環境）

```bash
# 確認 .env.local 設定
VITE_ENABLE_AUTH=false
```

1. 開啟瀏覽器訪問 `http://localhost:5174/`
2. 應該直接看到大廳頁面
3. 左上角顯示用戶資訊卡片
4. 測試修改名稱：
   - 點擊名稱旁的編輯圖示（鉛筆）
   - 輸入新名稱，例如 "測試玩家"
   - 按 Enter 或點擊確認
   - 名稱應該立即更新
5. 測試登出：
   - 點擊右上角的登出圖示
   - 頁面應該重新載入
   - 名稱應該恢復為 "Guest"

### 2. 測試 Firebase 認證模式（生產環境）

```bash
# 修改 .env.local 設定
VITE_ENABLE_AUTH=true
```

**前置條件：需要在 Firebase Console 建立測試帳號**

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 選擇專案 `test-403e4ce7`
3. 進入 **Authentication** → **Users**
4. 點擊 **Add user** 建立測試帳號：
   - Email: `player1@test.com`
   - Password: `test123456`

5. 重新啟動開發伺服器（環境變數改變需要重啟）
6. 開啟瀏覽器訪問 `http://localhost:5174/`
7. 應該看到登入頁面
8. 使用測試帳號登入
9. 測試修改名稱和登出功能

## UI 設計特點

### 用戶資訊卡片
- 📍 位置：大廳頁面頂部
- 🎨 設計：淺灰色背景，圓角卡片
- 📱 響應式：支援手機和桌面

### 編輯名稱
- ✏️ 桌面：滑鼠懸停顯示編輯圖示
- 📱 手機：編輯圖示始終可見（低透明度）
- ⌨️ 快捷鍵：Enter 確認

### 登出按鈕
- 🎨 預設：淺灰色圖示
- 🖱️ 懸停：紅色高亮
- 💡 提示：顯示 "登出" 文字

## 技術實作細節

### AuthContext 更新

```typescript
// 認證被禁用時，提供訪客用戶
if (!isAuthEnabled) {
  const guestName = localStorage.getItem('guestDisplayName') || 'Guest';
  setUser({
    uid: 'guest-' + Date.now(),
    email: 'guest@local',
    displayName: guestName
  });
}
```

### 修改名稱

```typescript
const updateDisplayName = async (name: string) => {
  if (!isAuthEnabled) {
    // 訪客模式：儲存到 localStorage
    localStorage.setItem('guestDisplayName', name);
    setUser(prev => prev ? { ...prev, displayName: name } : null);
  } else {
    // Firebase 模式：同步到 Firebase
    await updateProfile(currentUser, { displayName: name });
    setUser(prev => prev ? { ...prev, displayName: name } : null);
  }
};
```

### 登出

```typescript
const signOut = async () => {
  if (!isAuthEnabled) {
    // 訪客模式：清除 localStorage 並重新載入
    localStorage.removeItem('guestDisplayName');
    window.location.reload();
  } else {
    // Firebase 模式：呼叫 Firebase signOut
    await firebaseSignOut(auth);
    setUser(null);
  }
};
```

## 翻譯支援

### 中文
- `lobby.welcome`: "歡迎"
- `lobby.sign_out`: "登出"

### 英文
- `lobby.welcome`: "Welcome"
- `lobby.sign_out`: "Sign Out"

## 注意事項

1. **環境變數變更**：修改 `.env.local` 後需要重新啟動 Vite 開發伺服器
2. **localStorage 持久化**：訪客名稱會保存在瀏覽器中，清除瀏覽器資料會重置
3. **Firebase 測試帳號**：需要手動在 Firebase Console 建立
4. **生產環境部署**：記得設定 `VITE_ENABLE_AUTH=true`

## 故障排除

### 問題：修改名稱後沒有儲存
- **檢查**：瀏覽器 Console 是否有錯誤
- **解決**：確認 `updateDisplayName` 函數正確執行

### 問題：登出後仍然顯示用戶資訊
- **檢查**：是否正確清除 localStorage
- **解決**：手動清除瀏覽器 localStorage

### 問題：Firebase 登入失敗
- **檢查**：Firebase 配置是否正確
- **檢查**：測試帳號是否已建立
- **解決**：查看瀏覽器 Console 的錯誤訊息
