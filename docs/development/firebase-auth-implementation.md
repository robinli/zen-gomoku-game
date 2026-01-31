# Firebase Authentication 實作計劃

## 📋 目標

實作使用者登入功能,要求:
- ✅ 使用者進入大廳前需要先登入
- ✅ 登入時輸入:名稱、Login ID (Email)、Password
- ✅ **本機測試時忽略登入** (開發環境)
- ✅ **發行到 PRD 才啟用** (生產環境)

## 🏗️ 架構設計

### 環境變數控制流程

```
┌─────────────────────────────────────────┐
│         環境變數檢查                      │
│  VITE_ENABLE_AUTH === 'true' ?          │
└─────────────┬───────────────────────────┘
              │
      ┌───────┴────────┐
      │                │
   YES (PRD)        NO (DEV)
      │                │
      ▼                ▼
┌──────────┐    ┌──────────┐
│ 顯示登入  │    │ 直接進入  │
│   頁面    │    │   大廳    │
└──────────┘    └──────────┘
```

### 認證流程

```
┌─────────────┐
│  LoginPage  │
└──────┬──────┘
       │ 1. 輸入 Email/Password/Name
       ▼
┌─────────────────────┐
│ Firebase Auth       │
│ signInWithEmail...  │
└──────┬──────────────┘
       │ 2. 返回 ID Token
       ▼
┌─────────────────────┐
│ localStorage        │
│ 儲存 token + user   │
└──────┬──────────────┘
       │ 3. 更新 AuthContext
       ▼
┌─────────────────────┐
│ Socket.IO 連線      │
│ 帶上 auth token     │
└──────┬──────────────┘
       │ 4. Server 驗證
       ▼
┌─────────────────────┐
│ 進入遊戲大廳         │
└─────────────────────┘
```

## 📦 需要安裝的套件

### Client 端
```bash
cd client
npm install firebase
```

### Server 端
```bash
cd server
npm install firebase-admin
```

## 🔧 Firebase 專案設定步驟

### 1. 建立 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊 **「Add project」** (新增專案)
3. 專案名稱: `zen-gomoku-game`
4. 關閉 Google Analytics (可選)
5. 點擊 **「Create project」**

### 2. 啟用 Authentication

1. 左側選單 → **「Authentication」**
2. 點擊 **「Get started」**
3. 選擇 **「Email/Password」** 登入方式
4. 啟用 **「Email/Password」**
5. 儲存

### 3. 建立測試帳號

在 **「Users」** 頁籤:
1. 點擊 **「Add user」**
2. Email: `player1@test.com`
3. Password: `test123456`
4. 重複建立 `player2@test.com`

### 4. 取得 Web App 設定

1. 專案設定 → **「General」**
2. 向下捲動到 **「Your apps」**
3. 點擊 **「</> Web」** 圖示
4. App nickname: `zen-gomoku-client`
5. 複製 `firebaseConfig` 物件

### 5. 取得 Service Account (後端用)

1. 專案設定 → **「Service accounts」**
2. 點擊 **「Generate new private key」**
3. 下載 JSON 檔案
4. 重新命名為 `firebase-service-account.json`
5. 放到 `server/` 目錄 (記得加入 .gitignore)

## 📝 環境變數設定

### Client 端 `.env.local`

```env
# 開發環境 - 關閉認證
VITE_ENABLE_AUTH=false
VITE_SOCKET_URL=http://localhost:3000

# Firebase Config (生產環境用)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=zen-gomoku-game.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=zen-gomoku-game
VITE_FIREBASE_STORAGE_BUCKET=zen-gomoku-game.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### Client 端 `.env.production`

```env
# 生產環境 - 啟用認證
VITE_ENABLE_AUTH=true
VITE_SOCKET_URL=https://zen-gomoku-server.onrender.com

# Firebase Config
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=zen-gomoku-game.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=zen-gomoku-game
VITE_FIREBASE_STORAGE_BUCKET=zen-gomoku-game.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### Server 端 `.env`

```env
PORT=3000
CLIENT_URL=http://localhost:5173

# Firebase Admin (開發環境)
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# 認證開關
ENABLE_AUTH=false
```

### Server 端 `.env.production`

```env
NODE_ENV=production
CLIENT_URL=https://zen-gomoku-game.vercel.app

# Firebase Admin (生產環境 - 使用環境變數)
FIREBASE_PROJECT_ID=zen-gomoku-game
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@zen-gomoku-game.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# 認證開關
ENABLE_AUTH=true
```

## 📂 檔案結構

```
zen-gomoku-game/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LoginPage.tsx          # ✨ 新增
│   │   │   └── Lobby.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx        # ✨ 新增
│   │   ├── services/
│   │   │   ├── firebase.ts            # ✨ 新增
│   │   │   └── socketService.ts       # 🔧 修改
│   │   └── App.tsx                    # 🔧 修改
│   ├── .env.local                     # 🔧 更新
│   └── .env.production                # ✨ 新增
│
├── server/
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.ts                # ✨ 新增
│   │   ├── services/
│   │   │   └── firebase-admin.ts      # ✨ 新增
│   │   └── index.ts                   # 🔧 修改
│   ├── firebase-service-account.json  # ✨ 新增 (不提交)
│   ├── .env                           # 🔧 更新
│   └── .gitignore                     # 🔧 更新
│
└── docs/
    └── development/
        └── firebase-auth-implementation.md  # 本文檔
```

## 🎨 UI/UX 設計

### LoginPage 設計規範

- **風格**: 與 Lobby 一致 (白色卡片、圓角、陰影)
- **配色**: 使用現有的 slate 色系
- **動畫**: 淡入效果 + 表單驗證動畫
- **響應式**: 支援手機/桌面
- **多語言**: 支援中英文切換

### 表單欄位

1. **Display Name** (顯示名稱)
   - Placeholder: "Enter your name"
   - 驗證: 2-20 字元

2. **Email** (登入 ID)
   - Placeholder: "your@email.com"
   - 驗證: Email 格式

3. **Password** (密碼)
   - Placeholder: "••••••••"
   - 驗證: 最少 6 字元
   - 顯示/隱藏切換按鈕

4. **Submit Button**
   - 文字: "Sign In" / "登入"
   - Loading 狀態

## 🔒 安全性考量

### 開發環境
- ✅ 完全跳過認證
- ✅ 不儲存任何敏感資訊
- ✅ 方便快速測試

### 生產環境
- ✅ 強制 HTTPS
- ✅ Firebase Auth 自動處理密碼加密
- ✅ JWT Token 有效期: 1 小時 (Firebase 預設)
- ✅ Refresh Token 自動更新
- ✅ Token 儲存在 localStorage
- ⚠️ 需注意 XSS 防護

## 🧪 測試策略

### E2E 測試更新

**開發環境** (`VITE_ENABLE_AUTH=false`):
- ✅ 所有現有測試不需修改
- ✅ 直接進入 Lobby

**生產環境** (`VITE_ENABLE_AUTH=true`):
- ✅ 使用 Firebase Emulator
- ✅ 測試前自動建立測試帳號
- ✅ 測試後自動清理

### 測試案例

1. **登入成功**
   - 輸入正確帳密 → 進入 Lobby

2. **登入失敗**
   - 錯誤帳密 → 顯示錯誤訊息

3. **Token 過期**
   - 自動 refresh → 保持登入狀態

4. **登出功能**
   - 清除 token → 返回登入頁

## 📊 實作進度追蹤

- [ ] Phase 1: Firebase 專案設定
- [ ] Phase 2: 安裝依賴套件
- [ ] Phase 3: 環境變數配置
- [ ] Phase 4: 前端實作
  - [ ] Firebase 初始化
  - [ ] AuthContext
  - [ ] LoginPage 組件
  - [ ] App.tsx 整合
- [ ] Phase 5: 後端實作
  - [ ] Firebase Admin SDK
  - [ ] Token 驗證中間件
  - [ ] Socket.IO 認證
- [ ] Phase 6: E2E 測試更新
- [ ] Phase 7: 測試與驗證

## 🚀 部署注意事項

### Vercel (Client)
1. 設定環境變數 (所有 VITE_* 變數)
2. 確保 `VITE_ENABLE_AUTH=true`

### Render (Server)
1. 設定環境變數 (Firebase Admin 憑證)
2. 確保 `ENABLE_AUTH=true`
3. 不要上傳 `firebase-service-account.json`

## 📚 參考資料

- [Firebase Authentication 文檔](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Socket.IO Authentication](https://socket.io/docs/v4/middlewares/)
