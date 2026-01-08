import React from 'react';
import BaseDialog, { DialogIcon } from './BaseDialog';
import DialogButton from './DialogButton';

interface MessageDialogProps {
    title: string;
    message: string;
    icon?: DialogIcon;
    onClose: () => void;
}

const MessageDialog: React.FC<MessageDialogProps> = ({
    title,
    message,
    icon = 'info',
    onClose,
}) => {
    return (
        <BaseDialog
            title={title}
            icon={icon}
            onOverlayClick={onClose}
            actions={
                <DialogButton onClick={onClose}>
                    確定
                </DialogButton>
            }
        >
            <p style={{
                margin: 0,
                fontSize: '1.125rem',
                color: '#334155',
                textAlign: 'center',
                lineHeight: 1.6
            }}>
                {message}
            </p>
        </BaseDialog>
    );
};

export default MessageDialog;
