import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDialogs } from '../useDialogs';

describe('useDialogs', () => {
    describe('初始化', () => {
        it('應該有正確的初始狀態', () => {
            const { result } = renderHook(() => useDialogs());

            expect(result.current.undoRequest).toBeNull();
            expect(result.current.resetRequest).toBeNull();
            expect(result.current.messageDialog).toBeNull();
            expect(result.current.showOpponentLeftDialog).toBe(false);
            expect(result.current.showConfirm).toBe(false);
        });
    });

    describe('悔棋請求對話框', () => {
        it('應該能設置悔棋請求', () => {
            const { result } = renderHook(() => useDialogs());

            const undoRequest = { from: 'black' as const };

            act(() => {
                result.current.setUndoRequest(undoRequest);
            });

            expect(result.current.undoRequest).toEqual(undoRequest);
        });

        it('應該能清除悔棋請求', () => {
            const { result } = renderHook(() => useDialogs());

            act(() => {
                result.current.setUndoRequest({ from: 'black' });
            });

            act(() => {
                result.current.setUndoRequest(null);
            });

            expect(result.current.undoRequest).toBeNull();
        });
    });

    describe('重置請求對話框', () => {
        it('應該能設置重置請求', () => {
            const { result } = renderHook(() => useDialogs());

            const resetRequest = { from: 'white' as const };

            act(() => {
                result.current.setResetRequest(resetRequest);
            });

            expect(result.current.resetRequest).toEqual(resetRequest);
        });

        it('應該能清除重置請求', () => {
            const { result } = renderHook(() => useDialogs());

            act(() => {
                result.current.setResetRequest({ from: 'white' });
            });

            act(() => {
                result.current.setResetRequest(null);
            });

            expect(result.current.resetRequest).toBeNull();
        });
    });

    describe('訊息對話框', () => {
        it('應該能顯示成功訊息', () => {
            const { result } = renderHook(() => useDialogs());

            act(() => {
                result.current.showSuccess('Success', 'Operation completed');
            });

            expect(result.current.messageDialog).toEqual({
                title: 'Success',
                message: 'Operation completed',
                icon: 'success',
            });
        });

        it('應該能顯示錯誤訊息', () => {
            const { result } = renderHook(() => useDialogs());

            act(() => {
                result.current.showError('Error', 'Something went wrong');
            });

            expect(result.current.messageDialog).toEqual({
                title: 'Error',
                message: 'Something went wrong',
                icon: 'error',
            });
        });

        it('應該能顯示資訊訊息', () => {
            const { result } = renderHook(() => useDialogs());

            act(() => {
                result.current.showInfo('Info', 'Please note');
            });

            expect(result.current.messageDialog).toEqual({
                title: 'Info',
                message: 'Please note',
                icon: 'info',
            });
        });

        it('應該能關閉訊息對話框', () => {
            const { result } = renderHook(() => useDialogs());

            act(() => {
                result.current.showSuccess('Success', 'Test');
            });

            act(() => {
                result.current.closeMessageDialog();
            });

            expect(result.current.messageDialog).toBeNull();
        });

        it('應該能直接設置訊息對話框', () => {
            const { result } = renderHook(() => useDialogs());

            const dialog = {
                title: 'Custom',
                message: 'Custom message',
                icon: 'info' as const,
            };

            act(() => {
                result.current.setMessageDialog(dialog);
            });

            expect(result.current.messageDialog).toEqual(dialog);
        });
    });

    describe('對手離開對話框', () => {
        it('應該能顯示對手離開對話框', () => {
            const { result } = renderHook(() => useDialogs());

            act(() => {
                result.current.setShowOpponentLeftDialog(true);
            });

            expect(result.current.showOpponentLeftDialog).toBe(true);
        });

        it('應該能隱藏對手離開對話框', () => {
            const { result } = renderHook(() => useDialogs());

            act(() => {
                result.current.setShowOpponentLeftDialog(true);
            });

            act(() => {
                result.current.setShowOpponentLeftDialog(false);
            });

            expect(result.current.showOpponentLeftDialog).toBe(false);
        });
    });

    describe('確認對話框', () => {
        it('應該能顯示確認對話框', () => {
            const { result } = renderHook(() => useDialogs());

            act(() => {
                result.current.setShowConfirm(true);
            });

            expect(result.current.showConfirm).toBe(true);
        });

        it('應該能隱藏確認對話框', () => {
            const { result } = renderHook(() => useDialogs());

            act(() => {
                result.current.setShowConfirm(true);
            });

            act(() => {
                result.current.setShowConfirm(false);
            });

            expect(result.current.showConfirm).toBe(false);
        });
    });

    describe('關閉所有對話框', () => {
        it('應該能一次關閉所有對話框', () => {
            const { result } = renderHook(() => useDialogs());

            // 打開所有對話框
            act(() => {
                result.current.setUndoRequest({ from: 'black' });
                result.current.setResetRequest({ from: 'white' });
                result.current.showSuccess('Success', 'Test');
                result.current.setShowOpponentLeftDialog(true);
                result.current.setShowConfirm(true);
            });

            // 驗證都已打開
            expect(result.current.undoRequest).not.toBeNull();
            expect(result.current.resetRequest).not.toBeNull();
            expect(result.current.messageDialog).not.toBeNull();
            expect(result.current.showOpponentLeftDialog).toBe(true);
            expect(result.current.showConfirm).toBe(true);

            // 關閉所有
            act(() => {
                result.current.closeAllDialogs();
            });

            // 驗證都已關閉
            expect(result.current.undoRequest).toBeNull();
            expect(result.current.resetRequest).toBeNull();
            expect(result.current.messageDialog).toBeNull();
            expect(result.current.showOpponentLeftDialog).toBe(false);
            expect(result.current.showConfirm).toBe(false);
        });
    });
});
