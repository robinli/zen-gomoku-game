import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface ReplayControlsProps {
    currentStep: number;
    totalSteps: number;
    isAutoPlaying: boolean;
    onPrevious: () => void;
    onNext: () => void;
    onToggleAutoPlay: () => void;
    onRestart: () => void;
    onExit: () => void;
    onFastForward: () => void;
}

const ReplayControls: React.FC<ReplayControlsProps> = ({
    currentStep,
    totalSteps,
    isAutoPlaying,
    onPrevious,
    onNext,
    onToggleAutoPlay,
    onRestart,
    onExit,
    onFastForward,
}) => {
    const { t } = useTranslation();
    const canGoPrevious = currentStep > 0;
    const canGoNext = currentStep < totalSteps - 1;

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 animate-in slide-in-from-bottom duration-500">
            {/* 標題 */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-slate-700">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                    </svg>
                    <h3 className="text-lg font-bold text-slate-900">{t('replay.title')}</h3>
                </div>
                <button
                    onClick={onExit}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    title={t('app.close')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* 進度條 */}
            <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-500 mb-2">
                    <span>{t('replay.step_progress', { current: currentStep + 1, total: totalSteps }).split('/')[0].trim()}</span>
                    <span>{t('replay.step_progress', { current: currentStep + 1, total: totalSteps }).split('/')[1]?.trim()}</span>
                </div>
                <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-slate-600 to-slate-800 transition-all duration-300 rounded-full"
                        style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                    />
                </div>
            </div>

            {/* 控制按鈕 */}
            <div className="flex items-center justify-center gap-2">
                {/* 重新開始 */}
                <button
                    onClick={onRestart}
                    disabled={currentStep === 0}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title={t('replay.restart')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-700">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                    </svg>
                </button>

                {/* 上一步 */}
                <button
                    onClick={onPrevious}
                    disabled={!canGoPrevious}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title={t('replay.prev')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-700">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                </button>

                {/* 播放/暫停 */}
                <button
                    onClick={onToggleAutoPlay}
                    className="p-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-lg hover:shadow-xl"
                    title={isAutoPlaying ? t('replay.pause') : t('replay.play')}
                >
                    {isAutoPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                        </svg>
                    )}
                </button>

                {/* 下一步 */}
                <button
                    onClick={onNext}
                    disabled={!canGoNext}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title={t('replay.next')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-700">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                </button>

                {/* 快進到最後 */}
                <button
                    onClick={onFastForward}
                    disabled={currentStep === totalSteps - 1}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title={t('replay.end')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-700">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.689c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 0 1 0 1.953l-7.108 4.062A1.125 1.125 0 0 1 3 16.811V8.69ZM12.75 8.689c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 0 1 0 1.953l-7.108 4.062a1.125 1.125 0 0 1-1.683-.977V8.69Z" />
                    </svg>
                </button>
            </div>

            {/* 提示文字 */}
            <div className="mt-4 text-center">
                <p className="text-xs text-slate-400">
                    {isAutoPlaying ? t('replay.playing') : t('replay.controls_hint')}
                </p>
            </div>
        </div>
    );
};

export default ReplayControls;
