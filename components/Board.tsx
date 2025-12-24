
import React from 'react';
import { BoardState, Position, Player } from '../types';
import { BOARD_SIZE } from '../utils/gameLogic';

interface BoardProps {
  board: BoardState;
  onMove: (pos: Position) => void;
  lastMove: Position | null;
  winner: Player | 'draw' | null;
  turn: Player;
}

const Board: React.FC<BoardProps> = ({ board, onMove, lastMove, winner, turn }) => {
  const cellSize = 30;
  const padding = 20;
  const boardSize = (BOARD_SIZE - 1) * cellSize + padding * 2;

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
        x={padding + x * cellSize - cellSize / 2}
        y={padding + y * cellSize - cellSize / 2}
        width={cellSize}
        height={cellSize}
        fill="transparent"
        className="hover:fill-black/5 transition-colors"
        onClick={() => onMove({ x, y })}
      />
    ))
  );

  const stones = board.flatMap((row, y) => 
    row.map((cell, x) => {
      if (!cell) return null;
      const isLast = lastMove?.x === x && lastMove?.y === y;
      return (
        <g key={`stone-${x}-${y}`} className={`stone-shadow ${isLast ? 'animate-in zoom-in duration-300' : ''}`}>
          <circle
            cx={padding + x * cellSize}
            cy={padding + y * cellSize}
            r={cellSize * 0.43}
            className={cell === 'black' ? 'fill-slate-900' : 'fill-slate-50 stroke-slate-200 stroke-1'}
          />
          {isLast && (
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
    <div className="relative w-full max-w-[550px] aspect-square p-2 sm:p-4 bg-[#d7b899] rounded-xl shadow-2xl wood-texture border-4 border-[#8d6e63]/30">
      <svg 
        viewBox={`0 0 ${boardSize} ${boardSize}`}
        className="w-full h-full cursor-pointer select-none"
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

      {winner && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg backdrop-blur-[2px] z-20 transition-all">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center transform scale-110">
            <h2 className="text-3xl font-serif font-bold mb-2 text-slate-900">
              {winner === 'draw' ? '和局' : (winner === 'black' ? '黑子勝出' : '白子勝出')}
            </h2>
            <p className="text-slate-500">對局已結束</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Board;
