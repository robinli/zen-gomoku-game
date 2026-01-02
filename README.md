<div align="center">
<img alt="禪意五子棋" src="/assets/screenshot.png" />
</div>

# 禪意五子棋 (Zen Gomoku Game)

一款基於 **React + Socket.IO** 開發的跨裝置線上對戰五子棋，採用 **Client-Server 架構**，提供流暢且具有禪意的對弈體驗。

**Demo 👉** https://zen-gomoku-game.vercel.app

---

## 🏗️ 系統架構

### **Client-Server 架構**
本專案採用 **WebSocket (Socket.IO)** 實現即時雙向通訊：

```
┌─────────────────┐         ┌─────────────────┐
│   Game Client   │◄──────►│   Game Server   │
│   (React)       │ Socket  │   (Node.js)     │
└─────────────────┘         └─────────────────┘
        ↓                           ↓
   瀏覽器 UI                   房間管理 + 遊戲邏輯
```

**主要特色**：
- ✅ **集中式狀態管理**：Server 端驗證所有落子，防止作弊
- ✅ **自動重連機制**：斷線後自動恢復連線
- ✅ **分享連結功能**：創建房間即產生分享 URL
- ✅ **跨裝置對戰**：支援桌面 + 手機端

---

## 🚀 本地開發

### **Prerequisites**
- Node.js 18+
- npm 或 pnpm

### **1️⃣ 安裝依賴**

**Server 端**
```bash
cd server
npm install
```

**Client 端**
```bash
cd ..  # 回到專案根目錄
npm install
```

### **2️⃣ 環境變數設定**

**Server 端** (`server/.env`)
```env
PORT=3000
CLIENT_URL=http://localhost:5173
```

**Client 端** (`.env.local`)
```env
VITE_SOCKET_URL=http://localhost:3000
```

> 💡 提示：可直接複製 `.env.example` 檔案

### **3️⃣ 啟動應用**

**啟動 Server**
```bash
cd server
npm run dev
```

**啟動 Client** (另開一個 Terminal)
```bash
npm run dev
```

預設網址：
- **Client**: http://localhost:5173
- **Server**: http://localhost:3000

---

## 📦 技術棧

### **Client 端**
| 技術 | 用途 |
|------|------|
| React 18 | UI 框架 |
| TypeScript | 型別安全 |
| Socket.IO Client | WebSocket 通訊 |
| Vite | 開發伺服器 |
| Tailwind CSS | 樣式設計 |

### **Server 端**
| 技術 | 用途 |
|------|------|
| Node.js + Express | HTTP 伺服器 |
| Socket.IO | WebSocket 伺服器 |
| TypeScript | 型別安全 |

---

## 🎮 核心功能

### **1. 房間管理**
- 創建房間並產生分享連結
- 支援最多 2 人對戰（房主 + 訪客）
- 自動清理閒置房間（15 分鐘無活動）

### **2. 遊戲同步**
- Server 端驗證所有落子合法性
- 即時廣播遊戲狀態給雙方
- 支援重新開始遊戲

### **3. 斷線重連**
- 自動偵測連線狀態
- Socket.IO 內建重連機制
- 優雅的 UI 提示（不中斷遊戲）

### **4. 棋盤邏輯**
- 標準 15x15 網格
- 高效的五連珠勝負判定演算法
- SVG 渲染，支援高解析度螢幕

### **5. 視覺設計 (Zen Aesthetic)**
- 木紋質感棋盤
- 黑白棋子微互動動畫
- 響應式設計（手機 + 桌面）

---

## 📡 WebSocket 事件

### **Client → Server**
| 事件 | Payload | 說明 |
|------|---------|------|
| `CREATE_ROOM` | `{ side: 'black' \| 'white' }` | 創建房間 |
| `JOIN_ROOM` | `{ roomId: string }` | 加入房間 |
| `MAKE_MOVE` | `{ x: number, y: number }` | 落子 |
| `RESET_GAME` | - | 重新開始 |

### **Server → Client**
| 事件 | Payload | 說明 |
|------|---------|------|
| `ROOM_CREATED` | `{ roomId, shareUrl }` | 房間創建成功 |
| `ROOM_JOINED` | `{ room, yourSide }` | 加入成功 |
| `GAME_UPDATE` | `{ board, turn, winner... }` | 遊戲狀態更新 |
| `OPPONENT_LEFT` | - | 對手離開 |
| `ERROR` | `{ message }` | 錯誤訊息 |

---

## 🎯 如何遊玩

1. 開啟應用程式
2. 選擇執黑或執白，點擊**「創建遊戲房間」**
3. 複製產生的分享連結，傳送給朋友
4. 待對方開啟連結後，即可開始對局！

---

## 📁 專案結構

```
zen-gomoku-game/
├── client/                    # React 前端
│   ├── src/
│   │   ├── components/        # UI 組件
│   │   │   ├── Board.tsx
│   │   │   ├── GameInfo.tsx
│   │   │   └── Lobby.tsx
│   │   ├── services/
│   │   │   └── socketService.ts   # WebSocket 通訊層
│   │   ├── utils/
│   │   │   └── gameLogic.ts       # 遊戲邏輯
│   │   ├── App.tsx
│   │   └── types.ts
│   └── package.json
│
├── server/                    # Node.js 後端
│   ├── src/
│   │   ├── index.ts           # Express + Socket.IO
│   │   ├── roomManager.ts     # 房間管理
│   │   ├── gameLogic.ts       # 遊戲邏輯
│   │   └── types.ts
│   └── package.json
│
└── README.md
```

---

## 🚢 部署指南

### **快速部署**

本專案已配置好 Render 自動部署！

1️⃣ **推送到 GitHub**
```bash
git push origin main
```

2️⃣ **在 Render 創建服務**
- 前往 [Render Dashboard](https://dashboard.render.com/)
- 選擇 **「New +」** → **「Blueprint」**
- 連接本 repository，Render 會自動讀取 `render.yaml`

3️⃣ **更新 Client 環境變數**
在 Vercel 設定：
```env
VITE_SOCKET_URL=https://zen-gomoku-server.onrender.com
```

📖 **詳細步驟**請參考：[DEPLOYMENT.md](./DEPLOYMENT.md)

---

### **環境變數總覽**

**Client 端 (Vercel)**
```env
VITE_SOCKET_URL=https://zen-gomoku-server.onrender.com
```

**Server 端 (Render)**
```env
NODE_ENV=production
CLIENT_URL=https://zen-gomoku-game.vercel.app
```

---

## 🤝 貢獻

歡迎提交 Issue 或 Pull Request！

---

## 📄 授權

MIT License

---

**Made with ♟️ and Zen**