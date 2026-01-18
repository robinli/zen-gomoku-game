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
 * E2E 測試：悔棋功能
 * 
 * 測試目標：
 * 1. 第一個玩家加入（創建房間）
 * 2. 第二個玩家加入
 * 3. 第一個玩家下一個子，位置 (7, 7)
 * 4. 悔棋 -> 拒絕
 * 5. 悔棋 -> 同意（第一次）
 * 6. 悔棋 -> 同意（第二次）
 * 7. 悔棋 -> 同意（第三次）
 * 8. 驗證悔棋次數已用完
 */

test.describe('悔棋功能測試', () => {
    test('完整流程：拒絕 → 同意3次 → 次數用完', async ({ browser }) => {
        console.log('📝 測試：悔棋功能');

        // 創建兩個獨立的瀏覽器上下文
        const player1Context = await browser.newContext();
        const player2Context = await browser.newContext();

        const player1Page = await player1Context.newPage();
        const player2Page = await player2Context.newPage();

        // 監聽兩個頁面的 console
        player1Page.on('console', msg => {
            const text = msg.text();
            if (text.includes('Socket') || text.includes('連線') || text.includes('room') || text.includes('悔棋')) {
                console.log('🔵 玩家1:', text);
            }
        });

        player2Page.on('console', msg => {
            const text = msg.text();
            if (text.includes('Socket') || text.includes('連線') || text.includes('room') || text.includes('悔棋')) {
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

            // 玩家 2 加入房間
            console.log('🟢 玩家 2 加入房間...');
            await player2Page.goto(roomUrl);
            await player2Page.waitForLoadState('networkidle');
            console.log('✅ 玩家 2 已加入房間');

            // 等待兩個玩家的棋盤都準備好
            await waitForBoardReady(player1Page);
            await waitForBoardReady(player2Page);

            console.log('✅ 兩個玩家都已準備好！');

            // ========== 階段 2: 第一個玩家下一子 ==========
            console.log('\n========== 階段 2: 第一個玩家下一子 ==========');

            await makeMove(player1Page, 7, 7);
            console.log('✅ 玩家 1 已下子於 (7, 7)');

            // 截圖
            await player1Page.screenshot({ path: 'e2e/test-results/undo-01-first-move.png' });

            // ========== 階段 3: 悔棋 -> 拒絕 ==========
            console.log('\n========== 階段 3: 悔棋 -> 拒絕 ==========');

            // 玩家 1 請求悔棋
            await requestUndo(player1Page);

            // 玩家 2 拒絕
            await respondToUndoRequest(player2Page, false);

            // 玩家 1 關閉被拒絕的訊息
            await closeUndoRejectedDialog(player1Page);

            console.log('✅ 悔棋被拒絕流程完成');

            // 截圖
            await player1Page.screenshot({ path: 'e2e/test-results/undo-02-rejected.png' });

            // ========== 階段 4: 悔棋 -> 同意（第一次）==========
            console.log('\n========== 階段 4: 悔棋 -> 同意（第一次）==========');

            // 玩家 1 請求悔棋
            await requestUndo(player1Page);

            // 玩家 2 同意
            await respondToUndoRequest(player2Page, true);

            // 等待悔棋完成
            await player1Page.waitForTimeout(1000);

            // 驗證棋盤為空
            await verifyBoardEmpty(player1Page);

            // 驗證悔棋次數顯示 (1/3)
            await verifyUndoCount(player1Page, 1, 3);

            console.log('✅ 第一次悔棋成功');

            // 截圖
            await player1Page.screenshot({ path: 'e2e/test-results/undo-03-first-undo.png' });

            // ========== 階段 5: 玩家 1 再下一子 ==========
            console.log('\n========== 階段 5: 玩家 1 再下一子 ==========');

            await makeMove(player1Page, 7, 7);
            console.log('✅ 玩家 1 已下子於 (7, 7)');

            // ========== 階段 6: 悔棋 -> 同意（第二次）==========
            console.log('\n========== 階段 6: 悔棋 -> 同意（第二次）==========');

            // 玩家 1 請求悔棋
            await requestUndo(player1Page);

            // 玩家 2 同意
            await respondToUndoRequest(player2Page, true);

            // 等待悔棋完成
            await player1Page.waitForTimeout(1000);

            // 驗證棋盤為空
            await verifyBoardEmpty(player1Page);

            // 驗證悔棋次數顯示 (2/3)
            await verifyUndoCount(player1Page, 2, 3);

            console.log('✅ 第二次悔棋成功');

            // 截圖
            await player1Page.screenshot({ path: 'e2e/test-results/undo-04-second-undo.png' });

            // ========== 階段 7: 玩家 1 再下一子 ==========
            console.log('\n========== 階段 7: 玩家 1 再下一子 ==========');

            await makeMove(player1Page, 7, 7);
            console.log('✅ 玩家 1 已下子於 (7, 7)');

            // ========== 階段 8: 悔棋 -> 同意（第三次）==========
            console.log('\n========== 階段 8: 悔棋 -> 同意（第三次）==========');

            // 玩家 1 請求悔棋
            await requestUndo(player1Page);

            // 玩家 2 同意
            await respondToUndoRequest(player2Page, true);

            // 等待悔棋完成
            await player1Page.waitForTimeout(1000);

            // 驗證棋盤為空
            await verifyBoardEmpty(player1Page);

            // 驗證悔棋次數顯示 (3/3)
            await verifyUndoCount(player1Page, 3, 3);

            console.log('✅ 第三次悔棋成功');

            // 截圖
            await player1Page.screenshot({ path: 'e2e/test-results/undo-05-third-undo.png' });

            // ========== 階段 9: 玩家 1 再下一子 ==========
            console.log('\n========== 階段 9: 玩家 1 再下一子 ==========');

            await makeMove(player1Page, 7, 7);
            console.log('✅ 玩家 1 已下子於 (7, 7)');

            // ========== 階段 10: 驗證悔棋次數已用完 ==========
            console.log('\n========== 階段 10: 驗證悔棋次數已用完 ==========');

            // 玩家 1 請求悔棋（應該顯示次數已用完）
            await requestUndo(player1Page);

            // 驗證顯示悔棋次數已用完的訊息
            await verifyUndoLimitReached(player1Page);

            console.log('✅ 悔棋次數已用完驗證成功');

            // 截圖
            await player1Page.screenshot({ path: 'e2e/test-results/undo-06-limit-reached.png' });

            // ========== 最終驗證 ==========
            console.log('\n========== 最終驗證 ==========');

            console.log('✅ 所有測試通過！');

        } finally {
            // 清理
            await player1Context.close();
            await player2Context.close();
        }
    });
});
