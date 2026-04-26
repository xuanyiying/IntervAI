import React from 'react';
import './Switch.css';

interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked = false,
  onChange,
  disabled = false,
  label,
  className = '',
}) => {
  return (
    <label className={`glass-switch-wrapper ${disabled ? 'glass-switch-disabled' : ''} ${className}`}>
      <div
        className={`glass-switch ${checked ? 'glass-switch-checked' : ''}`}
        onClick={() => !disabled && onChange?.(!checked)}
      >
        <div className="glass-switch-handle" />
      </div>
      {label && <span className="glass-switch-label">{label}</span>}
    </label>
  );
};

export default Switch;