import { test, expect } from '@playwright/test';
import { loginAsPlayer } from './helpers';

/**
 * E2E 測試：雙人連線功能
 * 
 * 測試目標：驗證兩個玩家可以成功加入同一個遊戲房間
 */

test.describe('雙人連線功能', () => {
    test('檢查單個玩家的 Socket 連線', async ({ page }) => {
        console.log('📝 測試：檢查 Socket 連線');

        // 🔐 先登入
        await loginAsPlayer(page, 'Test Player');

        // 監聽 console 訊息
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('Socket') || text.includes('連線') || text.includes('connect')) {
                console.log('🔍 瀏覽器 Console:', text);
            }
        });

        // 等待一下讓 Socket 有時間連線
        console.log('⏳ 等待 3 秒讓 Socket 連線...');
        await page.waitForTimeout(3000);

        // 檢查 Socket 連線狀態
        const socketStatus = await page.evaluate(() => {
            // @ts-ignore
            const service = window.socketService;
            if (!service) {
                return { error: 'socketService 不存在' };
            }

            return {
                isConnected: service.isConnected(),
                socketId: service.socket?.id,
                socketConnected: service.socket?.connected,
                hasSocket: !!service.socket
            };
        });

        console.log('🔍 Socket 狀態:', JSON.stringify(socketStatus, null, 2));

        // 截圖
        await page.screenshot({ path: 'e2e/test-results/socket-diagnostic.png' });

        // 驗證
        expect(socketStatus.hasSocket).toBe(true);
        expect(socketStatus.isConnected).toBe(true);
        console.log('✅ Socket 連線成功！');
    });

    test('檢查創建房間後的 Socket 連線', async ({ page }) => {
        console.log('📝 測試：創建房間後的 Socket 連線');

        // 🔐 先登入
        await loginAsPlayer(page, 'Test Player');

        // 監聽 console
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('Socket') || text.includes('連線') || text.includes('connect') || text.includes('room')) {
                console.log('🔍 瀏覽器 Console:', text);
            }
        });

        // 點擊創建房間
        console.log('🎮 創建房間...');
        await page.click('button:has-text("執黑")');
        await page.waitForTimeout(500);
        await page.click('button:has-text("創建")');

        // 等待 URL 變化
        await page.waitForURL(/.*#room=.*/, { timeout: 10000 });
        const roomUrl = page.url();
        console.log('✅ 房間已創建:', roomUrl);

        // 等待 Socket 連線
        console.log('⏳ 等待 5 秒讓 Socket 連線...');
        await page.waitForTimeout(5000);

        // 檢查 Socket 狀態
        const socketStatus = await page.evaluate(() => {
            // @ts-ignore
            const service = window.socketService;
            return {
                isConnected: service?.isConnected() || false,
                socketId: service?.socket?.id,
                socketConnected: service?.socket?.connected || false,
                hasSocket: !!service?.socket
            };
        });

        console.log('🔍 創建房間後的 Socket 狀態:', JSON.stringify(socketStatus, null, 2));

        // 截圖
        await page.screenshot({ path: 'e2e/test-results/socket-after-create-room.png' });

        // 驗證
        expect(socketStatus.hasSocket).toBe(true);
        expect(socketStatus.isConnected).toBe(true);
        expect(socketStatus.socketId).toBeDefined();

        console.log('✅ Socket 連線成功！');
    });

    test('檢查兩個玩家是否能同時連線', async ({ browser }) => {
        console.log('📝 測試：兩個玩家同時連線');

        const player1Context = await browser.newContext();
        const player2Context = await browser.newContext();

        const player1Page = await player1Context.newPage();
        const player2Page = await player2Context.newPage();

        // 監聽兩個頁面的 console
        player1Page.on('console', msg => {
            const text = msg.text();
            if (text.includes('Socket') || text.includes('連線') || text.includes('room')) {
                console.log('🔵 玩家1:', text);
            }
        });

        player2Page.on('console', msg => {
            const text = msg.text();
            if (text.includes('Socket') || text.includes('連線') || text.includes('room')) {
                console.log('🟢 玩家2:', text);
            }
        });

        try {
            // 🔐 玩家 1 登入
            console.log('🔵 玩家 1 登入...');
            await loginAsPlayer(player1Page, 'Player 1');

            // 玩家 1 創建房間
            console.log('🔵 玩家 1 創建房間...');
            await player1Page.click('button:has-text("執黑")');
            await player1Page.waitForTimeout(500);
            await player1Page.click('button:has-text("創建")');
            await player1Page.waitForURL(/.*#room=.*/, { timeout: 10000 });

            const roomUrl = player1Page.url();
            console.log('✅ 房間已創建:', roomUrl);

            // 等待玩家 1 的 Socket 連線
            await player1Page.waitForTimeout(3000);

            // 檢查玩家 1 的 Socket
            const player1Socket = await player1Page.evaluate(() => {
                // @ts-ignore
                const service = window.socketService;
                return {
                    isConnected: service?.isConnected() || false,
                    socketId: service?.socket?.id
                };
            });
            console.log('🔵 玩家 1 Socket:', player1Socket);

            // 🔐 玩家 2 登入
            console.log('🟢 玩家 2 登入...');
            await loginAsPlayer(player2Page, 'Player 2');

            // 玩家 2 加入房間
            console.log('🟢 玩家 2 加入房間...');
            await player2Page.goto(roomUrl);
            await player2Page.waitForLoadState('networkidle');
            console.log('✅ 玩家 2 頁面已加載');

            // 等待玩家 2 的 Socket 連線
            await player2Page.waitForTimeout(3000);

            // 檢查玩家 2 的 Socket
            const player2Socket = await player2Page.evaluate(() => {
                // @ts-ignore
                const service = window.socketService;
                return {
                    isConnected: service?.isConnected() || false,
                    socketId: service?.socket?.id
                };
            });
            console.log('🟢 玩家 2 Socket:', player2Socket);

            // 截圖
            await player1Page.screenshot({ path: 'e2e/test-results/player1-with-player2.png' });
            await player2Page.screenshot({ path: 'e2e/test-results/player2-joined.png' });

            // 驗證
            expect(player1Socket.isConnected).toBe(true);
            expect(player1Socket.socketId).toBeDefined();
            expect(player2Socket.isConnected).toBe(true);
            expect(player2Socket.socketId).toBeDefined();

            // 驗證兩個玩家的 Socket ID 不同
            expect(player1Socket.socketId).not.toBe(player2Socket.socketId);

            console.log('✅ 兩個玩家都成功連線，且 Socket ID 不同！');

        } finally {
            await player1Context.close();
            await player2Context.close();
        }
    });

    test('驗證玩家名稱顯示', async ({ browser }) => {
        console.log('📝 測試：驗證玩家名稱顯示');

        const player1Context = await browser.newContext();
        const player2Context = await browser.newContext();

        const player1Page = await player1Context.newPage();
        const player2Page = await player2Context.newPage();

        try {
            // 🔐 玩家 1 登入（名稱：Alice）
            console.log('🔵 玩家 1 (Alice) 登入...');
            await loginAsPlayer(player1Page, 'Alice');

            // 玩家 1 創建房間
            console.log('🔵 Alice 創建房間...');
            await player1Page.click('button:has-text("執黑")');
            await player1Page.waitForTimeout(500);
            await player1Page.click('button:has-text("創建")');
            await player1Page.waitForURL(/.*#room=.*/, { timeout: 10000 });

            const roomUrl = player1Page.url();
            console.log('✅ 房間已創建:', roomUrl);

            // 🔐 玩家 2 登入（名稱：Bob）
            console.log('🟢 玩家 2 (Bob) 登入...');
            await loginAsPlayer(player2Page, 'Bob');

            // 玩家 2 加入房間
            console.log('🟢 Bob 加入房間...');
            await player2Page.goto(roomUrl);
            await player2Page.waitForLoadState('networkidle');

            // 等待雙方連線穩定
            await player1Page.waitForTimeout(2000);
            await player2Page.waitForTimeout(2000);

            // 檢查玩家 1 (Alice) 看到的名稱
            const player1Names = await player1Page.evaluate(() => {
                // 查找包含玩家名稱的文字
                const pageText = document.body.innerText;
                return {
                    pageText,
                    hasAlice: pageText.includes('Alice'),
                    hasBob: pageText.includes('Bob')
                };
            });
            console.log('🔵 Alice 看到的內容:', player1Names);

            // 檢查玩家 2 (Bob) 看到的名稱
            const player2Names = await player2Page.evaluate(() => {
                // 查找包含玩家名稱的文字
                const pageText = document.body.innerText;
                return {
                    pageText,
                    hasAlice: pageText.includes('Alice'),
                    hasBob: pageText.includes('Bob')
                };
            });
            console.log('🟢 Bob 看到的內容:', player2Names);

            // 截圖
            await player1Page.screenshot({ path: 'e2e/test-results/player1-names.png' });
            await player2Page.screenshot({ path: 'e2e/test-results/player2-names.png' });

            // 驗證：Alice 應該看到自己的名稱 (Alice) 和對方的名稱 (Bob)
            expect(player1Names.hasAlice).toBe(true);
            expect(player1Names.hasBob).toBe(true);

            // 驗證：Bob 應該看到自己的名稱 (Bob) 和對方的名稱 (Alice)
            expect(player2Names.hasAlice).toBe(true);
            expect(player2Names.hasBob).toBe(true);

            console.log('✅ 玩家名稱顯示正確！');

        } finally {
            await player1Context.close();
            await player2Context.close();
        }
    });
});
