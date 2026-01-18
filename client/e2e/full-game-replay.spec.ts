import { test, expect } from '@playwright/test';
import {
    createRoom,
    waitForBoardReady,
    playFullGame,
    verifyGameEnd,
    closeGameEndDialog,
    startReplay,
    waitForReplayComplete,
    exitReplay
} from './helpers';

/**
 * E2E 測試：完整遊戲流程與回放功能
 * 
 * 測試目標：
 * 1. 第一個玩家加入（創建房間）
 * 2. 第二個玩家加入
 * 3. 兩個玩家完成一局遊戲
 * 4. 第一個玩家回放，等回放結束
 * 5. 關閉回放
 */

test.describe('完整遊戲流程與回放功能', () => {
    test('完整流程：加入 → 遊戲 → 回放 → 關閉', async ({ browser }) => {
        console.log('📝 測試：完整遊戲流程與回放功能');

        // 創建兩個獨立的瀏覽器上下文
        const player1Context = await browser.newContext();
        const player2Context = await browser.newContext();

        const player1Page = await player1Context.newPage();
        const player2Page = await player2Context.newPage();

        // 監聽兩個頁面的 console
        player1Page.on('console', msg => {
            const text = msg.text();
            if (text.includes('Socket') || text.includes('連線') || text.includes('room') || text.includes('回放')) {
                console.log('🔵 玩家1:', text);
            }
        });

        player2Page.on('console', msg => {
            const text = msg.text();
            if (text.includes('Socket') || text.includes('連線') || text.includes('room') || text.includes('回放')) {
                console.log('🟢 玩家2:', text);
            }
        });

        try {
            // ========== 階段 1: 玩家加入 ==========
            console.log('\n========== 階段 1: 玩家加入 ==========');

            // 玩家 1 創建房間（執黑）
            console.log('🔵 玩家 1 創建房間...');
            const roomUrl = await createRoom(player1Page, 'black');
            console.log('✅ 房間已創建:', roomUrl);

            // 截圖
            await player1Page.screenshot({ path: 'e2e/test-results/01-player1-created-room.png' });

            // 玩家 2 加入房間
            console.log('🟢 玩家 2 加入房間...');
            await player2Page.goto(roomUrl);
            await player2Page.waitForLoadState('networkidle');
            console.log('✅ 玩家 2 已加入房間');

            // 等待兩個玩家的棋盤都準備好
            await waitForBoardReady(player1Page);
            await waitForBoardReady(player2Page);

            // 截圖
            await player1Page.screenshot({ path: 'e2e/test-results/02-player1-ready.png' });
            await player2Page.screenshot({ path: 'e2e/test-results/03-player2-ready.png' });

            console.log('✅ 兩個玩家都已準備好！');

            // ========== 階段 2: 完成一局遊戲 ==========
            console.log('\n========== 階段 2: 完成一局遊戲 ==========');

            // 定義一個簡單的勝利棋譜（黑棋勝利，9步）
            const winningMoves = [
                { row: 7, col: 7 },   // 黑 1
                { row: 7, col: 8 },   // 白 2
                { row: 8, col: 7 },   // 黑 3
                { row: 8, col: 8 },   // 白 4
                { row: 9, col: 7 },   // 黑 5
                { row: 9, col: 8 },   // 白 6
                { row: 10, col: 7 },  // 黑 7
                { row: 10, col: 8 },  // 白 8
                { row: 11, col: 7 },  // 黑 9 - 勝利！(五連)
            ];

            // 執行遊戲
            await playFullGame(player1Page, player2Page, winningMoves);

            // 等待一下確保遊戲結束狀態更新
            await player1Page.waitForTimeout(1500);
            await player2Page.waitForTimeout(1500);

            // 驗證遊戲結束（黑棋勝利）
            console.log('🔍 驗證遊戲結束狀態...');
            await verifyGameEnd(player1Page, 'black');
            await verifyGameEnd(player2Page, 'black');

            // 截圖
            await player1Page.screenshot({ path: 'e2e/test-results/04-game-ended-player1.png' });
            await player2Page.screenshot({ path: 'e2e/test-results/05-game-ended-player2.png' });

            console.log('✅ 遊戲已結束，黑棋勝利！');

            // ========== 階段 3: 第一個玩家回放 ==========
            console.log('\n========== 階段 3: 第一個玩家回放 ==========');

            // 關閉遊戲結束對話框
            //await closeGameEndDialog(player1Page);

            // 開始回放
            await startReplay(player1Page);

            // 截圖
            await player1Page.screenshot({ path: 'e2e/test-results/06-replay-started.png' });

            // 等待回放完成（9步）
            await waitForReplayComplete(player1Page, winningMoves.length);

            // 截圖
            await player1Page.screenshot({ path: 'e2e/test-results/07-replay-completed.png' });

            console.log('✅ 回放已完成！');

            // ========== 階段 4: 關閉回放 ==========
            console.log('\n========== 階段 4: 關閉回放 ==========');

            // 退出回放
            await exitReplay(player1Page);

            // 截圖
            await player1Page.screenshot({ path: 'e2e/test-results/08-replay-exited.png' });

            console.log('✅ 已退出回放模式！');

            // ========== 最終驗證 ==========
            console.log('\n========== 最終驗證 ==========');

            // 驗證回放控制面板已消失
            const replayTitle = player1Page.locator('text=/對局回放|Game Replay/i');
            await expect(replayTitle).toBeHidden();

            console.log('✅ 所有測試通過！');

        } finally {
            // 清理
            await player1Context.close();
            await player2Context.close();
        }
    });
});
