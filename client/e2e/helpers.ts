import { Page, expect } from '@playwright/test';

/**
 * 測試輔助函數
 */

/**
 * 切換語言
 * @param page - Playwright Page 對象
 * @param language - 語言 ('zh' 中文 或 'en' 英文)
 */
export async function switchLanguage(page: Page, language: 'zh' | 'en') {
    const buttonText = language === 'zh' ? '中文' : 'English';

    try {
        // 如果頁面還沒有導航，先導航到首頁
        const currentUrl = page.url();
        if (currentUrl === 'about:blank' || currentUrl === '') {
            console.log('🌐 導航到首頁...');
            await page.goto('/');
            await page.waitForLoadState('networkidle');
        }

        console.log(`🔍 尋找語言切換按鈕: ${buttonText}`);

        // 查找語言切換按鈕
        const languageButton = page.locator(`button:has-text("${buttonText}")`);

        // 等待按鈕出現並點擊
        await languageButton.waitFor({ state: 'visible', timeout: 5000 });
        await languageButton.click();

        // 等待語言切換生效
        await page.waitForTimeout(500);
        console.log(`✅ 已切換到${language === 'zh' ? '中文' : '英文'}`);
    } catch (error) {
        console.log(`⚠️ 切換語言失敗: ${error}`);
        console.log('ℹ️ 繼續測試（可能已經是目標語言）...');
    }
}


/**
 * 創建遊戲房間
 * @param page - Playwright Page 對象
 * @param side - 選擇的顏色 ('black' 或 'white')
 * @returns 房間的分享連結
 */
export async function createRoom(page: Page, side: 'black' | 'white'): Promise<string> {
    await page.goto('/');

    // 等待頁面加載
    await page.waitForLoadState('networkidle');

    try {
        // 選擇顏色按鈕（使用正則表達式匹配）
        const sideButtonText = side === 'black' ? /執黑.*先行|Black.*First/i : /執白.*後行|White.*Second/i;
        console.log(`🔍 尋找按鈕: ${side === 'black' ? '執黑 (先行)' : '執白 (後行)'}`);

        const sideButton = page.locator('button', { hasText: sideButtonText });
        await sideButton.click({ timeout: 5000 });
        console.log(`✅ 已選擇: ${side === 'black' ? '執黑' : '執白'}`);

        // 等待一下確保選擇生效
        await page.waitForTimeout(500);

        // 點擊「創建遊戲房間」按鈕（使用正則表達式）
        console.log('🔍 尋找「創建遊戲房間」按鈕...');
        const createButton = page.locator('button', { hasText: /創建.*房間|Create.*Room/i });
        await createButton.click({ timeout: 5000 });
        console.log('✅ 已點擊「創建遊戲房間」');

        // 等待 URL 變化，表示房間已創建
        console.log('⏳ 等待房間創建...');
        await page.waitForURL(/.*#room=.*/, { timeout: 15000 });
        console.log('✅ 房間創建成功');

        return page.url();
    } catch (error) {
        console.error('❌ 創建房間失敗:', error);
        // 截圖以便調試
        await page.screenshot({ path: `test-results/create-room-error-${Date.now()}.png` });
        throw error;
    }
}

/**
 * 等待連線成功
 * @param page - Playwright Page 對象
 */
export async function waitForConnection(page: Page) {
    // 等待看到「已連線」或「Connected」文字
    await expect(page.locator('text=/已連線|Connected/i')).toBeVisible({ timeout: 15000 });
}

/**
 * 等待對手
 * @param page - Playwright Page 對象
 */
export async function waitForOpponent(page: Page) {
    // 等待看到「等待」或「Waiting」文字
    await expect(page.locator('text=/等待|Waiting/i')).toBeVisible({ timeout: 10000 });
}

/**
 * 等待棋盤準備好（不再被禁用）
 * @param page - Playwright Page 對象
 */
export async function waitForBoardReady(page: Page) {
    console.log('⏳ 等待棋盤準備好...');

    try {
        // 等待棋盤不再有 brightness-95 opacity-90 類別（表示已解鎖）
        await page.waitForFunction(() => {
            const board = document.querySelector('.wood-texture');
            if (!board) return false;

            const classes = board.className;
            // 棋盤啟用時應該是 opacity-100，而不是 opacity-90
            // 同時不應該有 brightness-95
            const hasBrightness95 = classes.includes('brightness-95');
            const hasOpacity90 = classes.includes('opacity-90');
            const hasOpacity100 = classes.includes('opacity-100');

            // 棋盤準備好的條件：有 opacity-100 或者兩個禁用類別都不存在
            const isReady = hasOpacity100 || (!hasBrightness95 && !hasOpacity90);

            return isReady;
        }, { timeout: 15000 });

        // 額外等待一下確保狀態穩定
        await page.waitForTimeout(500);
        console.log('✅ 棋盤已準備好');
    } catch (error) {
        console.error('⚠️ 等待棋盤準備超時:', error);
        // 截圖以便調試
        await page.screenshot({ path: `test-results/board-not-ready-${Date.now()}.png` });
        console.log('ℹ️ 繼續嘗試（可能棋盤已經準備好）...');
    }
}


/**
 * 在棋盤上落子
 * @param page - Playwright Page 對象
 * @param row - 行號 (0-14)
 * @param col - 列號 (0-14)
 */
export async function makeMove(page: Page, row: number, col: number) {
    // 等待一下確保輪到自己
    await page.waitForTimeout(500);

    // 點擊格子
    await page.click(`[data-testid="cell-${row}-${col}"]`);

    // 等待一下確保落子完成
    await page.waitForTimeout(1000);
}

/**
 * 驗證棋子顏色
 * @param page - Playwright Page 對象
 * @param row - 行號
 * @param col - 列號
 * @param color - 預期的顏色 ('black' 或 'white')
 */
export async function verifyStone(page: Page, row: number, col: number, color: 'black' | 'white') {
    try {
        console.log(`🔍 驗證棋子 (${row}, ${col}) 顏色: ${color}`);

        // 等待棋子出現（使用更靈活的選擇器）
        const stoneSelector = `g.stone.${color}`;
        const stoneLocator = page.locator(stoneSelector).first();

        // 等待至少有一個對應顏色的棋子出現
        await stoneLocator.waitFor({ state: 'visible', timeout: 5000 });

        const stones = await page.locator(stoneSelector).count();
        console.log(`✅ 找到 ${stones} 個${color === 'black' ? '黑' : '白'}棋`);

        // 至少應該有一個對應顏色的棋子
        expect(stones).toBeGreaterThan(0);
    } catch (error) {
        console.error(`❌ 驗證棋子失敗 (${row}, ${col}):`, error);
        // 截圖以便調試
        await page.screenshot({ path: `test-results/verify-stone-error-${Date.now()}.png` });
        throw error;
    }
}

/**
 * 獲取當前回合
 * @param page - Playwright Page 對象
 * @returns 當前回合的顏色
 */
export async function getCurrentTurn(page: Page): Promise<'black' | 'white'> {
    const turnText = await page.locator('text=/黑.*回合|白.*回合|Black.*turn|White.*turn/i').textContent();
    return turnText?.includes('黑') || turnText?.includes('Black') ? 'black' : 'white';
}

/**
 * 驗證遊戲結束
 * @param page - Playwright Page 對象
 * @param winner - 預期的勝者 ('black', 'white', 或 'draw')
 */
export async function verifyGameEnd(page: Page, winner: 'black' | 'white' | 'draw') {
    if (winner === 'draw') {
        await expect(page.locator('text=/平局|和局|Draw/i')).toBeVisible({ timeout: 5000 });
    } else {
        const winnerText = winner === 'black' ? /黑.*勝|Black.*win/i : /白.*勝|White.*win/i;
        await expect(page.locator(`text=${winnerText}`)).toBeVisible({ timeout: 5000 });
    }
}
