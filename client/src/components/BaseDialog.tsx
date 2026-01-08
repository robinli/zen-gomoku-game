import React from 'react';
import './BaseDialog.css';

export type DialogIcon = 'question' | 'error' | 'success' | 'warning' | 'info';

interface BaseDialogProps {
    title: string;
    icon?: DialogIcon;
    children: React.ReactNode;
    actions: React.ReactNode;
    onOverlayClick?: () => void;
}

const BaseDialog: React.FC<BaseDialogProps> = ({
    title,
    icon,
    children,
    actions,
    onOverlayClick,
}) => {
    const renderIcon = () => {
        if (!icon) return null;

        const iconProps = {
            xmlns: "http://www.w3.org/2000/svg",
            fill: "none",
            viewBox: "0 0 24 24",
            strokeWidth: 2,
            stroke: "currentColor",
            className: `base-dialog-icon base-dialog-icon-${icon}`,
        };

        switch (icon) {
            case 'question':
                return (
                    <svg {...iconProps}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                    </svg>
                );
            case 'error':
                return (
                    <svg {...iconProps}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                );
            case 'success':
                return (
                    <svg {...iconProps}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg {...iconProps}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                );
            case 'info':
                return (
                    <svg {...iconProps}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <div
            className="base-dialog-overlay"
            onClick={onOverlayClick}
        >
            <div
                className="base-dialog"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="base-dialog-header">
                    {renderIcon()}
                    <h3 className="base-dialog-title">{title}</h3>
                </div>

                <div className="base-dialog-content">
                    {children}
                </div>

                <div className="base-dialog-actions">
                    {actions}
                </div>
            </div>
        </div>
    );
};

export default BaseDialog;
