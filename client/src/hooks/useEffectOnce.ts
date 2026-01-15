import { useEffect, useRef } from 'react';

/**
 * useEffectOnce Hook
 * 
 * 確保 effect 只執行一次，即使在 React Strict Mode 下也是如此
 * 這是一個更優雅的解決方案，不需要使用 hasInitialized ref workaround
 * 
 * @param effect - 要執行的 effect 函數
 * @param cleanup - 可選的清理函數
 */
export function useEffectOnce(effect: () => void | (() => void)): void {
    const hasRun = useRef(false);
    const cleanupRef = useRef<(() => void) | void>();

    useEffect(() => {
        // 如果已經執行過，直接返回
        if (hasRun.current) {
            return;
        }

        // 標記為已執行
        hasRun.current = true;

        // 執行 effect
        cleanupRef.current = effect();

        // 返回清理函數
        return () => {
            if (cleanupRef.current) {
                cleanupRef.current();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // 空依賴數組，只在 mount 時執行
}

/**
 * useMount Hook
 * 
 * 在組件掛載時執行一次，類似於 componentDidMount
 * 
 * @param callback - 掛載時執行的回調函數
 */
export function useMount(callback: () => void): void {
    useEffectOnce(callback);
}

/**
 * useUnmount Hook
 * 
 * 在組件卸載時執行，類似於 componentWillUnmount
 * 
 * @param callback - 卸載時執行的回調函數
 */
export function useUnmount(callback: () => void): void {
    const callbackRef = useRef(callback);

    // 保持 callback 引用最新
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        return () => {
            callbackRef.current();
        };
    }, []);
}
