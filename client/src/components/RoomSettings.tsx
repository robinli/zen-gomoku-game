import React from 'react';
import { useTranslation } from 'react-i18next';
import './RoomSettings.css';

export interface GameSettings {
    undoLimit: number | null;  // null = 無限制, 0 = 不允許, 1-N = 次數
}

interface RoomSettingsProps {
    settings: GameSettings;
    onChange: (settings: GameSettings) => void;
}

const RoomSettings: React.FC<RoomSettingsProps> = ({ settings, onChange }) => {
    const { t } = useTranslation();
    const undoOptions = [
        { value: 0, label: t('lobby.undo_options.not_allowed') },
        { value: 1, label: t('lobby.undo_options.times', { count: 1 }) },
        { value: 3, label: t('lobby.undo_options.times_recommended', { count: 3 }) },
        { value: 5, label: t('lobby.undo_options.times', { count: 5 }) },
        { value: null, label: t('lobby.undo_options.unlimited') },
    ];

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value === 'unlimited' ? null : parseInt(e.target.value);
        onChange({ ...settings, undoLimit: value });
    };

    return (
        <div className="room-settings">
            <h3 className="settings-title">{t('app.game_settings').split(':')[0]}</h3>

            <div className="setting-group">
                <label className="setting-label" htmlFor="undo-select">{t('lobby.undo_rules')}</label>
                <p className="setting-description">{t('lobby.undo_limit_desc')}</p>

                <select
                    id="undo-select"
                    className="undo-select"
                    value={settings.undoLimit === null ? 'unlimited' : settings.undoLimit}
                    onChange={handleChange}
                >
                    {undoOptions.map((option) => (
                        <option
                            key={option.value ?? 'unlimited'}
                            value={option.value ?? 'unlimited'}
                        >
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default RoomSettings;
