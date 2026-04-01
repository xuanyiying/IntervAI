import * as React from 'react';
import type { ShortcutKeyInfoType } from '../_util/hooks/use-shortcut-keys';
import { CreationLabelProps } from './hooks/useCreation';
type CreationLabelInfo = {
    shortcutKeyInfo?: ShortcutKeyInfoType;
    components: {
        CreationLabel: React.ComponentType<CreationLabelProps>;
    };
};
export interface CreationProps {
    label?: React.ReactNode | ((info: CreationLabelInfo) => React.ReactNode);
    align?: 'start' | 'center' | 'end';
    prefixCls?: string;
    className?: string;
    style?: React.CSSProperties;
    shortcutKeyInfo?: ShortcutKeyInfoType;
    disabled?: boolean;
    icon?: React.ReactNode | (() => React.ReactNode);
    onClick?: (event?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}
declare const Creation: React.FC<CreationProps>;
export default Creation;
