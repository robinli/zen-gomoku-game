# 專案清理計劃

**檢查日期**: 2026-01-18
**目的**: 移除過期文件，保持專案整潔

## 🗑️ 第一階段：刪除臨時文件

```bash
# 刪除臨時日誌文件
rm client_log.txt

# 刪除過時的測試頁面
rm scripts/test-socket.html

# 刪除過時的進度追蹤文件
rm docs/undo-client-progress.md
```

## 📦 第二階段：歸檔歷史文件

```bash
# 創建歷史文檔目錄
mkdir -p docs/archive

# 移動已完成的遷移報告
mv docs/development/MIGRATION-REPORT.md docs/archive/

# 移動 Socket 調試報告
mv docs/development/SOCKET-DEBUG.md docs/archive/
```

## 🔧 第三階段：整合零散文檔

```bash
# 創建統一的悔棋功能文檔目錄
mkdir -p docs/archive/undo-feature-development

# 移動所有悔棋相關的實作記錄
mv docs/undo-*.md docs/archive/undo-feature-development/
```

## 🧹 第四階段：更新 .gitignore

在 `.gitignore` 中添加：
```
# 日誌文件
*.log
*_log.txt
client_log.txt

# 臨時文件
.cleanup-plan.md
```

## 📝 第五階段：更新文檔

1. 更新 `scripts/README.md`
   - 移除 PowerShell 腳本的說明（如果決定刪除）
   - 只保留 Node.js 版本的說明

2. 創建 `docs/UNDO_FEATURE.md`
   - 整合所有悔棋功能的文檔
   - 包含完整的功能說明和使用方式

## ⚖️ 可選：刪除 PowerShell 腳本

如果團隊主要使用跨平台的 Node.js 腳本：
```bash
rm scripts/auto-merge.ps1
```

**優點**:
- 減少維護負擔
- 統一使用 Node.js 腳本
- 更好的跨平台支援

**缺點**:
- Windows 用戶可能更熟悉 PowerShell

## ✅ 執行檢查清單

- [ ] 備份重要文件（如果需要）
- [ ] 執行第一階段清理
- [ ] 執行第二階段歸檔
- [ ] 執行第三階段整合
- [ ] 更新 .gitignore
- [ ] 更新相關文檔
- [ ] 提交更改到 Git
- [ ] 驗證專案仍能正常運作

## 📊 預期結果

- 移除 6-7 個過期文件
- 整理 7 個零散文檔
- 專案結構更清晰
- 減少約 50KB 的過期文檔

---

**注意**: 執行前請先確認沒有其他開發者正在使用這些文件！
