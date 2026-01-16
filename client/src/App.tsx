
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GameRoom, Player, Position, UndoRequest, ResetRequest, BoardState, MoveHistory, RoomStats } from './types';
import Board from './components/Board';
import Lobby from './components/Lobby';
import GameInfo from './components/GameInfo';
import RoomSettings, { GameSettings } from './components/RoomSettings';
import UndoRequestDialog from './components/UndoRequestDialog';
import ResetRequestDialog from './components/ResetRequestDialog';
import MessageDialog from './components/MessageDialog';
import ConfirmDialog from './components/ConfirmDialog';
import ReplayControls from './components/ReplayControls';
import { socketService } from './services/socketService';
import LanguageSwitcher from './components/LanguageSwitcher';
import { GAME_RULES, REPLAY_CONFIG, UI_CONFIG, STORAGE_KEYS, BOARD_CONFIG } from './config/constants';
import { useRoomStats } from './hooks/useRoomStats';
import { useReplay } from './hooks/useReplay';
import { useGameActions } from './hooks/useGameActions';
import { useEffectOnce } from './hooks/useEffectOnce';
import { useDialogs } from './hooks/useDialogs';
import { useConnection } from './hooks/useConnection';


const App: React.FC = () => {
  const { t } = useTranslation();
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [localPlayer, setLocalPlayer] = useState<Player | null>(null);

  // 使用 useConnection Hook 管理連線狀態
  const connection = useConnection();

  // 使用 useRoomStats Hook 管理房間統計
  const { roomStats, updateStats, resetStats, clearWinnerRef } = useRoomStats();

  // 使用 useReplay Hook 管理回放功能
  const replay = useReplay();

  // 使用 useDialogs Hook 管理所有對話框狀態
  const dialogs = useDialogs();

  // 房間設定
  const [roomSettings, setRoomSettings] = useState<GameSettings>({
    undoLimit: GAME_RULES.DEFAULT_UNDO_LIMIT,  // 使用配置常數
  });

  // 等待悔棋回應
  const [isWaitingUndo, setIsWaitingUndo] = useState(false);

  // 等待重置回應
  const [isWaitingReset, setIsWaitingReset] = useState(false);


  // 使用 Ref 來處理同步鎖定
  const isProcessingMove = useRef(false);
  const hasInitialized = useRef(false);
  // 追蹤已嘗試加入的房間，防止無限重試
  const attemptedRooms = useRef<Set<string>>(new Set());

  // 使用 useGameActions Hook 管理遊戲動作
  const gameActions = useGameActions(
    room,
    localPlayer,
    socketService,
    isProcessingMove,
    {
      setError: connection.setError,
      setRoom,
      setMessageDialog: dialogs.setMessageDialog,
      setIsWaitingUndo,
      setUndoRequest: dialogs.setUndoRequest,
      setIsWaitingReset,
      setResetRequest: dialogs.setResetRequest,
    }
  );


  // 提取共用的檢查和加入房間函數
  const checkAndJoinRoom = () => {
    const hash = window.location.hash.replace('#', '');
    const params = new URLSearchParams(hash);
    const roomId = params.get('room');

    // 防止無限重試：檢查是否已嘗試過此房間
    if (roomId
      && !room
      && !connection.isConnecting
      && connection.isConnected
      && !attemptedRooms.current.has(roomId)
    ) {
      console.log(t('message.detect_room_id', { roomId }));
      attemptedRooms.current.add(roomId);
      handleJoinRoom(roomId);
    }
  };

  // 初始化 Socket 連線
  useEffect(() => {
    if (hasInitialized.current) {
      console.log(t('message.socket_init_skip'));
      return;
    }
    hasInitialized.current = true;

    console.log(t('message.socket_init_start'));
    socketService.connect();

    // 監聽連線成功事件
    socketService.onConnect(() => {
      console.log(t('message.socket_connected'));
      connection.setIsConnected(true);
      connection.setIsConnecting(false);
      connection.setError(null);

      // 🔥 檢查是否有未完成的房間（寬限期重連）
      const savedRoomId = localStorage.getItem(STORAGE_KEYS.CURRENT_ROOM_ID);
      const savedSide = localStorage.getItem(STORAGE_KEYS.CURRENT_ROOM_SIDE) as Player;

      if (savedRoomId && savedSide && !room) {
        console.log(t('message.detect_unfinished', { roomId: savedRoomId }));

        // 嘗試重連
        socketService.reconnectRoom(savedRoomId, (response) => {
          if (response.success && response.roomId) {
            console.log(t('message.room_reconnected'));
            // 恢復房間狀態
            setRoom({
              id: response.roomId,
              board: Array(BOARD_CONFIG.SIZE).fill(null).map(() => Array(BOARD_CONFIG.SIZE).fill(null)),
              turn: 'black',
              winner: null,
              winningLine: null,
              threatLine: null,
              lastMove: null,
              players: { [savedSide]: 'me' },
              updatedAt: Date.now(),
              settings: { undoLimit: GAME_RULES.DEFAULT_UNDO_LIMIT },  // 使用配置常數
              undoCount: { black: 0, white: 0 },
              history: [],
            });
            setLocalPlayer(savedSide);
            window.location.hash = `room=${response.roomId}`;
          } else {
            console.log(t('message.room_reconnect_failed'));
            // 清除 localStorage
            localStorage.removeItem(STORAGE_KEYS.CURRENT_ROOM_ID);
            localStorage.removeItem(STORAGE_KEYS.CURRENT_ROOM_SIDE);
          }
        });
      } else {
        // 沒有儲存的房間，檢查 URL hash 並自動加入房間
        checkAndJoinRoom();
      }
    });

    // 監聽連線錯誤
    socketService.onConnectError((err) => {
      console.error(t('message.socket_error'), err);
      connection.setIsConnected(false);
      connection.setIsConnecting(false);
      connection.setError(t('app.connection_failed'));
    });

    // 監聽遊戲更新
    socketService.onGameUpdate((data) => {
      setRoom(prev => {
        if (!prev) return prev;

        // 檢查是否為重置狀態（棋盤全空）
        const isReset = data.board.every((row: (Player | null)[]) => row.every((cell: Player | null) => cell === null));

        // 如果是重置狀態，清空歷史記錄；否則使用現有記錄
        const newHistory = isReset ? [] : [...prev.history];

        if (!isReset && data.lastMove && data.lastMove !== prev.lastMove) {
          // 確定是哪個玩家下的棋
          const player = prev.turn; // 上一個回合的玩家
          newHistory.push({
            step: newHistory.length + 1,
            player: player,
            position: data.lastMove,
            timestamp: Date.now(),
          });
        }

        // 🎯 檢測遊戲結束並更新統計
        if (data.winner) {
          updateStats(data.winner);
        }

        // 如果是重置，清除勝者記錄
        if (isReset) {
          console.log(t('message.reset_clear_winner'));
          clearWinnerRef();
        }

        return {
          ...prev,
          board: data.board,
          turn: data.turn,
          winner: data.winner,
          winningLine: data.winningLine,
          threatLine: (data as any).threatLine || null,  // 接收威脅資訊
          lastMove: data.lastMove,
          history: newHistory,
          updatedAt: Date.now()
        };
      });

      // 🎯 如果有威脅提示，自動清除
      if ((data as any).threatLine && (data as any).threatLine.length > 0) {
        setTimeout(() => {
          setRoom(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              threatLine: null,
              updatedAt: Date.now()
            };
          });
        }, UI_CONFIG.THREAT_DISPLAY_DURATION_MS);
      }

      isProcessingMove.current = false;
      connection.setReconnecting(false);
    });

    // 監聽對手離開
    socketService.onOpponentLeft(() => {
      console.log(t('message.opponent_left_log'));
      connection.setIsConnected(false);
      dialogs.setShowOpponentLeftDialog(true);
    });

    // 監聽錯誤
    socketService.onError(({ message }) => {
      console.error(t('message.error_prefix') + message);
      if (!room) {
        connection.setError(message);
        connection.setIsConnecting(false);

        // 延遲清除 hash，讓用戶能看到錯誤訊息
        setTimeout(() => {
          console.log(t('message.time_clearing'));
          window.location.hash = '';
          connection.setError(null);
          // 清除嘗試記錄，允許重新嘗試
          attemptedRooms.current.clear();
        }, UI_CONFIG.ERROR_MESSAGE_DURATION_MS);
      }
    });

    // ========== 悔棋事件監聽器 ==========

    // 監聽悔棋請求
    socketService.onUndoRequested(({ requestedBy }) => {
      console.log(t('message.undo_req_log', { requestedBy }));
      dialogs.setUndoRequest({
        requestedBy,
        requestedAt: Date.now(),
      });
    });

    // 監聽悔棋成功
    socketService.onUndoAccepted((data) => {
      console.log(t('message.undo_accepted_log', { data }));
      setRoom(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          board: data.board,
          turn: data.turn,
          lastMove: data.lastMove,
          undoCount: data.undoCount,
          winner: null,
          winningLine: null,
          updatedAt: Date.now(),
        };
      });
      dialogs.setUndoRequest(null);
      setIsWaitingUndo(false);  // 清除等待狀態
      // 顯示成功提示（可選）
      // alert('悔棋成功');
    });

    // 監聽悔棋被拒絕
    socketService.onUndoRejected(() => {
      console.log(t('message.undo_rejected_log'));
      dialogs.setUndoRequest(null);
      setIsWaitingUndo(false);  // 清除等待狀態
      dialogs.setMessageDialog({
        title: t('message.undo_rejected_title'),
        message: t('message.undo_rejected_msg'),
        icon: 'error'
      });
    });

    // ========== 重置請求事件監聽器 ==========

    // 監聽重置請求
    socketService.onResetRequested(({ requestedBy }) => {
      console.log(t('message.reset_req_log', { requestedBy }));
      dialogs.setResetRequest({
        requestedBy,
        requestedAt: Date.now(),
      });
    });

    // 監聽重置成功
    socketService.onResetAccepted(() => {
      console.log(t('message.reset_accepted_log'));
      dialogs.setResetRequest(null);
      setIsWaitingReset(false);  // 清除等待狀態
      // 棋盤會通過 GAME_UPDATE 事件自動更新
    });

    // 監聽重置被拒絕
    socketService.onResetRejected(() => {
      console.log(t('message.reset_rejected_log'));
      dialogs.setResetRequest(null);
      setIsWaitingReset(false);  // 清除等待狀態
      dialogs.setMessageDialog({
        title: t('message.reset_rejected_title'),
        message: t('message.reset_rejected_msg'),
        icon: 'error'
      });
    });

    // 監聽房間加入事件（當第二個玩家加入時，房主也會收到這個事件）
    socketService.onRoomJoined(({ room: serverRoom, yourSide }) => {
      console.log(t('message.opponent_joined_log', { room: serverRoom }));

      setRoom(prev => {
        // 轉換服務器端的房間數據為客戶端格式
        // 服務器端使用 hostSocketId/guestSocketId/hostSide
        // 客戶端使用 players: { black?: string, white?: string }
        const hasGuest = (serverRoom as any).guestSocketId !== null;
        const hostSide = (serverRoom as any).hostSide as Player;
        const guestSide: Player = hostSide === 'black' ? 'white' : 'black';

        const players: { black?: string; white?: string } = {};
        players[hostSide as 'black' | 'white'] = yourSide === hostSide ? 'me' : 'opponent';
        if (hasGuest) {
          players[guestSide as 'black' | 'white'] = yourSide === guestSide ? 'me' : 'opponent';
        }

        if (!prev) {
          // 訪客加入，直接設置房間狀態
          return {
            id: serverRoom.id,
            board: serverRoom.board,
            turn: serverRoom.turn,
            winner: serverRoom.winner,
            winningLine: serverRoom.winningLine,
            threatLine: null,
            lastMove: serverRoom.lastMove,
            players,
            updatedAt: Date.now(),
            settings: serverRoom.settings || { undoLimit: 3 },
            undoCount: serverRoom.undoCount || { black: 0, white: 0 },
            history: serverRoom.history || [],
          };
        } else {
          // 房主收到對手加入的通知，更新 players
          return {
            ...prev,
            players,
            updatedAt: Date.now()
          };
        }
      });
      connection.setIsConnected(true);
    });

    // ⚠️ 不要在 cleanup 中 disconnect，避免 React Strict Mode 導致的問題
    // 只有在真正離開應用時才斷線（例如 goHome 函數中）
  }, []);

  // 檢查 URL Hash 自動加入房間（處理 hashchange 事件）
  useEffect(() => {
    // 延遲檢查，確保 Socket 已連線（作為備用方案）
    const timer = setTimeout(checkAndJoinRoom, 500);

    // 監聽 URL hash 變化（當用戶手動更改 URL 時）
    window.addEventListener('hashchange', checkAndJoinRoom);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('hashchange', checkAndJoinRoom);
    };
  }, [room, connection.isConnecting]);

  // 建立房主模式 (Host)
  const handleCreate = (side: Player) => {
    // 檢查 Socket 是否已連線
    if (!connection.isConnected) {
      connection.setError(t('app.connection_failed'));
      console.error(t('message.socket_error') + ' Not connected');
      return;
    }

    connection.setIsConnecting(true);
    connection.setError(null);

    socketService.createRoom(side, roomSettings, ({ roomId, shareUrl, settings }) => {
      window.location.hash = `room=${roomId}`;

      // ✅ 儲存房間資訊到 localStorage（用於寬限期重連）
      localStorage.setItem(STORAGE_KEYS.CURRENT_ROOM_ID, roomId);
      localStorage.setItem(STORAGE_KEYS.CURRENT_ROOM_SIDE, side);

      const newRoom: GameRoom = {
        id: roomId,
        board: Array(BOARD_CONFIG.SIZE).fill(null).map(() => Array(BOARD_CONFIG.SIZE).fill(null)),
        turn: 'black',
        winner: null,
        winningLine: null,
        threatLine: null,
        lastMove: null,
        players: { [side]: 'me' },
        updatedAt: Date.now(),
        settings: settings || roomSettings,  // 使用 Server 返回的設定
        undoCount: {                         // 初始化悔棋次數
          black: 0,
          white: 0,
        },
        history: [],                         // 初始化歷史記錄
      };

      setRoom(newRoom);
      setLocalPlayer(side);
      connection.setIsConnecting(false);

      // 📊 重置房間統計
      resetStats();

      console.log(t('message.create_room_log', { roomId }));
      console.log(t('app.share_link', { url: shareUrl }));
      console.log(t('app.game_settings', { settings }));
    });
  };

  // 加入房間模式 (Guest)
  const handleJoinRoom = (roomId: string) => {
    connection.setIsConnecting(true);
    connection.setError(null);

    socketService.joinRoom(roomId, ({ room: serverRoom, yourSide }) => {
      setRoom({
        ...serverRoom,
        players: {
          [yourSide]: 'me',
          [yourSide === 'black' ? 'white' : 'black']: 'opponent'
        }
      });
      setLocalPlayer(yourSide);
      connection.setIsConnected(true);
      connection.setIsConnecting(false);
      connection.setError(null);

      // 📊 重置房間統計
      resetStats();

      console.log(t('message.join_room_log', { roomId, side: yourSide }));
    });
  };


  // 返回大廳（直接执行）
  const goHome = () => {
    // ✅ 清除儲存的房間資訊
    localStorage.removeItem(STORAGE_KEYS.CURRENT_ROOM_ID);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_ROOM_SIDE);

    // 主動離開房間，通知 Server
    if (room) {
      socketService.leaveRoom();
    }

    socketService.disconnect();
    window.location.hash = '';
    window.location.reload();
  };

  // 智能判断是否需要确认
  const handleGoHome = () => {
    if (!room) {
      goHome();
      return;
    }

    // 游戏未开始（等待对手）或已结束，直接返回
    const gameNotStarted = Object.keys(room.players).length < 2;
    const gameEnded = room.winner !== null;
    const connectionLost = !connection.isConnected;  // 連線已斷開（對手離開）

    if (gameNotStarted || gameEnded || connectionLost) {
      goHome();
    } else {
      // 游戏进行中，显示确认对话框
      dialogs.setShowConfirm(true);
    }
  };

  const isBoardDisabled =
    !connection.isConnected ||
    (room !== null && room.turn !== localPlayer) ||
    (room !== null && room.winner !== null);

  // 決定何時顯示致命錯誤畫面
  const showFatalError = connection.error && !room;

  return (
    <div className="min-h-screen bg-[#f8f5f2] flex flex-col">
      {/* 固定頂部資訊條 - 方案 A */}
      {room && (
        <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            {/* 左側：遊戲標題 */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold font-serif text-slate-900">{t('app.title')}</h1>
                <p className="text-xs text-slate-400">{t('app.room_id', { id: room.id })}</p>
              </div>
            </div>

            {/* 中間：當前回合指示 */}
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${room.turn === 'black' ? 'bg-slate-900 scale-110' : 'bg-slate-200'}`}>
                <div className="w-2.5 h-2.5 rounded-full border border-white/20"></div>
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${room.turn === 'white' ? 'bg-white scale-110 ring-1 ring-slate-300' : 'bg-slate-200'}`}>
                <div className="w-2.5 h-2.5 rounded-full border border-slate-900/10 bg-white"></div>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-700 leading-tight">
                  {t('app.turn', { color: room.turn === 'black' ? t('app.black') : t('app.white') })}
                </p>
                <p className="text-xs text-slate-400 leading-tight">
                  {room.winner ? t('app.ended') : (localPlayer === room.turn ? t('app.yourTurn') : t('app.opponentTurn'))}
                </p>
              </div>
            </div>


            {/* 右側：連線狀態 */}
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${connection.isReconnecting ? 'bg-amber-500 animate-pulse' :
                (connection.isConnected && Object.keys(room.players).length === 2) ? 'bg-green-500' :
                  'bg-amber-500 animate-pulse'
                }`}></span>
              <span className="text-xs sm:text-sm font-medium text-slate-600">
                {connection.isReconnecting ? t('app.reconnecting') :
                  (connection.isConnected && Object.keys(room.players).length === 2) ? t('app.connected') :
                    t('app.waiting')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 非遊戲狀態的標題 */}
      {showFatalError && (
        <header className="py-6 text-center animate-in fade-in duration-1000">
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-slate-900 tracking-tighter">{t('app.title')}</h1>
          {<p className="text-slate-400 italic text-sm mt-1">
            {connection.isConnected ? t('app.online_game') : (connection.isReconnecting ? t('app.network_recovering') : t('app.client_server_version'))}
          </p>}
        </header>
      )}

      {/* 主要內容區域 */}
      <div className="flex-1 p-4 pb-20 flex flex-col items-center">

        {showFatalError && (
          <div className="mb-6 max-w-md w-full p-6 bg-white border border-red-100 shadow-xl rounded-2xl animate-in zoom-in duration-300">
            <div className="flex items-center gap-3 text-red-600 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              <h2 className="font-bold">{t('app.connection_failed')}</h2>
            </div>
            <p className="text-slate-500 text-sm mb-4 leading-relaxed">{connection.error}</p>
            <button onClick={goHome} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg">
              {t('app.back_to_lobby')}
            </button>
          </div>
        )}

        {connection.isConnecting && !room && !connection.error && (
          <div className="flex flex-col items-center justify-center p-12 space-y-4 animate-in fade-in">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-serif italic">{t('app.finding_room')}</p>
          </div>
        )}

        {!room && !connection.isConnecting && !connection.error && (
          <Lobby
            onCreate={handleCreate}
            settings={roomSettings}
            onSettingsChange={setRoomSettings}
          />
        )}

        {room && (
          <main className={`w-full max-w-6xl flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-center mb-2 transition-all duration-700 ${connection.isConnecting ? 'opacity-30 blur-sm' : 'opacity-100'}`}>
            <div className="w-full flex justify-center relative">
              <Board
                board={replay.isReplaying ? replay.getReplayBoard(replay.replayStep) : room.board}
                onMove={gameActions.handleMove}
                lastMove={replay.isReplaying && replay.replayStep >= 0 && replay.replayHistory[replay.replayStep] ? replay.replayHistory[replay.replayStep].position : room.lastMove}
                winner={replay.isReplaying ? null : room.winner}
                winningLine={replay.isReplaying ? null : room.winningLine}
                threatLine={replay.isReplaying ? null : room.threatLine}
                turn={room.turn}
                disabled={isBoardDisabled || replay.isReplaying}
              />
              {/* 修正後的提示層：僅在真正的斷線重連 (connection.isReconnecting) 且對局未結束時顯示 */}
              {connection.isReconnecting && !room.winner && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-50 flex items-center justify-center rounded-xl animate-in fade-in">
                  <div className="bg-white/90 px-6 py-4 rounded-2xl shadow-2xl border border-amber-100 flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-3 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
                    <p className="text-amber-700 font-bold text-sm">{t('app.internet_unstable')}</p>
                  </div>
                </div>
              )}
            </div>
            <aside className="w-full lg:w-80">
              {/* 回放控制面板 - 在回放模式下顯示 */}
              {replay.isReplaying && (
                <ReplayControls
                  currentStep={replay.replayStep}
                  totalSteps={replay.replayHistory.length}
                  isAutoPlaying={replay.isAutoPlaying}
                  onPrevious={replay.previousStep}
                  onNext={replay.nextStep}
                  onToggleAutoPlay={replay.toggleAutoPlay}
                  onRestart={replay.restartReplay}
                  onExit={replay.exitReplay}
                  onFastForward={replay.fastForward}
                />
              )}

              {/* 遊戲資訊面板 - 非回放模式下顯示 */}
              {!replay.isReplaying && (
                <GameInfo
                  room={room}
                  localPlayer={localPlayer}
                  onReset={gameActions.handleRequestReset}
                  onGoHome={handleGoHome}
                  onRequestUndo={gameActions.handleRequestUndo}
                  onStartReplay={() => room?.history && replay.startReplay(room.history)}
                  isConnected={connection.isConnected}
                  isReconnecting={connection.isReconnecting}
                  isWaitingUndo={isWaitingUndo}
                  isWaitingReset={isWaitingReset}
                  roomStats={roomStats}
                />
              )}
            </aside>
          </main>
        )}

        {/* Footer - 所有頁面共用 */}
        <footer className="mt-6 py-3 text-slate-300 text-xs tracking-widest text-center space-y-2">
          {/* Language Switcher */}
          <div className="flex justify-center">
            <LanguageSwitcher />
          </div>
          {/* Copyright Text */}
          <div>{t('app.footer_text')}</div>
        </footer>
      </div>

      {/* 確認對話框 */}
      {dialogs.showConfirm && (
        <ConfirmDialog
          title={t('app.confirm_leave_title')}
          message={t('app.confirm_leave_message')}
          confirmText={t('app.confirm_leave_confirm')}
          cancelText={t('app.confirm_leave_cancel')}
          onConfirm={() => {
            dialogs.setShowConfirm(false);
            goHome();
          }}
          onCancel={() => dialogs.setShowConfirm(false)}
        />
      )}

      {/* 悔棋請求對話框 */}
      {dialogs.undoRequest && (
        <UndoRequestDialog
          requestedBy={dialogs.undoRequest.requestedBy}
          onAccept={() => gameActions.handleRespondUndo(true)}
          onReject={() => gameActions.handleRespondUndo(false)}
        />
      )}

      {/* 重置請求對話框 */}
      {dialogs.resetRequest && (
        <ResetRequestDialog
          requestedBy={dialogs.resetRequest.requestedBy}
          onAccept={() => gameActions.handleRespondReset(true)}
          onReject={() => gameActions.handleRespondReset(false)}
        />
      )}

      {/* 對手離開對話框 */}
      {dialogs.showOpponentLeftDialog && (
        <ConfirmDialog
          title={t('app.opponent_left_title')}
          message={t('app.opponent_left_message')}
          confirmText={t('app.close')}
          cancelText={t('app.back_to_lobby')}
          onConfirm={() => dialogs.setShowOpponentLeftDialog(false)}
          onCancel={() => {
            dialogs.setShowOpponentLeftDialog(false);
            goHome();
          }}
        />
      )}

      {/* 訊息對話框 */}
      {dialogs.messageDialog && (
        <MessageDialog
          title={dialogs.messageDialog.title}
          message={dialogs.messageDialog.message}
          icon={dialogs.messageDialog.icon}
          onClose={() => dialogs.setMessageDialog(null)}
        />
      )}
    </div>
  );
};

export default App;
