#!/usr/bin/env node

/**
 * 系統監控腳本
 * 用於即時查看靜弈伺服器狀態
 * 
 * 使用方式：
 *   本地環境：node monitor.js
 *   生產環境：node monitor.js https://zen-gomoku-server.onrender.com
 */

const https = require('https');
const http = require('http');

const SERVER_URL = process.argv[2] || 'http://localhost:3000';
const REFRESH_INTERVAL = 5000; // 5 秒刷新一次

console.clear();
console.log('🎮 靜弈五子棋 - 系統監控儀表板');
console.log('='.repeat(60));
console.log(`📡 監控伺服器：${SERVER_URL}`);
console.log(`🔄 刷新間隔：${REFRESH_INTERVAL / 1000} 秒`);
console.log('='.repeat(60));
console.log('\n按 Ctrl+C 停止監控\n');

function fetchMetrics() {
    const url = `${SERVER_URL}/metrics`;
    const client = url.startsWith('https') ? https : http;

    client.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const metrics = JSON.parse(data);
                displayMetrics(metrics);
            } catch (error) {
                console.error('❌ 無法解析回應:', error.message);
            }
        });
    }).on('error', (error) => {
        console.error('❌ 連線失敗:', error.message);
        console.log('💡 提示：請確認伺服器是否正在運行');
    });
}

function displayMetrics(metrics) {
    console.clear();
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│         🎮 靜弈五子棋 - 系統監控儀表板                 │');
    console.log('└─────────────────────────────────────────────────────────┘');
    console.log();

    // 狀態指示器
    const statusIcon = metrics.status === 'ok' ? '🟢' : '🔴';
    console.log(`${statusIcon} 系統狀態：${metrics.status.toUpperCase()}`);
    console.log(`🕐 更新時間：${new Date(metrics.timestamp).toLocaleString('zh-TW')}`);
    console.log(`⏱️  運行時間：${metrics.uptime.formatted}`);
    console.log();

    // 房間資訊
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│                      📊 房間統計                        │');
    console.log('└─────────────────────────────────────────────────────────┘');
    console.log(`  活躍房間：${metrics.rooms.active} 個`);
    console.log(`  理論上限：${metrics.rooms.maxEstimated} 個`);
    console.log(`  使用率  ：${((metrics.rooms.active / metrics.rooms.maxEstimated) * 100).toFixed(2)}%`);
    console.log();

    // 連線資訊
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│                     👥 玩家連線                         │');
    console.log('└─────────────────────────────────────────────────────────┘');
    console.log(`  線上玩家：${metrics.connections.active} 人`);
    console.log(`  理論上限：${metrics.rooms.active * 2} 人 (每房間 2 人)`);
    console.log();

    // 記憶體資訊
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│                     💾 記憶體使用                       │');
    console.log('└─────────────────────────────────────────────────────────┘');
    console.log(`  堆積總量：${metrics.memory.heapTotal}`);
    console.log(`  堆積使用：${metrics.memory.heapUsed}`);
    console.log(`  使用率  ：${metrics.memory.heapUsagePercent}`);
    console.log(`  RSS     ：${metrics.memory.rss}`);
    console.log(`  外部綁定：${metrics.memory.external}`);
    console.log();

    // 健康度評估
    const heapUsagePercent = parseFloat(metrics.memory.heapUsagePercent);
    let healthStatus = '';
    let healthIcon = '';

    if (heapUsagePercent < 50) {
        healthStatus = '健康';
        healthIcon = '🟢';
    } else if (heapUsagePercent < 75) {
        healthStatus = '正常';
        healthIcon = '🟡';
    } else if (heapUsagePercent < 90) {
        healthStatus = '警告';
        healthIcon = '🟠';
    } else {
        healthStatus = '危險';
        healthIcon = '🔴';
    }

    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│                     ❤️  系統健康度                      │');
    console.log('└─────────────────────────────────────────────────────────┘');
    console.log(`  ${healthIcon} ${healthStatus} (記憶體使用率: ${metrics.memory.heapUsagePercent})`);
    console.log();

    // 環境資訊
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│                     ⚙️  環境資訊                        │');
    console.log('└─────────────────────────────────────────────────────────┘');
    console.log(`  Node.js  ：${metrics.environment.nodeVersion}`);
    console.log(`  平台     ：${metrics.environment.platform} (${metrics.environment.arch})`);
    console.log();

    console.log('─'.repeat(60));
    console.log(`下次刷新：${new Date(Date.now() + REFRESH_INTERVAL).toLocaleTimeString('zh-TW')}`);
    console.log('按 Ctrl+C 停止監控');
}

// 初始化：立即獲取一次
fetchMetrics();

// 定期刷新
setInterval(fetchMetrics, REFRESH_INTERVAL);

// 優雅退出
process.on('SIGINT', () => {
    console.log('\n\n👋 監控已停止');
    process.exit(0);
});
