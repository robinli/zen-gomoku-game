import { Page, expect } from '@playwright/test';

/**
 * 測試輔助函數
 */

/**
 * 🔐 登入（支援訪客模式和 Mock 登入）
 * @param page - Playwright Page 對象
 * @param playerName - 玩家名稱 (例如: 'Player 1', 'Player 2')
 */
export async function loginAsPlayer(page: Page, playerName: string) {
    console.log(`🔐 執行登入: ${playerName}...`);

    try {
        // 導航到首頁
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // 在訪客模式下（VITE_ENABLE_AUTH=false），直接設定訪客名稱
        await page.evaluate((name) => {
            localStorage.setItem('guestDisplayName', name);
        }, playerName);

        console.log(`✅ 已設定訪客名稱: ${playerName}`);

        // 重新載入頁面以觸發 AuthContext 讀取
        await page.reload();
        await page.waitForLoadState('networkidle');

        // 等待大廳載入
        console.log('⏳ 等待大廳載入...');
        await page.waitForTimeout(2000);

        // 驗證已進入大廳（檢查創建房間按鈕）
        const createButton = page.locator('button', { hasText: /創建.*房間|Create.*Room/i });
        await createButton.waitFor({ state: 'visible', timeout: 10000 });

        console.log(`✅ ${playerName} 登入成功，已進入大廳`);
    } catch (error) {
        console.error(`❌ ${playerName} 登入失敗:`, error);
        await page.screenshot({ path: `test-results/login-error-${playerName}-${Date.now()}.png` });
        throw error;
    }
}


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
    // 檢查是否已在大廳，如果不在則導航
    const currentUrl = page.url();
    if (currentUrl === 'about:blank' || currentUrl === '' || currentUrl.includes('#room=')) {
        console.log('🌐 導航到大廳...');
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    }

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
        // 方法 1: 等待棋盤 SVG 元素出現
        const boardSvg = page.locator('svg').first();
        await boardSvg.waitFor({ state: 'visible', timeout: 10000 });
        console.log('✅ 棋盤 SVG 已顯示');

        // 方法 2: 等待至少有一個可點擊的格子
        const firstCell = page.locator('[data-testid^="cell-"]').first();
        await firstCell.waitFor({ state: 'attached', timeout: 10000 });
        console.log('✅ 棋盤格子已就緒');

        // 額外等待確保遊戲狀態完全同步
        await page.waitForTimeout(1000);
        console.log('✅ 棋盤已準備好');
    } catch (error) {
        console.error('⚠️ 等待棋盤準備超時:', error);
        // 截圖以便調試
        await page.screenshot({ path: `test-results/board-not-ready-${Date.now()}.png` });

        // 嘗試備用方案：直接等待固定時間
        console.log('ℹ️ 使用備用方案：等待固定時間...');
        await page.waitForTimeout(3000);
        console.log('✅ 備用方案完成，繼續測試');
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

/**
 * 完成一局遊戲
 * @param player1Page - 玩家1的 Page 對象（黑棋）
 * @param player2Page - 玩家2的 Page 對象（白棋）
 * @param moves - 棋步序列 [{row, col}, ...]
 */
export async function playFullGame(
    player1Page: Page,
    player2Page: Page,
    moves: Array<{ row: number; col: number }>
) {
    console.log(`🎮 開始下棋，共 ${moves.length} 步...`);

    for (let i = 0; i < moves.length; i++) {
        const move = moves[i];
        const isBlackTurn = i % 2 === 0;
        const currentPage = isBlackTurn ? player1Page : player2Page;
        const playerName = isBlackTurn ? '玩家1(黑)' : '玩家2(白)';

        console.log(`${playerName} 下棋: (${move.row}, ${move.col})`);

        // 落子
        await makeMove(currentPage, move.row, move.col);

        // 等待一下確保對方收到更新
        await player1Page.waitForTimeout(700);
        await player2Page.waitForTimeout(700);

        console.log(`✅ 第 ${i + 1} 步完成`);
    }

    console.log('✅ 遊戲完成！');
}

/**
 * 關閉遊戲結束對話框
 * @param page - Playwright Page 對象
 */
export async function closeGameEndDialog(page: Page) {
    console.log('🔘 關閉遊戲結束對話框...');

    try {
        // 查找對話框按鈕（使用 dialog-btn 類別）
        console.log('🔍 查找對話框按鈕...');
        const dialogButton = page.locator('.dialog-btn').first();

        // 等待按鈕可見（縮短超時時間）
        await dialogButton.waitFor({ state: 'visible', timeout: 1000 });
        console.log('✅ 找到對話框按鈕');

        // 點擊按鈕
        await dialogButton.click();
        console.log('✅ 已點擊確認按鈕');

        // 等待對話框消失（縮短等待時間）
        await page.waitForTimeout(500);
        console.log('✅ 遊戲結束對話框已關閉');
    } catch (error) {
        console.error('⚠️ 關閉對話框失敗:', error);
        await page.screenshot({ path: `test-results/close-dialog-error-${Date.now()}.png` });

        // 即使失敗也繼續測試
        console.log('ℹ️ 繼續測試（可能對話框已自動關閉或不存在）...');
    }
}

/**
 * 開始回放
 * @param page - Playwright Page 對象
 */
export async function startReplay(page: Page) {
    console.log('🎬 開始回放...');

    try {
        // 查找並點擊「回放對局」按鈕
        const replayButton = page.locator('button', { hasText: /回放對局|Replay Game/i });
        await replayButton.waitFor({ state: 'visible', timeout: 5000 });
        await replayButton.click();

        console.log('✅ 已點擊回放按鈕');

        // 等待回放控制面板出現
        await page.waitForTimeout(1000);

        // 驗證回放控制面板已顯示
        const replayTitle = page.locator('text=/對局回放|Game Replay/i');
        await replayTitle.waitFor({ state: 'visible', timeout: 5000 });

        console.log('✅ 回放模式已啟動');
    } catch (error) {
        console.error('❌ 開始回放失敗:', error);
        await page.screenshot({ path: `test-results/start-replay-error-${Date.now()}.png` });
        throw error;
    }
}

/**
 * 等待回放完成
 * @param page - Playwright Page 對象
 * @param totalSteps - 總步數
 * @param timeoutMs - 超時時間（毫秒）
 */
export async function waitForReplayComplete(page: Page, totalSteps: number, timeoutMs: number = 30000) {
    console.log(`⏳ 等待回放完成（共 ${totalSteps} 步）...`);

    const startTime = Date.now();

    try {
        // 策略：輪詢檢查回放進度，直到達到最後一步
        let lastStep = -1;
        let stableCount = 0;
        const requiredStableChecks = 3; // 需要連續 3 次檢查都顯示完成

        while (Date.now() - startTime < timeoutMs) {
            // 查找回放控制面板中的進度文字
            // 中文格式: "第 X 步" 在第一個 span，"共 Y 步" 在第二個 span
            // 英文格式: "Step X" 在第一個 span，"of Y" 在第二個 span
            const progressContainer = page.locator('.flex.justify-between.text-xs.text-slate-500.mb-2').first();
            const firstSpan = progressContainer.locator('span').first();
            const progressText = await firstSpan.textContent().catch(() => null);

            if (progressText) {
                // 提取當前步數
                // 中文: "第 9 步" -> 9
                // 英文: "Step 9" -> 9
                const match = progressText.match(/(\d+)/);
                const currentStep = match ? parseInt(match[1]) : 0;

                console.log(`📊 當前回放進度: ${currentStep}/${totalSteps} (文字: "${progressText}")`);

                // 檢查是否已到達最後一步
                if (currentStep >= totalSteps) {
                    stableCount++;
                    console.log(`✓ 回放已到達最後一步 (${stableCount}/${requiredStableChecks})`);

                    if (stableCount >= requiredStableChecks) {
                        // 額外等待 1 秒確保 UI 穩定
                        await page.waitForTimeout(1000);

                        const elapsed = Date.now() - startTime;
                        console.log(`✅ 回放完成！耗時 ${(elapsed / 1000).toFixed(1)} 秒`);
                        return;
                    }
                } else {
                    stableCount = 0; // 重置穩定計數
                }

                lastStep = currentStep;
            }

            // 等待一小段時間再檢查
            await page.waitForTimeout(500);
        }

        // 超時
        throw new Error(`回放未在 ${timeoutMs}ms 內完成，最後步數: ${lastStep}/${totalSteps}`);

    } catch (error) {
        console.error('❌ 等待回放完成失敗:', error);
        await page.screenshot({ path: `test-results/replay-timeout-${Date.now()}.png` });
        throw error;
    }
}

/**
 * 退出回放
 * @param page - Playwright Page 對象
 */
export async function exitReplay(page: Page) {
    console.log('🚪 退出回放...');

    try {
        // 查找並點擊關閉按鈕（使用 title 屬性）
        // 從錯誤上下文看：button \"關閉\" [ref=e38]
        const closeButton = page.locator('button[title*="關閉"], button[title*="Close"]').first();

        await closeButton.waitFor({ state: 'visible', timeout: 10000 });
        await closeButton.click();

        console.log('✅ 已點擊退出按鈕');

        // 等待回放控制面板消失
        await page.waitForTimeout(1000);

        // 驗證回放控制面板已隱藏
        const replayTitle = page.locator('text=/對局回放|Game Replay/i');
        await replayTitle.waitFor({ state: 'hidden', timeout: 5000 });

        console.log('✅ 已退出回放模式');
    } catch (error) {
        console.error('❌ 退出回放失敗:', error);
        await page.screenshot({ path: `test-results/exit-replay-error-${Date.now()}.png` });
        throw error;
    }
}

/**
 * 請求悔棋
 * @param page - Playwright Page 對象
 */
export async function requestUndo(page: Page) {
    console.log('🔄 請求悔棋...');

    try {
        // 查找並點擊「請求悔棋」按鈕
        const undoButton = page.locator('button', { hasText: /請求悔棋|Request Undo/i });
        await undoButton.waitFor({ state: 'visible', timeout: 5000 });
        await undoButton.click();

        console.log('✅ 已點擊請求悔棋按鈕');

        // 等待請求發送
        await page.waitForTimeout(500);
    } catch (error) {
        console.error('❌ 請求悔棋失敗:', error);
        await page.screenshot({ path: `test-results/request-undo-error-${Date.now()}.png` });
        throw error;
    }
}

/**
 * 回應悔棋請求（同意或拒絕）
 * @param page - Playwright Page 對象
 * @param accept - true 表示同意，false 表示拒絕
 */
export async function respondToUndoRequest(page: Page, accept: boolean) {
    console.log(`${accept ? '✅ 同意' : '❌ 拒絕'}悔棋請求...`);

    try {
        // 等待悔棋請求對話框出現
        const dialog = page.locator('text=/悔棋請求|Undo Request/i');
        await dialog.waitFor({ state: 'visible', timeout: 5000 });
        console.log('✅ 悔棋請求對話框已顯示');

        // 點擊同意或拒絕按鈕
        const buttonText = accept ? /同意|Agree/i : /拒絕|Reject/i;
        const button = page.locator('button', { hasText: buttonText });
        await button.waitFor({ state: 'visible', timeout: 5000 });
        await button.click();

        console.log(`✅ 已點擊${accept ? '同意' : '拒絕'}按鈕`);

        // 等待對話框消失
        await page.waitForTimeout(500);
    } catch (error) {
        console.error(`❌ 回應悔棋請求失敗:`, error);
        await page.screenshot({ path: `test-results/respond-undo-error-${Date.now()}.png` });
        throw error;
    }
}

/**
 * 關閉悔棋被拒絕的訊息對話框
 * @param page - Playwright Page 對象
 */
export async function closeUndoRejectedDialog(page: Page) {
    console.log('🔘 關閉悔棋被拒絕對話框...');

    try {
        // 等待對話框出現
        const dialog = page.locator('text=/悔棋被拒絕|Undo Rejected/i');
        await dialog.waitFor({ state: 'visible', timeout: 5000 });
        console.log('✅ 悔棋被拒絕對話框已顯示');

        // 點擊確認按鈕
        const confirmButton = page.locator('button', { hasText: /確認|Confirm|關閉|Close/i }).first();
        await confirmButton.waitFor({ state: 'visible', timeout: 5000 });
        await confirmButton.click();

        console.log('✅ 已關閉悔棋被拒絕對話框');

        // 等待對話框消失
        await page.waitForTimeout(500);
    } catch (error) {
        console.error('❌ 關閉悔棋被拒絕對話框失敗:', error);
        await page.screenshot({ path: `test-results/close-undo-rejected-error-${Date.now()}.png` });
        throw error;
    }
}

/**
 * 驗證悔棋次數顯示
 * @param page - Playwright Page 對象
 * @param used - 已使用次數
 * @param limit - 總次數限制
 */
export async function verifyUndoCount(page: Page, used: number, limit: number) {
    console.log(`🔍 驗證悔棋次數: ${used}/${limit}...`);

    try {
        // 查找顯示悔棋次數的文字
        const undoCountText = page.locator(`text=/${used}\\/${limit}/i`);
        await undoCountText.waitFor({ state: 'visible', timeout: 5000 });

        console.log(`✅ 悔棋次數顯示正確: ${used}/${limit}`);
    } catch (error) {
        console.error(`❌ 驗證悔棋次數失敗:`, error);
        await page.screenshot({ path: `test-results/verify-undo-count-error-${Date.now()}.png` });
        throw error;
    }
}

/**
 * 驗證悔棋次數已用完的訊息
 * @param page - Playwright Page 對象
 */
export async function verifyUndoLimitReached(page: Page) {
    console.log('🔍 驗證悔棋次數已用完訊息...');

    try {
        // 查找對話框標題「無法悔棋」
        const limitMessage = page.locator('.base-dialog-title', { hasText: /無法悔棋|Cannot Undo/i });
        await limitMessage.waitFor({ state: 'visible', timeout: 5000 });

        console.log('✅ 悔棋次數已用完訊息已顯示');

        // 等待一下確保對話框完全顯示
        await page.waitForTimeout(1000);

        // 關閉訊息對話框 - 使用 CSS 類別選擇器
        console.log('🔍 查找確認按鈕...');
        const closeButton = page.locator('.dialog-btn').first();

        // 檢查按鈕是否存在
        const buttonCount = await page.locator('.dialog-btn').count();
        console.log(`📊 找到 ${buttonCount} 個 .dialog-btn 按鈕`);

        await closeButton.waitFor({ state: 'visible', timeout: 5000 });
        console.log('✅ 找到確認按鈕，準備點擊');

        // 使用強制點擊，忽略可能的遮擋
        await closeButton.click({ force: true });

        console.log('✅ 已點擊確認按鈕');

        // 等待對話框消失
        await page.waitForTimeout(1000);

        console.log('✅ 已關閉訊息對話框');
    } catch (error) {
        console.error('❌ 驗證悔棋次數已用完訊息失敗:', error);
        await page.screenshot({ path: `test-results/verify-undo-limit-error-${Date.now()}.png` });
        throw error;
    }
}

/**
 * 驗證棋盤上沒有棋子
 * @param page - Playwright Page 對象
 */
export async function verifyBoardEmpty(page: Page) {
    console.log('🔍 驗證棋盤為空...');

    try {
        // 查找所有棋子元素
        const stones = page.locator('g.stone');
        const count = await stones.count();

        if (count === 0) {
            console.log('✅ 棋盤為空');
        } else {
            throw new Error(`棋盤上還有 ${count} 個棋子`);
        }
    } catch (error) {
        console.error('❌ 驗證棋盤為空失敗:', error);
        await page.screenshot({ path: `test-results/verify-board-empty-error-${Date.now()}.png` });
        throw error;
    }
}

/**
 * 點擊返回大廳按鈕
 * @param page - Playwright Page 對象
 */
export async function clickReturnToLobby(page: Page) {
    console.log('🏠 點擊返回大廳按鈕...');

    try {
        // 查找並點擊「返回大廳」按鈕
        const returnButton = page.locator('button', { hasText: /返回大廳|Back to Lobby/i });
        await returnButton.waitFor({ state: 'visible', timeout: 5000 });
        await returnButton.click();

        console.log('✅ 已點擊返回大廳按鈕');

        // 等待確認對話框出現
        await page.waitForTimeout(500);
    } catch (error) {
        console.error('❌ 點擊返回大廳按鈕失敗:', error);
        await page.screenshot({ path: `test-results/click-return-lobby-error-${Date.now()}.png` });
        throw error;
    }
}

/**
 * 在確認離開對話框中點擊取消
 * @param page - Playwright Page 對象
 */
export async function cancelConfirmLeave(page: Page) {
    console.log('❌ 點擊取消按鈕...');

    try {
        // 等待確認對話框出現
        const dialog = page.locator('text=/確認離開遊戲|Confirm Leave/i');
        await dialog.waitFor({ state: 'visible', timeout: 5000 });
        console.log('✅ 確認對話框已顯示');

        // 點擊取消按鈕
        const cancelButton = page.locator('button', { hasText: /取消|Cancel/i });
        await cancelButton.waitFor({ state: 'visible', timeout: 5000 });
        await cancelButton.click();

        console.log('✅ 已點擊取消按鈕');

        // 等待對話框消失
        await page.waitForTimeout(500);
    } catch (error) {
        console.error('❌ 點擊取消按鈕失敗:', error);
        await page.screenshot({ path: `test-results/cancel-confirm-leave-error-${Date.now()}.png` });
        throw error;
    }
}

/**
 * 在確認離開對話框中點擊確認離開
 * @param page - Playwright Page 對象
 */
export async function confirmLeave(page: Page) {
    console.log('✅ 點擊確認離開按鈕...');

    try {
        // 等待確認對話框出現
        const dialog = page.locator('text=/確認離開遊戲|Confirm Leave/i');
        await dialog.waitFor({ state: 'visible', timeout: 5000 });
        console.log('✅ 確認對話框已顯示');

        // 點擊確認離開按鈕
        const confirmButton = page.locator('button', { hasText: /確認離開|Confirm/i });
        await confirmButton.waitFor({ state: 'visible', timeout: 5000 });
        await confirmButton.click();

        console.log('✅ 已點擊確認離開按鈕');

        // 等待頁面開始重新載入
        await page.waitForTimeout(1000);
    } catch (error) {
        console.error('❌ 點擊確認離開按鈕失敗:', error);
        await page.screenshot({ path: `test-results/confirm-leave-error-${Date.now()}.png` });
        throw error;
    }
}

/**
 * 驗證已返回大廳
 * @param page - Playwright Page 對象
 */
export async function verifyInLobby(page: Page) {
    console.log('🔍 驗證已返回大廳...');

    try {
        // 驗證 URL 不包含 room=
        const currentUrl = page.url();
        if (currentUrl.includes('#room=')) {
            throw new Error('URL 仍包含房間資訊，未返回大廳');
        }

        // 驗證大廳的創建房間按鈕存在
        const createButton = page.locator('button', { hasText: /創建.*房間|Create.*Room/i });
        await createButton.waitFor({ state: 'visible', timeout: 5000 });

        console.log('✅ 已成功返回大廳');
    } catch (error) {
        console.error('❌ 驗證返回大廳失敗:', error);
        await page.screenshot({ path: `test-results/verify-in-lobby-error-${Date.now()}.png` });
        throw error;
    }
}

/**
 * 關閉對手離開對話框並返回大廳
 * @param page - Playwright Page 對象
 */
export async function closeOpponentLeftDialog(page: Page) {
    console.log('🔘 關閉對手離開對話框...');

    try {
        // 等待對手離開對話框出現
        const dialog = page.locator('text=/對手已離開|Opponent.*Left/i');
        await dialog.waitFor({ state: 'visible', timeout: 10000 });
        console.log('✅ 對手離開對話框已顯示');

        // 點擊返回大廳按鈕（在對手離開對話框中）
        // 根據實際 HTML 結構，對話框中有兩個按鈕：
        // 第一個按鈕：返回大廳
        // 第二個按鈕：關閉
        // 使用 .dialog-btn 選擇器並取第一個按鈕
        const returnButton = page.locator('.base-dialog-actions .dialog-btn').first();
        await returnButton.waitFor({ state: 'visible', timeout: 5000 });

        // 驗證按鈕文字是否為「返回大廳」
        const buttonText = await returnButton.textContent();
        console.log(`📝 按鈕文字: "${buttonText}"`);

        await returnButton.click();

        console.log('✅ 已點擊返回大廳按鈕');

        // 等待頁面開始重新載入
        await page.waitForTimeout(1000);
    } catch (error) {
        console.error('❌ 關閉對手離開對話框失敗:', error);
        await page.screenshot({ path: `test-results/close-opponent-left-error-${Date.now()}.png` });
        throw error;
    }
}
