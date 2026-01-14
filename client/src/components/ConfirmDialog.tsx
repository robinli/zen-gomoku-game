import React from 'react';
import { useTranslation } from 'react-i18next';
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
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
}) => {
    const { t } = useTranslation();
    const finalConfirmText = confirmText || t('dialog.confirm');
    const finalCancelText = cancelText || t('dialog.cancel');

    return (
        <BaseDialog
            title={title}
            icon="warning"
            onOverlayClick={onCancel}
            actions={
                <>
                    <DialogButton onClick={onCancel}>
                        {finalCancelText}
                    </DialogButton>
                    <DialogButton onClick={onConfirm}>
                        {finalConfirmText}
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
