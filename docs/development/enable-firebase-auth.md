# 🔐 啟用 Firebase 登入功能

## ⚠️ 重要提示

目前已將認證開關改為 `VITE_ENABLE_AUTH=true`，這表示需要 Firebase 登入才能使用應用程式。

## 📋 接下來的步驟

### 1. 在 Firebase Console 建立測試帳號

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 選擇專案：`test-403e4ce7`
3. 左側選單 → **Authentication**
4. 點擊 **Users** 頁籤
5. 點擊 **Add user** 按鈕
6. 建立測試帳號：
   - **Email**: `player1@test.com`
   - **Password**: `test123456`
7. 再次點擊 **Add user**，建立第二個測試帳號：
   - **Email**: `player2@test.com`
   - **Password**: `test123456`

### 2. 重新啟動伺服器

因為環境變數改變了，需要重新啟動伺服器：

```powershell
# 在 server 目錄下
npm run dev
```

### 3. 測試登入功能

1. 開啟瀏覽器訪問 `http://localhost:5174/`
2. 應該會看到登入頁面
3. 使用測試帳號登入：
   - Email: `player1@test.com`
   - Password: `test123456`
4. 登入成功後會進入大廳
5. 測試登出功能：點擊右上角的登出按鈕
6. 應該會返回登入頁面

## 🔄 如果想要切換回訪客模式

如果你想要回到不需要登入的開發模式：

### Client 端 `.env.local`
```env
VITE_ENABLE_AUTH=false
```

### Server 端 `.env`
```env
ENABLE_AUTH=false
```

然後重新啟動前端和後端。

## 🎯 當前狀態

- ✅ 前端：`VITE_ENABLE_AUTH=true`（已自動重新載入）
- ✅ 後端：`ENABLE_AUTH=true`（需要手動重啟）
- ⚠️ Firebase 測試帳號：需要手動建立

## 📝 注意事項

1. **Firebase 專案 ID**: `test-403e4ce7`
2. **測試帳號密碼**: 至少 6 個字元
3. **環境變數變更**: 需要重新啟動開發伺服器
4. **生產環境**: 記得設定 `VITE_ENABLE_AUTH=true` 和 `ENABLE_AUTH=true`
