#!/usr/bin/env node

/**
 * 自動化測試並合併 dev 分支到 main 分支
 * 
 * 此腳本會:
 * 1. 啟動 server 和 client
 * 2. 執行所有 E2E 測試
 * 3. 如果測試通過,將 dev 分支合併到 main
 * 4. 推送到 GitHub
 * 
 * 使用方式: node scripts/auto-merge.js
 */

import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// ANSI 顏色碼
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
};

// 輸出函數
function log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(message) {
    console.log('');
    log('========================================', 'cyan');
    log(message, 'cyan');
    log('========================================', 'cyan');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'white');
}

// 執行命令並返回輸出
function exec(command, options = {}) {
    try {
        return execSync(command, {
            cwd: rootDir,
            encoding: 'utf-8',
            stdio: options.silent ? 'pipe' : 'inherit',
            ...options,
        });
    } catch (error) {
        if (!options.ignoreError) {
            throw error;
        }
        return null;
    }
}

// 檢查服務是否就緒
function checkServiceReady(url, maxRetries = 30, interval = 1000) {
    return new Promise((resolve, reject) => {
        let retries = 0;

        const check = () => {
            http.get(url, (res) => {
                if (res.statusCode === 200) {
                    resolve(true);
                } else {
                    retry();
                }
            }).on('error', () => {
                retry();
            });
        };

        const retry = () => {
            retries++;
            if (retries >= maxRetries) {
                reject(new Error(`服務未在 ${maxRetries} 秒內就緒: ${url}`));
            } else {
                setTimeout(check, interval);
            }
        };

        check();
    });
}

// 進程管理
let serverProcess = null;
let clientProcess = null;

function stopServices() {
    log('\n🛑 正在停止服務...', 'yellow');

    if (serverProcess) {
        serverProcess.kill();
        log('✓ Server 已停止', 'gray');
    }

    if (clientProcess) {
        clientProcess.kill();
        log('✓ Client 已停止', 'gray');
    }

    // Windows 額外清理
    if (process.platform === 'win32') {
        try {
            exec('taskkill /F /IM node.exe /FI "WINDOWTITLE eq server*"', {
                ignoreError: true,
                silent: true
            });
            exec('taskkill /F /IM node.exe /FI "WINDOWTITLE eq client*"', {
                ignoreError: true,
                silent: true
            });
        } catch (e) {
            // 忽略錯誤
        }
    }
}

// 註冊清理處理器
process.on('exit', stopServices);
process.on('SIGINT', () => {
    stopServices();
    process.exit(1);
});
process.on('SIGTERM', () => {
    stopServices();
    process.exit(1);
});
process.on('uncaughtException', (error) => {
    logError(`未捕獲的異常: ${error.message}`);
    stopServices();
    process.exit(1);
});

// 主流程
async function main() {
    log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║        🚀 自動化測試與合併流程                           ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`, 'magenta');

    try {
        // ============================================
        // 步驟 1: 檢查當前分支
        // ============================================
        logStep('📋 步驟 1: 檢查當前分支');

        const currentBranch = exec('git branch --show-current', { silent: true }).trim();
        logInfo(`當前分支: ${currentBranch}`);

        if (currentBranch !== 'dev') {
            logWarning('當前不在 dev 分支');
            logError('請先切換到 dev 分支: git checkout dev');
            process.exit(1);
        }

        // 檢查是否有未提交的更改
        const status = exec('git status --porcelain', { silent: true });
        if (status.trim()) {
            logWarning('有未提交的更改:');
            console.log(status);
            logError('請先提交或暫存更改');
            process.exit(1);
        }

        logSuccess('分支檢查通過');

        // ============================================
        // 步驟 2: 停止現有服務
        // ============================================
        logStep('🛑 步驟 2: 停止現有服務');

        logInfo('檢查並停止正在運行的 server 和 client...');

        // Windows 平台停止服務
        if (process.platform === 'win32') {
            try {
                // 停止佔用 3000 端口的進程 (server)
                exec('for /f "tokens=5" %a in (\'netstat -aon ^| findstr :3000\') do taskkill /F /PID %a', {
                    ignoreError: true,
                    silent: true,
                    shell: 'cmd.exe'
                });

                // 停止佔用 5173 端口的進程 (client)
                exec('for /f "tokens=5" %a in (\'netstat -aon ^| findstr :5173\') do taskkill /F /PID %a', {
                    ignoreError: true,
                    silent: true,
                    shell: 'cmd.exe'
                });

                logSuccess('已停止現有服務');
            } catch (error) {
                logInfo('沒有發現運行中的服務');
            }
        } else {
            // Unix-like 平台
            try {
                exec('lsof -ti:3000 | xargs kill -9', { ignoreError: true, silent: true });
                exec('lsof -ti:5173 | xargs kill -9', { ignoreError: true, silent: true });
                logSuccess('已停止現有服務');
            } catch (error) {
                logInfo('沒有發現運行中的服務');
            }
        }

        // 等待端口釋放
        await new Promise(resolve => setTimeout(resolve, 2000));

        // ============================================
        // 步驟 3: Build Server
        // ============================================
        logStep('🔨 步驟 3: Build Server');

        logInfo('正在編譯 TypeScript...');
        try {
            exec('npm run build', {
                cwd: join(rootDir, 'server'),
            });
            logSuccess('Server build 完成');
        } catch (error) {
            logError('Server build 失敗');
            process.exit(1);
        }

        // ============================================
        // 步驟 4: Build Client
        // ============================================
        logStep('🔨 步驟 4: Build Client');

        logInfo('正在編譯 TypeScript 和打包 Vite...');
        try {
            exec('npm run build', {
                cwd: join(rootDir, 'client'),
            });
            logSuccess('Client build 完成');
        } catch (error) {
            logError('Client build 失敗');
            process.exit(1);
        }

        // ============================================
        // 步驟 5: 啟動 Server
        // ============================================
        logStep('🖥️  步驟 5: 啟動 Server');

        logInfo('正在啟動 server (http://localhost:3000)...');

        serverProcess = spawn('npm', ['run', 'dev'], {
            cwd: join(rootDir, 'server'),
            stdio: 'pipe',
            shell: true,
        });

        serverProcess.stdout.on('data', (data) => {
            process.stdout.write(`[Server] ${data}`);
        });

        serverProcess.stderr.on('data', (data) => {
            process.stderr.write(`[Server] ${data}`);
        });

        // 等待 server 就緒
        await checkServiceReady('http://localhost:3000/health');
        logInfo('等待 Socket.IO 完全初始化...');
        await new Promise(resolve => setTimeout(resolve, 3000)); // 額外等待 3 秒
        logSuccess(`Server 已啟動 (PID: ${serverProcess.pid})`);

        // ============================================
        // 步驟 6: 啟動 Client
        // ============================================
        logStep('🌐 步驟 6: 啟動 Client');

        logInfo('正在啟動 client (http://localhost:5173)...');

        clientProcess = spawn('npm', ['run', 'dev'], {
            cwd: join(rootDir, 'client'),
            stdio: 'pipe',
            shell: true,
        });

        clientProcess.stdout.on('data', (data) => {
            process.stdout.write(`[Client] ${data}`);
        });

        clientProcess.stderr.on('data', (data) => {
            process.stderr.write(`[Client] ${data}`);
        });

        // 等待 client 就緒
        await checkServiceReady('http://localhost:5173');
        logInfo('等待 Vite 完成編譯和 HMR 準備...');
        await new Promise(resolve => setTimeout(resolve, 5000)); // 額外等待 5 秒
        logSuccess(`Client 已啟動 (PID: ${clientProcess.pid})`);

        // ============================================
        // 步驟 7: 執行 E2E 測試
        // ============================================
        logStep('🧪 步驟 7: 執行 E2E 測試');

        logInfo('正在執行所有 E2E 測試案例...');

        try {
            exec('npx playwright test', {
                cwd: join(rootDir, 'client'),
            });
            logSuccess('所有測試通過!');
        } catch (error) {
            logError('E2E 測試失敗,中止合併流程');
            logWarning('查看測試報告: npx playwright show-report');
            stopServices();
            process.exit(1);
        }

        // ============================================
        // 步驟 8: 停止服務
        // ============================================
        logStep('🛑 步驟 8: 停止服務');
        stopServices();
        logSuccess('所有服務已停止');

        // ============================================
        // 步驟 9: 合併分支
        // ============================================
        logStep('🔀 步驟 9: 合併 dev 到 main');

        logInfo('切換到 main 分支...');
        exec('git checkout main');

        logInfo('合併 dev 分支...');
        try {
            exec('git merge dev --no-ff -m "chore: auto-merge dev to main after E2E tests passed"');
            logSuccess('合併成功');
        } catch (error) {
            logError('合併失敗,可能有衝突需要手動解決');
            process.exit(1);
        }

        // ============================================
        // 步驟 10: 推送到 GitHub
        // ============================================
        logStep('📤 步驟 10: 推送到 GitHub');

        logInfo('推送 main 分支到 GitHub...');
        try {
            exec('git push origin main');
            logSuccess('推送成功');
        } catch (error) {
            logError('推送失敗');
            process.exit(1);
        }

        // 切回 dev 分支
        logInfo('切回 dev 分支...');
        exec('git checkout dev');

        // ============================================
        // 完成
        // ============================================
        log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║        ✅ 自動化流程完成!                                ║
║                                                          ║
║        所有測試通過,已成功合併並推送到 GitHub            ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`, 'green');

        log('📊 查看測試報告: npx playwright show-report', 'cyan');
        log('🌐 GitHub: https://github.com/your-username/zen-gomoku-game', 'cyan');

    } catch (error) {
        logError(`執行失敗: ${error.message}`);
        stopServices();
        process.exit(1);
    }
}

// 執行主流程
main();
