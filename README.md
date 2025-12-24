<div align="center">
<img alt="禪意五子棋" src="/assets/screenshot.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1AQrhy0vBXxi_Q2QOBpf3HAu9BlpZxwcj

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

# Demo site
play 👉 https://zen-gomoku-game.vercel.app


# 禪意五子棋 (Zen Gomoku Online) - 技術文件
本專案是一款基於 React 與 PeerJS (WebRTC) 技術開發的跨裝置線上對戰五子棋。設計核心在於「極簡主義」與「無伺服器架構」，提供流暢且具有禪意的對弈體驗。
核心技術細節
##1. P2P 通訊架構 (Peer-to-Peer)
本遊戲不使用傳統的遊戲後端伺服器，而是採用 WebRTC 技術實現玩家間的直接連線：
PeerJS: 用於處理 WebRTC 的信令 (Signaling) 與 NAT 穿透。
無伺服器邏輯: 所有的遊戲邏輯（落子判定、勝負檢查）均在玩家的瀏覽器端執行，伺服器僅負責最初的媒合連線。
房主模式 (Host): 建立房間的玩家將作為「狀態同步源」，負責產生房間代碼並管理初始遊戲狀態。
加入模式 (Guest): 透過 URL Hash 中的 roomID 自動向房主發起連線請求。
##2. 遊戲同步機制 (Synchronization)
為了確保雙方棋盤完全一致，系統採用「事件驅動」的同步方案：
MOVE 事件: 當一方落子後，會計算出最新的棋盤陣列、勝負結果、獲勝連線座標，並將整個 Payload 傳送給對手。
RESET 事件: 當點擊重新開始時，雙方會同步清空棋盤並重置回合。
SYNC_STATE: 當新玩家加入或斷線重連成功時，房主會發送當前最完整的 Room 物件，確保對局無縫接軌。
##3. 高韌性重連邏輯 (Resilience & Auto-reconnect)
針對行動網路不穩定的特性，本系統設計了多層級的恢復機制：
信令恢復: 監聽 peer.on('disconnected')，當與信令伺服器斷開時（例如切換網路），自動呼叫 reconnect()。
數據鏈路重連: 若 P2P Data Connection 中斷，Guest 端會啟動每 3 秒一次的自動輪詢重試，直到重新連上 Host。
UI 狀態隔離:
非致命錯誤: 若在遊戲進行中斷線，畫面會顯示模糊半透明的「恢復中」提示層，而非跳轉錯誤頁面，保護當前局勢不遺失。
操作鎖定: 斷線期間禁止落子，避免產生邏輯衝突。
##4. 棋盤邏輯與演算法
棋盤規格: 標準 15x15 網格。
勝負判定: 採用高效的座標位移演算法，在每次落子時以該點為中心，向四個軸向（橫、豎、撇、捺）掃描是否有連續 5 顆相同顏色的棋子。
SVG 渲染: 棋盤與棋子均使用原生 SVG 繪製，確保在各種螢幕解析度下都能保持極致清晰。
##5. 視覺設計 (Zen Aesthetic)
木紋質感: 透過 CSS Filter 與疊加紋理模擬真實棋盤的視覺重量感。
微互動: 黑白棋子落子時具備陰影與縮放動畫，模擬石質棋子的打擊感。
動態排版: 採用 Tailwind CSS 實現響應式設計，支援手機與電腦跨平台對弈。
##如何開始
點擊 [創建遊戲房間]。
複製產生的 URL 傳送給朋友。
待朋友開啟連結並顯示「已建立連線」後，即可開始對局。