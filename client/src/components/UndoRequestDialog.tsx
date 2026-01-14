import React from 'react';
import { useTranslation } from 'react-i18next';
import { Player } from '../types';
import BaseDialog from './BaseDialog';
import DialogButton from './DialogButton';

interface UndoRequestDialogProps {
    requestedBy: Player;
    onAccept: () => void;
    onReject: () => void;
}

const UndoRequestDialog: React.FC<UndoRequestDialogProps> = ({
    requestedBy,
    onAccept,
    onReject,
}) => {
    const { t } = useTranslation();
    const playerName = requestedBy === 'black' ? t('app.black') : t('app.white');
    const playerIcon = requestedBy === 'black' ? '⚫' : '⚪';

    return (
        <BaseDialog
            title={t('dialog.undo_request_title')}
            icon="question"
            actions={
                <>
                    <DialogButton
                        onClick={onReject}
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        }
                    >
                        {t('dialog.reject')}
                    </DialogButton>
                    <DialogButton
                        onClick={onAccept}
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                        }
                    >
                        {t('dialog.agree')}
                    </DialogButton>
                </>
            }
        >
            <p style={{
                margin: '0 0 0.75rem 0',
                fontSize: '1rem',
                color: '#334155',
                textAlign: 'center'
            }}>
                {playerIcon} <strong style={{ color: '#1e293b', fontWeight: 600 }}>{t('dialog.undo_request_content', { player: playerName })}</strong>
            </p>
            <p style={{
                margin: 0,
                fontSize: '1rem',
                color: '#64748b',
                textAlign: 'center'
            }}>
                {t('dialog.undo_request_sub')}
            </p>
        </BaseDialog>
    );
};

export default UndoRequestDialog;
