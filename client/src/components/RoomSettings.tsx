import React from 'react';
import './RoomSettings.css';

export interface GameSettings {
    undoLimit: number | null;  // null = 無限制, 0 = 不允許, 1-N = 次數
}

interface RoomSettingsProps {
    settings: GameSettings;
    onChange: (settings: GameSettings) => void;
}

const RoomSettings: React.FC<RoomSettingsProps> = ({ settings, onChange }) => {
    const undoOptions = [
        { value: 0, label: '不允許（競技模式）', icon: '🚫' },
        { value: 1, label: '1 次', icon: '1️⃣' },
        { value: 3, label: '3 次（推薦）', icon: '3️⃣' },
        { value: 5, label: '5 次', icon: '5️⃣' },
        { value: null, label: '無限制（練習模式）', icon: '♾️' },
    ];

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value === 'unlimited' ? null : parseInt(e.target.value);
        onChange({ ...settings, undoLimit: value });
    };

    return (
        <div className="room-settings">
            <h3 className="settings-title">⚙️ 遊戲設定</h3>

            <div className="setting-group">
                <label className="setting-label" htmlFor="undo-select">悔棋規則</label>
                <p className="setting-description">每方可悔棋次數（需對方同意）</p>

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
                            {option.icon} {option.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default RoomSettings;
