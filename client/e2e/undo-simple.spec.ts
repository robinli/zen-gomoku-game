import { test, expect } from '@playwright/test';
import {
    createRoom,
    waitForBoardReady,
    makeMove,
    requestUndo,
    respondToUndoRequest,
    closeUndoRejectedDialog,
    verifyUndoCount,
    verifyUndoLimitReached,
    verifyBoardEmpty
} from './helpers';

/**
 * E2E 測試：悔棋功能 - 簡化版
 * 只測試核心流程
 */

test.describe('悔棋功能測試 - 簡化版', () => {
    test('測試悔棋次數用完', async ({ browser }) => {
        console.log('📝 測試：悔棋次數用完');

        const player1Context = await browser.newContext();
        const player2Context = await browser.newContext();

        const player1Page = await player1Context.newPage();
        const player2Page = await player2Context.newPage();

        try {
            // 階段 1: 玩家加入
            console.log('\n========== 階段 1: 玩家加入 ==========');
            const roomUrl = await createRoom(player1Page, 'black');
            await player2Page.goto(roomUrl);
            await player2Page.waitForLoadState('networkidle');
            await waitForBoardReady(player1Page);
            await waitForBoardReady(player2Page);
            console.log('✅ 兩個玩家都已準備好！');

            // 階段 2: 下一子並悔棋3次
            for (let i = 1; i <= 3; i++) {
                console.log(`\n========== 第 ${i} 次悔棋 ==========`);

                // 下一子
                await makeMove(player1Page, 7, 7);
                console.log(`✅ 玩家 1 已下子`);

                // 請求悔棋
                await requestUndo(player1Page);

                // 同意悔棋
                await respondToUndoRequest(player2Page, true);
                await player1Page.waitForTimeout(1000);

                // 驗證棋盤為空
                await verifyBoardEmpty(player1Page);

                // 驗證悔棋次數
                await verifyUndoCount(player1Page, i, 3);

                console.log(`✅ 第 ${i} 次悔棋成功`);
            }

            // 階段 3: 再下一子並嘗試悔棋（應該失敗）
            console.log('\n========== 階段 3: 驗證悔棋次數已用完 ==========');

            await makeMove(player1Page, 7, 7);
            console.log('✅ 玩家 1 已下子');

            // 請求悔棋（應該顯示次數已用完）
            await requestUndo(player1Page);

            // 驗證顯示悔棋次數已用完的訊息
            await verifyUndoLimitReached(player1Page);

            console.log('✅ 悔棋次數已用完驗證成功');
            console.log('✅ 所有測試通過！');

        } finally {
            await player1Context.close();
            await player2Context.close();
        }
    });
});
