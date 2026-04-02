import React from 'react';
import { SemanticType as CardSemanticType, FileCardProps } from './FileCard';
export type SemanticType = 'root' | 'card';
export interface FileCardListProps {
    prefixCls?: string;
    className?: string;
    classNames?: Partial<Record<SemanticType | CardSemanticType, string>>;
    rootClassName?: string;
    style?: React.CSSProperties;
    styles?: Partial<Record<SemanticType | CardSemanticType, React.CSSProperties>>;
    items: FileCardProps[];
    size?: 'small' | 'default';
    removable?: boolean | ((item: FileCardProps) => boolean);
    onRemove?: (item: FileCardProps) => void;
    extension?: React.ReactNode;
    overflow?: 'scrollX' | 'scrollY' | 'wrap';
}
declare const List: React.FC<FileCardListProps>;
export default List;
