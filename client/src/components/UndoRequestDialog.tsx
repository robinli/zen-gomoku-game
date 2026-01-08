import React from 'react';
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
    const playerName = requestedBy === 'black' ? '黑方' : '白方';
    const playerIcon = requestedBy === 'black' ? '⚫' : '⚪';

    return (
        <BaseDialog
            title="悔棋請求"
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
                        拒絕
                    </DialogButton>
                    <DialogButton
                        onClick={onAccept}
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                        }
                    >
                        同意
                    </DialogButton>
                </>
            }
        >
            <p style={{
                margin: '0 0 0.75rem 0',
                fontSize: '1.125rem',
                color: '#334155',
                textAlign: 'center'
            }}>
                {playerIcon} <strong style={{ color: '#1e293b', fontWeight: 600 }}>{playerName}</strong> 請求悔棋
            </p>
            <p style={{
                margin: 0,
                fontSize: '0.95rem',
                color: '#64748b',
                textAlign: 'center'
            }}>
                是否同意撤銷最後一步？
            </p>
        </BaseDialog>
    );
};

export default UndoRequestDialog;
