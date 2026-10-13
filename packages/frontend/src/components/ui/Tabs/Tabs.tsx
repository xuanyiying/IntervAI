import React, { useState } from 'react';
import './Tabs.css';

interface TabItem {
  key: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  defaultActiveKey?: string;
  /** Controlled active key. When provided, the component stays in sync with it. */
  activeKey?: string;
  onChange?: (key: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  defaultActiveKey,
  activeKey,
  onChange,
  className = '',
}) => {
  const [internalKey, setInternalKey] = useState(defaultActiveKey || items[0]?.key);
  const currentKey = activeKey ?? internalKey;

  const handleTabClick = (key: string) => {
    setInternalKey(key);
    onChange?.(key);
  };

  return (
    <div className={`glass-tabs ${className}`}>
      <div className="glass-tabs-list">
        {items.map((item) => (
          <button
            key={item.key}
            className={`glass-tabs-trigger ${currentKey === item.key ? 'glass-tabs-active' : ''}`}
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