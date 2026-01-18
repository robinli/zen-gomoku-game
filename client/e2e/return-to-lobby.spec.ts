import { test, expect } from '@playwright/test';
import {
    createRoom,
    waitForBoardReady,
    clickReturnToLobby,
    cancelConfirmLeave,
    confirmLeave,
    verifyInLobby,
    closeOpponentLeftDialog
} from './helpers';

/**
 * E2E 測試：返回大廳功能
 * 
 * 測試目標：
 * 1. 第一個玩家加入（創建房間）
 * 2. 第二個玩家加入
 * 3. 第一個玩家按下 [返回大廳]，開窗顯示 確認離開遊戲？ 按下 [取消] 關閉視窗
 * 4. 第一個玩家按下 [返回大廳]，開窗顯示 確認離開遊戲？ 按下 [確認離開] 關閉視窗，進入大廳
 * 5. 第二個玩家，開窗顯示：對手已離開。按下 [返回大廳] 關閉視窗，進入大廳
 */

test.describe('返回大廳功能測試', () => {
    test('完整流程：取消離開 → 確認離開 → 對手收到通知', async ({ browser }) => {
        console.log('📝 測試：返回大廳功能');

        // 創建兩個獨立的瀏覽器上下文
        const player1Context = await browser.newContext();
        const player2Context = await browser.newContext();

        const player1Page = await player1Context.newPage();
        const player2Page = await player2Context.newPage();

        // 監聽兩個頁面的 console
        player1Page.on('console', msg => {
            const text = msg.text();
            if (text.includes('Socket') || text.includes('連線') || text.includes('room') || text.includes('離開')) {
                console.log('🔵 玩家1:', text);
            }
        });

        player2Page.on('console', msg => {
            const text = msg.text();
            if (text.includes('Socket') || text.includes('連線') || text.includes('room') || text.includes('離開')) {
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

            // 截圖
            await player1Page.screenshot({ path: 'e2e/test-results/return-lobby-01-both-ready.png' });

            // ========== 階段 2: 第一個玩家按下 [返回大廳]，按下 [取消] ==========
            console.log('\n========== 階段 2: 第一個玩家按下 [返回大廳]，按下 [取消] ==========');

            // 玩家 1 點擊返回大廳按鈕
            await clickReturnToLobby(player1Page);

            // 玩家 1 點擊取消按鈕
            await cancelConfirmLeave(player1Page);

            console.log('✅ 確認對話框已關閉，玩家仍在遊戲中');

            // 截圖
            await player1Page.screenshot({ path: 'e2e/test-results/return-lobby-02-cancel-leave.png' });

            // 驗證玩家 1 仍在遊戲房間（URL 仍包含 room=）
            const player1UrlAfterCancel = player1Page.url();
            if (!player1UrlAfterCancel.includes('#room=')) {
                throw new Error('玩家 1 應該仍在遊戲房間，但 URL 已改變');
            }
            console.log('✅ 驗證：玩家 1 仍在遊戲房間');

            // ========== 階段 3: 第一個玩家按下 [返回大廳]，按下 [確認離開] ==========
            console.log('\n========== 階段 3: 第一個玩家按下 [返回大廳]，按下 [確認離開] ==========');

            // 玩家 1 再次點擊返回大廳按鈕
            await clickReturnToLobby(player1Page);

            // 玩家 1 點擊確認離開按鈕
            await confirmLeave(player1Page);

            console.log('✅ 玩家 1 已確認離開');

            // 等待頁面重新載入到大廳
            await player1Page.waitForLoadState('networkidle');
            await player1Page.waitForTimeout(1000);

            // 驗證玩家 1 已返回大廳
            await verifyInLobby(player1Page);

            console.log('✅ 玩家 1 已成功返回大廳');

            // 截圖
            await player1Page.screenshot({ path: 'e2e/test-results/return-lobby-03-player1-in-lobby.png' });

            // ========== 階段 4: 第二個玩家收到對手離開通知 ==========
            console.log('\n========== 階段 4: 第二個玩家收到對手離開通知 ==========');

            // 等待玩家 2 收到對手離開的對話框
            await player2Page.waitForTimeout(2000);

            // 截圖
            await player2Page.screenshot({ path: 'e2e/test-results/return-lobby-04-player2-opponent-left.png' });

            // 玩家 2 關閉對手離開對話框並返回大廳
            await closeOpponentLeftDialog(player2Page);

            console.log('✅ 玩家 2 已關閉對手離開對話框');

            // 等待頁面重新載入到大廳
            await player2Page.waitForLoadState('networkidle');
            await player2Page.waitForTimeout(1000);

            // 驗證玩家 2 已返回大廳
            await verifyInLobby(player2Page);

            console.log('✅ 玩家 2 已成功返回大廳');

            // 截圖
            await player2Page.screenshot({ path: 'e2e/test-results/return-lobby-05-player2-in-lobby.png' });

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
