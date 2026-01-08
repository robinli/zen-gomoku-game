import React from 'react';
import './DialogButton.css';

interface DialogButtonProps {
    onClick: () => void;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary';
    icon?: React.ReactNode;
}

const DialogButton: React.FC<DialogButtonProps> = ({
    onClick,
    children,
    variant = 'primary',
    icon,
}) => {
    return (
        <button
            onClick={onClick}
            className={`dialog-btn dialog-btn-${variant}`}
        >
            {icon && <span className="dialog-btn-icon">{icon}</span>}
            <span>{children}</span>
        </button>
    );
};

export default DialogButton;
