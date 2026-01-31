
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
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import { auth, isAuthEnabled } from './services/firebase';

const GameApp: React.FC = () => {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [localPlayer, setLocalPlayer] = useState<Player | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // 房間內勝負統計（每次進入房間重置）
  const [roomStats, setRoomStats] = useState<RoomStats>({
    black: { wins: 0, losses: 0, draws: 0 },
    white: { wins: 0, losses: 0, draws: 0 }
  });

  // 房間設定
  const [roomSettings, setRoomSettings] = useState<GameSettings>({
    undoLimit: 3,  // 預設 3 次
  });

  // 悔棋請求
  const [undoRequest, setUndoRequest] = useState<UndoRequest | null>(null);

  // 等待悔棋回應
  const [isWaitingUndo, setIsWaitingUndo] = useState(false);

  // 重置請求
  const [resetRequest, setResetRequest] = useState<ResetRequest | null>(null);

  // 等待重置回應
  const [isWaitingReset, setIsWaitingReset] = useState(false);

  // 訊息對話框
  const [messageDialog, setMessageDialog] = useState<{
    title: string;
    message: string;
    icon: 'success' | 'error' | 'info';
  } | null>(null);

  // 對手離開對話框
  const [showOpponentLeftDialog, setShowOpponentLeftDialog] = useState(false);

  // 回放模式狀態
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayStep, setReplayStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  // 儲存回放用的歷史記錄（快照），避免房間重置後資料遺失
  const [replayHistory, setReplayHistory] = useState<MoveHistory[]>([]);

  // 使用 Ref 來處理同步鎖定
  const isProcessingMove = useRef(false);
  const hasInitialized = useRef(false);
  // 追蹤已嘗試加入的房間，防止無限重試
  const attemptedRooms = useRef<Set<string>>(new Set());
  // 追蹤上一次的勝者，避免重複更新統計
  const lastWinnerRef = useRef<Player | 'draw' | null>(null);
  // 使用 ref 存儲統計的實際值，避免 StrictMode 重複更新
  const roomStatsRef = useRef<RoomStats>({
    black: { wins: 0, losses: 0, draws: 0 },
    white: { wins: 0, losses: 0, draws: 0 }
  });

  // 提取共用的檢查和加入房間函數
  const checkAndJoinRoom = () => {
    // 如果還在載入 Auth 狀態，先不急著加入，以免名字沒帶上
    if (loading) return;

    const hash = window.location.hash.replace('#', '');
    const params = new URLSearchParams(hash);
    const roomId = params.get('room');

    // 防止無限重試：檢查是否已嘗試過此房間
    if (roomId
      && !room
      && !isConnecting
      && socketService.isConnected()
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

    // 等待用戶登入後才初始化 Socket
    if (!user) {
      console.log('⏳ 等待用戶登入...');
      return;
    }

    hasInitialized.current = true;

    // 🔐 設定 Auth Token (如果啟用認證)
    const initializeSocket = async () => {
      if (isAuthEnabled) {
        try {
          if (auth) {
            const currentUser = auth.currentUser;
            if (currentUser) {
              const token = await currentUser.getIdToken();
              socketService.setAuthToken(token);
              console.log('🔐 已設定 Auth Token 到 Socket');
            }
          }
        } catch (error) {
          console.error('❌ 取得 Auth Token 失敗:', error);
        }
      }

      console.log(t('message.socket_init_start'));
      socketService.connect();
    };

    initializeSocket();

    // 監聽連線成功事件
    socketService.onConnect(() => {
      console.log(t('message.socket_connected'));
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);

      // 🔥 檢查是否有未完成的房間（寬限期重連）
      const savedRoomId = localStorage.getItem('currentRoomId');
      const savedSide = localStorage.getItem('currentRoomSide') as Player;

      if (savedRoomId && savedSide && !room) {
        console.log(t('message.detect_unfinished', { roomId: savedRoomId }));

        // 嘗試重連
        socketService.reconnectRoom(savedRoomId, (response) => {
          if (response.success && response.roomId && response.room) {
            console.log(t('message.room_reconnected'));
            // 🎯 使用伺服器回傳的完整房間狀態恢復
            const serverRoom = response.room;
            const serverPlayerNames = serverRoom.playerNames || {};

            setRoom({
              ...serverRoom,
              playerNames: {
                black: serverPlayerNames.black || (savedSide === 'black' ? 'me' : 'opponent'),
                white: serverPlayerNames.white || (savedSide === 'white' ? 'me' : 'opponent')
              },
              updatedAt: Date.now()
            });
            setLocalPlayer(savedSide);
            window.location.hash = `room=${response.roomId}`;
          } else {
            console.log(t('message.room_reconnect_failed'));
            // 清除 localStorage
            localStorage.removeItem('currentRoomId');
            localStorage.removeItem('currentRoomSide');
          }
        });
      } else {
        // 沒有儲存的房間，檢查 URL hash 並自動加入房間
        checkAndJoinRoom();
      }
    });

    // 監聽連線錯誤
    socketService.onConnectError((error) => {
      console.error(t('message.socket_error'), error);
      setIsConnected(false);
      setIsConnecting(false);
      setError(t('app.connection_failed'));
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
        if (data.winner && data.winner !== lastWinnerRef.current) {
          // 遊戲剛結束且勝者與上次不同
          console.log(t('message.game_end_update'), {
            winner: data.winner,
            lastWinner: lastWinnerRef.current,
            timestamp: Date.now()
          });

          lastWinnerRef.current = data.winner;

          // 直接在 ref 中更新統計
          if (data.winner === 'draw') {
            // 平局
            roomStatsRef.current.black.draws++;
            roomStatsRef.current.white.draws++;
          } else {
            // 有勝者
            const winner = data.winner as Player;
            const loser: Player = winner === 'black' ? 'white' : 'black';
            roomStatsRef.current[winner].wins++;
            roomStatsRef.current[loser].losses++;
          }

          console.log('📊 更新後的統計 (ref):', roomStatsRef.current);

          // 同步到 state（創建新對象以觸發重新渲染）
          setRoomStats({
            black: { ...roomStatsRef.current.black },
            white: { ...roomStatsRef.current.white }
          });
        }

        // 如果是重置，清除勝者記錄
        if (isReset) {
          console.log(t('message.reset_clear_winner'));
          lastWinnerRef.current = null;
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

      // 🎯 如果有威脅提示，3 秒後自動清除
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
        }, 3000);
      }

      isProcessingMove.current = false;
      setIsReconnecting(false);
    });

    // 監聽對手離開
    socketService.onOpponentLeft(() => {
      console.log(t('message.opponent_left_log'));
      setIsConnected(false);
      setShowOpponentLeftDialog(true);
    });

    // 監聽錯誤
    socketService.onError(({ message }) => {
      console.error(t('message.error_prefix') + message);
      if (!room) {
        setError(message);
        setIsConnecting(false);

        // 延遲清除 hash，讓用戶能看到錯誤訊息 3 秒
        setTimeout(() => {
          console.log(t('message.time_clearing'));
          window.location.hash = '';
          setError(null);
          // 清除嘗試記錄，允許重新嘗試
          attemptedRooms.current.clear();
        }, 3000);
      }
    });

    // ========== 悔棋事件監聽器 ==========

    // 監聽悔棋請求
    socketService.onUndoRequested(({ requestedBy }) => {
      console.log(t('message.undo_req_log', { requestedBy }));
      setUndoRequest({
        requestedBy,
        requestedAt: Date.now(),
      });
    });

    // 監聽悔棋成功
    socketService.onUndoAccepted((data) => {
      console.log(t('message.undo_accepted_log', { data }));
      setRoom(prev => {
        if (!prev) return prev;

        // 移除 history 的最後一步
        const newHistory = prev.history.slice(0, -1);

        return {
          ...prev,
          board: data.board,
          turn: data.turn,
          lastMove: data.lastMove,
          undoCount: data.undoCount,
          winner: null,
          winningLine: null,
          history: newHistory,  // 更新 history
          updatedAt: Date.now(),
        };
      });
      setUndoRequest(null);
      setIsWaitingUndo(false);  // 清除等待狀態
      // 顯示成功提示（可選）
      // alert('悔棋成功');
    });

    // 監聽悔棋被拒絕
    socketService.onUndoRejected(() => {
      console.log(t('message.undo_rejected_log'));
      setUndoRequest(null);
      setIsWaitingUndo(false);  // 清除等待狀態
      setMessageDialog({
        title: t('message.undo_rejected_title'),
        message: t('message.undo_rejected_msg'),
        icon: 'error'
      });
    });

    // ========== 重置請求事件監聽器 ==========

    // 監聽重置請求
    socketService.onResetRequested(({ requestedBy }) => {
      console.log(t('message.reset_req_log', { requestedBy }));
      setResetRequest({
        requestedBy,
        requestedAt: Date.now(),
      });
    });

    // 監聽重置成功
    socketService.onResetAccepted(() => {
      console.log(t('message.reset_accepted_log'));
      setResetRequest(null);
      setIsWaitingReset(false);  // 清除等待狀態
      // 棋盤會通過 GAME_UPDATE 事件自動更新
    });

    // 監聽重置被拒絕
    socketService.onResetRejected(() => {
      console.log(t('message.reset_rejected_log'));
      setResetRequest(null);
      setIsWaitingReset(false);  // 清除等待狀態
      setMessageDialog({
        title: t('message.reset_rejected_title'),
        message: t('message.reset_rejected_msg'),
        icon: 'error'
      });
    });

    // 監聽房間加入事件（當第二個玩家加入時，房主也會收到這個事件）
    socketService.onRoomJoined(({ room: serverRoom, yourSide }: { room: any, yourSide: Player }) => {
      console.log('📥 收到 ROOM_JOINED 事件:', {
        yourSide,
        playerNames: serverRoom.playerNames,
        guestSocketId: serverRoom.guestSocketId
      });

      // 🎯 更新房間狀態，確保玩家清單正確
      setRoom(prev => {
        // 🎯 決定玩家名稱
        // 優先使用伺服器傳回的真實名稱清單
        const serverPlayerNames = serverRoom.playerNames || {};
        const playerNames: { black: string; white: string } = {
          black: serverPlayerNames.black || 'Player',
          white: serverPlayerNames.white || 'Player'
        };

        console.log('👥 處理後的玩家名稱:', playerNames);

        if (!prev) {
          // 第一次加入 (Guest 流程)
          console.log('🆕 訪客首次加入房間');
          return {
            ...serverRoom,
            playerNames,
            updatedAt: Date.now(),
            settings: serverRoom.settings || { undoLimit: 3 },
            undoCount: serverRoom.undoCount || { black: 0, white: 0 },
            history: serverRoom.history || [],
          };
        } else {
          // 房主收到對手加入的通知，或重連成功，更新狀態
          console.log('🔄 房主更新房間狀態 (對手加入)');
          return {
            ...prev,
            ...serverRoom, // 直接使用伺服器最新的狀態
            playerNames,   // 使用我們校正過的名稱清單
            updatedAt: Date.now()
          };
        }
      });

      setIsConnected(true);
      setIsConnecting(false); // 確保取消載入狀態
    });

    // ⚠️ 不要在 cleanup 中 disconnect，避免 React Strict Mode 導致的問題
    // 只有在真正離開應用時才斷線（例如 goHome 函數中）
  }, [user]);

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
  }, [room, isConnecting, loading, user]);

  // 建立房主模式 (Host)
  const handleCreate = (side: Player) => {
    // 檢查 Socket 是否已連線
    if (!socketService.isConnected()) {
      setError(t('app.connection_failed'));
      console.error(t('message.socket_error') + ' Not connected');
      return;
    }

    setIsConnecting(true);
    setError(null);

    // 傳入當前用戶名稱
    socketService.createRoom(side, roomSettings, user?.displayName || undefined, ({ roomId, shareUrl, settings }) => {
      window.location.hash = `room=${roomId}`;

      // ✅ 儲存房間資訊到 localStorage（用於寬限期重連）
      localStorage.setItem('currentRoomId', roomId);
      localStorage.setItem('currentRoomSide', side);

      const newRoom: GameRoom = {
        id: roomId,
        board: Array(15).fill(null).map(() => Array(15).fill(null)),
        turn: 'black',
        winner: null,
        winningLine: null,
        threatLine: null,
        lastMove: null,
        playerNames: { [side]: 'me' },
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
      setIsConnecting(false);

      // 📊 重置房間統計
      roomStatsRef.current = {
        black: { wins: 0, losses: 0, draws: 0 },
        white: { wins: 0, losses: 0, draws: 0 }
      };
      setRoomStats({
        black: { wins: 0, losses: 0, draws: 0 },
        white: { wins: 0, losses: 0, draws: 0 }
      });

      console.log(t('message.create_room_log', { roomId }));
      console.log(t('app.share_link', { url: shareUrl }));
      console.log(t('app.game_settings', { settings }));
    });
  };

  // 加入房間模式 (Guest)
  const handleJoinRoom = (roomId: string) => {
    setIsConnecting(true);
    setError(null);

    // 傳入當前用戶名稱
    socketService.joinRoom(roomId, user?.displayName || undefined, ({ room: serverRoom, yourSide }) => {
      // 🎯 決定玩家名稱
      const hostSide = (serverRoom as any).hostSide as Player;
      const serverPlayerNames = serverRoom.playerNames || {};

      const playerNames: { black: string; white: string } = {
        black: serverPlayerNames.black || (yourSide === 'black' ? 'me' : 'opponent'),
        white: serverPlayerNames.white || (yourSide === 'white' ? 'me' : 'opponent')
      };

      setRoom({
        ...serverRoom,
        playerNames
      });
      setLocalPlayer(yourSide);
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);

      // 📊 重置房間統計
      roomStatsRef.current = {
        black: { wins: 0, losses: 0, draws: 0 },
        white: { wins: 0, losses: 0, draws: 0 }
      };
      setRoomStats({
        black: { wins: 0, losses: 0, draws: 0 },
        white: { wins: 0, losses: 0, draws: 0 }
      });

      console.log(t('message.join_room_log', { roomId, side: yourSide }));
    });
  };

  // 落子
  const handleMove = (pos: Position) => {
    if (isProcessingMove.current) return;
    if (!room || !localPlayer || room.winner || room.turn !== localPlayer) return;
    if (room.board[pos.y][pos.x]) return;
    if (!socketService.isConnected()) {
      setError(t('app.connection_lost_refresh'));
      return;
    }

    isProcessingMove.current = true;

    // 樂觀更新 UI（立即顯示自己的落子）
    const newBoard = room.board.map(row => [...row]);
    newBoard[pos.y][pos.x] = localPlayer;

    setRoom(prev => prev ? {
      ...prev,
      board: newBoard,
      lastMove: pos,
      updatedAt: Date.now()
    } : null);

    // 發送給 Server
    socketService.makeMove(pos.x, pos.y);
  };

  // ========== 悔棋處理函數 ==========

  // 請求悔棋
  const handleRequestUndo = () => {
    if (!room || !localPlayer) return;

    // 檢查是否允許悔棋
    if (room.settings.undoLimit === 0) {
      setMessageDialog({
        title: t('app.cannot_undo_title'),
        message: t('app.cannot_undo_not_allowed'),
        icon: 'info'
      });
      return;
    }

    // 檢查次數
    if (room.settings.undoLimit !== null) {
      const used = room.undoCount[localPlayer];
      if (used >= room.settings.undoLimit) {
        setMessageDialog({
          title: t('app.cannot_undo_title'),
          message: t('app.cannot_undo_limit', { used, limit: room.settings.undoLimit }),
          icon: 'info'
        });
        return;
      }
    }

    // 檢查是否有歷史記錄
    if (!room.history || room.history.length === 0) {
      setMessageDialog({
        title: t('app.cannot_undo_title'),
        message: t('app.cannot_undo_no_steps'),
        icon: 'info'
      });
      return;
    }

    // 檢查最後一步是否是自己下的
    const lastMove = room.history[room.history.length - 1];
    if (lastMove.player !== localPlayer) {
      setMessageDialog({
        title: t('app.cannot_undo_title'),
        message: t('app.cannot_undo_only_own'),
        icon: 'info'
      });
      return;
    }

    console.log(t('message.request_undo_log'));
    setIsWaitingUndo(true);  // 設置等待狀態
    socketService.requestUndo();
  };

  // 回應悔棋請求
  const handleRespondUndo = (accept: boolean) => {
    console.log(t('message.respond_undo_log', { accept: accept ? t('dialog.agree') : t('dialog.reject') }));
    socketService.respondUndo(accept);
    setUndoRequest(null);
  };

  // ========== 重置處理函數 ==========

  // 請求重新開始
  const handleReset = () => {
    if (!room || !localPlayer) return;

    console.log(t('message.request_reset_log'));
    setIsWaitingReset(true);  // 設置等待狀態
    socketService.requestReset();
  };

  // 回應重置請求
  const handleRespondReset = (accept: boolean) => {
    console.log(t('message.respond_reset_log', { accept: accept ? t('dialog.agree') : t('dialog.reject') }));
    socketService.respondReset(accept);
    setResetRequest(null);
  };

  // ========== 回放控制函數 ==========

  // 根據步驟重建棋盤狀態
  const getReplayBoard = (step: number): BoardState => {
    const board: BoardState = Array(15).fill(null).map(() => Array(15).fill(null));
    // 使用 replayHistory 而不是 room.history
    for (let i = 0; i <= step && i < replayHistory.length; i++) {
      const move = replayHistory[i];
      board[move.position.y][move.position.x] = move.player;
    }
    return board;
  };

  // 開始回放
  const handleStartReplay = () => {
    if (!room || !room.history || room.history.length === 0) return;
    setReplayHistory([...room.history]); // 建立快照
    setIsReplaying(true);
    setReplayStep(0);
    setIsAutoPlaying(true); // 自動開始播放
  };

  // 退出回放
  const handleExitReplay = () => {
    setIsReplaying(false);
    setReplayStep(0);
    setIsAutoPlaying(false);
    setReplayHistory([]); // 清除快照
    if (autoPlayTimer.current) {
      clearInterval(autoPlayTimer.current);
      autoPlayTimer.current = null;
    }
  };

  // 上一步
  const handleReplayPrevious = () => {
    if (replayStep > 0) {
      setReplayStep(prev => prev - 1);
    }
  };

  // 下一步
  const handleReplayNext = () => {
    if (replayStep < replayHistory.length - 1) {
      setReplayStep(prev => prev + 1);
    }
  };

  // 重新開始回放
  const handleReplayRestart = () => {
    setReplayStep(0);
    setIsAutoPlaying(false);
  };

  // 切換自動播放
  const handleToggleAutoPlay = () => {
    setIsAutoPlaying(prev => !prev);
  };

  // 自動播放效果
  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayTimer.current = setInterval(() => {
        setReplayStep(prev => {
          if (prev >= replayHistory.length - 1) {
            setIsAutoPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000); // 每秒一步

      return () => {
        if (autoPlayTimer.current) {
          clearInterval(autoPlayTimer.current);
          autoPlayTimer.current = null;
        }
      };
    }
  }, [isAutoPlaying, replayHistory]); // 依賴 replayHistory

  // 快進到最後
  const handleReplayFastForward = () => {
    if (replayHistory.length > 0) {
      setReplayStep(replayHistory.length - 1);
    }
  };


  // 返回大廳（直接执行）
  const goHome = () => {
    // ✅ 清除儲存的房間資訊
    localStorage.removeItem('currentRoomId');
    localStorage.removeItem('currentRoomSide');

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
    const gameNotStarted = Object.keys(room.playerNames).length < 2;
    const gameEnded = room.winner !== null;
    const connectionLost = !isConnected;  // 連線已斷開（對手離開）

    if (gameNotStarted || gameEnded || connectionLost) {
      goHome();
    } else {
      // 游戏进行中，显示确认对话框
      setShowConfirm(true);
    }
  };

  const isBoardDisabled =
    !socketService.isConnected() ||
    (room !== null && Object.keys(room.playerNames).length < 2) ||  // 等待第二個玩家
    (room !== null && room.turn !== localPlayer) ||
    (room !== null && room.winner !== null);

  // 決定何時顯示致命錯誤畫面
  const showFatalError = error && !room;

  // 🎯 注意：認證邏輯已在 AuthenticatedApp 中處理
  // 如果能進入 GameApp，表示：
  // 1. 認證已禁用 (isAuthEnabled=false)，或
  // 2. 用戶已登入 (user !== null)

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
              <span className={`w-2 h-2 rounded-full ${isReconnecting ? 'bg-amber-500 animate-pulse' :
                (isConnected && Object.keys(room.playerNames).length === 2) ? 'bg-green-500' :
                  'bg-amber-500 animate-pulse'
                }`}></span>
              <span className="text-xs sm:text-sm font-medium text-slate-600">
                {isReconnecting ? t('app.reconnecting') :
                  (isConnected && Object.keys(room.playerNames).length === 2) ? t('app.connected') :
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
            {isConnected ? t('app.online_game') : (isReconnecting ? t('app.network_recovering') : t('app.client_server_version'))}
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
            <p className="text-slate-500 text-sm mb-4 leading-relaxed">{error}</p>
            <button onClick={goHome} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg">
              {t('app.back_to_lobby')}
            </button>
          </div>
        )}

        {isConnecting && !room && !error && (
          <div className="flex flex-col items-center justify-center p-12 space-y-4 animate-in fade-in">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-serif italic">{t('app.finding_room')}</p>
          </div>
        )}

        {!room && !isConnecting && !error && (
          <Lobby
            onCreate={handleCreate}
            settings={roomSettings}
            onSettingsChange={setRoomSettings}
          />
        )}

        {room && (
          <main className={`w-full max-w-6xl flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-center mb-2 transition-all duration-700 ${isConnecting ? 'opacity-30 blur-sm' : 'opacity-100'}`}>
            <div className="w-full flex justify-center relative">
              <Board
                board={isReplaying ? getReplayBoard(replayStep) : room.board}
                onMove={handleMove}
                lastMove={isReplaying && replayStep >= 0 && replayHistory[replayStep] ? replayHistory[replayStep].position : room.lastMove}
                winner={isReplaying ? null : room.winner}
                winningLine={isReplaying ? null : room.winningLine}
                threatLine={isReplaying ? null : room.threatLine}
                turn={room.turn}
                disabled={isBoardDisabled || isReplaying}
                hasOpponent={Object.keys(room.playerNames).length === 2}
              />
              {/* 修正後的提示層：僅在真正的斷線重連 (isReconnecting) 且對局未結束時顯示 */}
              {isReconnecting && !room.winner && (
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
              {isReplaying && (
                <ReplayControls
                  currentStep={replayStep}
                  totalSteps={replayHistory.length}
                  isAutoPlaying={isAutoPlaying}
                  onPrevious={handleReplayPrevious}
                  onNext={handleReplayNext}
                  onToggleAutoPlay={handleToggleAutoPlay}
                  onRestart={handleReplayRestart}
                  onExit={handleExitReplay}
                  onFastForward={handleReplayFastForward}
                />
              )}

              {/* 遊戲資訊面板 - 非回放模式下顯示 */}
              {!isReplaying && (() => {
                // 計算玩家名稱
                const playerNames: { black?: string; white?: string } = {};

                if (localPlayer && user && room) {
                  // 從 server 端的房間資料獲取玩家名稱
                  const serverRoom = room as any;

                  // 確定哪一方是房主，哪一方是訪客
                  const hostSide: Player = (serverRoom.hostSide || 'black') as Player;
                  const guestSide: Player = hostSide === 'black' ? 'white' : 'black';

                  // 設定房主和訪客的名稱
                  if (serverRoom.hostDisplayName) {
                    playerNames[hostSide] = serverRoom.hostDisplayName;
                  }
                  if (serverRoom.guestDisplayName) {
                    playerNames[guestSide] = serverRoom.guestDisplayName;
                  }
                }

                return (
                  <GameInfo
                    room={room}
                    localPlayer={localPlayer}
                    onReset={handleReset}
                    onGoHome={handleGoHome}
                    onRequestUndo={handleRequestUndo}
                    onStartReplay={handleStartReplay}
                    isConnected={isConnected}
                    isReconnecting={isReconnecting}
                    isWaitingUndo={isWaitingUndo}
                    isWaitingReset={isWaitingReset}
                    roomStats={roomStats}
                    playerNames={playerNames}
                  />
                );
              })()}
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
      {showConfirm && (
        <ConfirmDialog
          title={t('app.confirm_leave_title')}
          message={t('app.confirm_leave_message')}
          confirmText={t('app.confirm_leave_confirm')}
          cancelText={t('app.confirm_leave_cancel')}
          onConfirm={() => {
            setShowConfirm(false);
            goHome();
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {/* 悔棋請求對話框 */}
      {undoRequest && (
        <UndoRequestDialog
          requestedBy={undoRequest.requestedBy}
          onAccept={() => handleRespondUndo(true)}
          onReject={() => handleRespondUndo(false)}
        />
      )}

      {/* 重置請求對話框 */}
      {resetRequest && (
        <ResetRequestDialog
          requestedBy={resetRequest.requestedBy}
          onAccept={() => handleRespondReset(true)}
          onReject={() => handleRespondReset(false)}
        />
      )}

      {/* 對手離開對話框 */}
      {showOpponentLeftDialog && (
        <ConfirmDialog
          title={t('app.opponent_left_title')}
          message={t('app.opponent_left_message')}
          confirmText={t('app.close')}
          cancelText={t('app.back_to_lobby')}
          onConfirm={() => setShowOpponentLeftDialog(false)}
          onCancel={() => {
            setShowOpponentLeftDialog(false);
            goHome();
          }}
        />
      )}

      {/* 訊息對話框 */}
      {messageDialog && (
        <MessageDialog
          title={messageDialog.title}
          message={messageDialog.message}
          icon={messageDialog.icon}
          onClose={() => setMessageDialog(null)}
        />
      )}
    </div>
  );
};

// 🔐 認證包裝組件
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
};

// 🎮 根據認證狀態顯示不同頁面
const AuthenticatedApp: React.FC = () => {
  const { user, loading } = useAuth();

  // 🔄 載入中
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f5f2] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-slate-900 rounded-full mx-auto flex items-center justify-center shadow-lg animate-pulse">
            <div className="w-8 h-8 border-4 border-white rounded-full"></div>
          </div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // 🎯 認證邏輯判斷
  // 開發環境 (VITE_ENABLE_AUTH=false): 直接進入遊戲
  // 生產環境 (VITE_ENABLE_AUTH=true): 需要登入
  const shouldShowLogin = isAuthEnabled && !user;

  if (shouldShowLogin) {
    return <LoginPage />;
  }

  return <GameApp />;
};

export default App;
