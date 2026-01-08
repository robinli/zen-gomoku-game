import React from 'react';
import BaseDialog from './BaseDialog';
import DialogButton from './DialogButton';

interface ConfirmDialogProps {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    title,
    message,
    confirmText = '確認',
    cancelText = '取消',
    onConfirm,
    onCancel,
}) => {
    return (
        <BaseDialog
            title={title}
            icon="warning"
            onOverlayClick={onCancel}
            actions={
                <>
                    <DialogButton onClick={onCancel}>
                        {cancelText}
                    </DialogButton>
                    <DialogButton onClick={onConfirm}>
                        {confirmText}
                    </DialogButton>
                </>
            }
        >
            <p style={{
                margin: 0,
                fontSize: '1rem',
                color: '#334155',
                textAlign: 'center',
                lineHeight: 1.6
            }}>
                {message}
            </p>
        </BaseDialog>
    );
};

export default ConfirmDialog;
