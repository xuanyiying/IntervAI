import React, { useState } from 'react';
import './Tabs.css';

interface TabItem {
  key: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  defaultActiveKey?: string;
  onChange?: (key: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  defaultActiveKey,
  onChange,
  className = '',
}) => {
  const [activeKey, setActiveKey] = useState(defaultActiveKey || items[0]?.key);

  const handleTabClick = (key: string) => {
    setActiveKey(key);
    onChange?.(key);
  };

  return (
    <div className={`glass-tabs ${className}`}>
      <div className="glass-tabs-list">
        {items.map((item) => (
          <button
            key={item.key}
            className={`glass-tabs-trigger ${activeKey === item.key ? 'glass-tabs-active' : ''}`}
            onClick={() => handleTabClick(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tabs;