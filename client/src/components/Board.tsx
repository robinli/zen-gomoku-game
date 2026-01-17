
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BoardState, Position, Player } from '../types';
import { BOARD_SIZE } from '../utils/gameLogic';

interface BoardProps {
  board: BoardState;
  onMove: (pos: Position) => void;
  lastMove: Position | null;
  winner: Player | 'draw' | null;
  winningLine: Position[] | null;
  threatLine: Position[] | null;  // 威脅棋子位置
  turn: Player;
  disabled?: boolean;
}

const Board: React.FC<BoardProps> = ({ board, onMove, lastMove, winner, winningLine, threatLine, turn, disabled }) => {
  const { t } = useTranslation();
  const [overlayVisible, setOverlayVisible] = useState(false);
  const cellSize = 30;
  const padding = 20;
  const boardSize = (BOARD_SIZE - 1) * cellSize + padding * 2;

  // 當勝負揭曉時自動顯示視窗
  useEffect(() => {
    if (winner) {
      setOverlayVisible(true);
    } else {
      setOverlayVisible(false);
    }
  }, [winner]);

  const gridLines = Array.from({ length: BOARD_SIZE }).map((_, i) => (
    <React.Fragment key={`grid-${i}`}>
      <line x1={padding} y1={padding + i * cellSize} x2={boardSize - padding} y2={padding + i * cellSize} />
      <line x1={padding + i * cellSize} y1={padding} x2={padding + i * cellSize} y2={boardSize - padding} />
    </React.Fragment>
  ));

  const interactionCells = Array.from({ length: BOARD_SIZE }).flatMap((_, y) =>
    Array.from({ length: BOARD_SIZE }).map((_, x) => (
      <rect
        key={`cell-${x}-${y}`}
        data-testid={`cell-${y}-${x}`}
        data-row={y}
        data-col={x}
        x={padding + x * cellSize - cellSize / 2}
        y={padding + y * cellSize - cellSize / 2}
        width={cellSize}
        height={cellSize}
        fill="transparent"
        className={`${disabled ? 'cursor-not-allowed' : 'hover:fill-black/5 cursor-pointer'} transition-all`}
        onClick={() => !disabled && onMove({ x, y })}
      />
    ))
  );

  const stones = board.flatMap((row, y) =>
    row.map((cell, x) => {
      if (!cell) return null;
      const isLast = lastMove?.x === x && lastMove?.y === y;
      const isWinningStone = winningLine?.some(p => p.x === x && p.y === y);
      const isThreatStone = threatLine?.some(p => p.x === x && p.y === y);

      return (
        <g key={`stone-${x}-${y}`} className={`stone stone-shadow transition-all duration-300 ${cell}`}>
          <circle
            cx={padding + x * cellSize}
            cy={padding + y * cellSize}
            r={cellSize * 0.43}
            className={`transition-all duration-500 ${cell === 'black' ? 'fill-slate-900' : 'fill-slate-50 stroke-slate-200 stroke-1'
              }`}
          />
          {/* 高亮顯示獲勝連線 */}
          {isWinningStone && (
            <circle
              cx={padding + x * cellSize}
              cy={padding + y * cellSize}
              r={cellSize * 0.48}
              fill="none"
              stroke={cell === 'black' ? '#fbbf24' : '#f59e0b'}
              strokeWidth="2.5"
              className="animate-pulse"
            />
          )}
          {/* 高亮顯示威脅棋子（活三、活四） */}
          {isThreatStone && !isWinningStone && (
            <circle
              cx={padding + x * cellSize}
              cy={padding + y * cellSize}
              r={cellSize * 0.48}
              fill="none"
              stroke={cell === 'black' ? '#fbbf24' : '#f59e0b'}
              strokeWidth="2.5"
              className="animate-pulse"
            />
          )}
          {isLast && !isWinningStone && !isThreatStone && (
            <circle
              cx={padding + x * cellSize}
              cy={padding + y * cellSize}
              r="3"
              fill={cell === 'black' ? '#ffffff' : '#000000'}
              className="animate-pulse"
            />
          )}
        </g>
      );
    })
  );

  return (
    <div className={`relative w-full max-w-[550px] aspect-square p-2 sm:p-4 bg-[#d7b899] rounded-xl shadow-2xl wood-texture border-4 border-[#8d6e63]/30 transition-all duration-500 ${disabled && !winner ? 'brightness-95 opacity-90' : 'opacity-100'}`}>
      <svg
        viewBox={`0 0 ${boardSize} ${boardSize}`}
        className={`w-full h-full select-none ${disabled ? 'pointer-events-none' : ''}`}
      >
        <g stroke="#5d4037" strokeWidth="1" opacity="0.6">
          {gridLines}
        </g>

        {[3, 7, 11].flatMap(x =>
          [3, 7, 11].map(y => (
            <circle key={`star-${x}-${y}`} cx={padding + x * cellSize} cy={padding + y * cellSize} r="3" fill="#5d4037" />
          ))
        )}

        {interactionCells}

        {stones}
      </svg>

      {/* 重新開啟視窗按鈕 (僅在視窗關閉且已有勝負時顯示) */}
      {winner && !overlayVisible && (
        <button
          onClick={() => setOverlayVisible(true)}
          className="absolute top-4 left-4 z-30 bg-white/90 backdrop-blur hover:bg-white text-slate-800 px-4 py-2 rounded-full shadow-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 animate-in slide-in-from-left duration-300 border border-slate-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          {t('board.view_results')}
        </button>
      )}

      {/* 等待對手指示器 */}
      {disabled && !winner && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-slate-200 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse"></span>
            <p className="text-slate-500 font-medium text-xs uppercase tracking-wider">{t('board.thinking')}</p>
          </div>
        </div>
      )}

      {/* 結算視窗 */}
      {winner && overlayVisible && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg backdrop-blur-[2px] z-40 animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-3xl shadow-2xl text-center transform scale-100 border border-white/20 max-w-[85%] relative animate-in zoom-in duration-300">
            {/* 關閉按鈕 */}
            <button
              onClick={() => setOverlayVisible(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              title="查看棋盤"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center shadow-inner ${winner === 'black' ? 'bg-slate-900' : winner === 'white' ? 'bg-white border-2 border-slate-100' : 'bg-slate-200'}`}>
              <div className={`w-10 h-10 rounded-full ${winner === 'black' ? 'bg-slate-800' : 'bg-slate-50'}`}></div>
            </div>

            <h2 className="text-3xl font-serif font-bold mb-2 text-slate-900">
              {winner === 'draw' ? t('board.draw') : (winner === 'black' ? t('board.winner_black') : t('board.winner_white'))}
            </h2>
            <p className="text-slate-500 font-light tracking-widest uppercase text-xs mb-6">{t('board.game_over')}</p>

            <button
              onClick={() => setOverlayVisible(false)}
              className="px-6 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-sm font-semibold transition-all border border-slate-200/50"
            >
              {t('board.view_board')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Board;
