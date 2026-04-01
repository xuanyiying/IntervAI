import React from 'react';
export type SemanticType = 'root' | 'title' | 'content';
export interface SourcesItem {
    key?: React.Key;
    title: React.ReactNode;
    url?: string;
    icon?: React.ReactNode;
    description?: React.ReactNode;
}
export interface SourcesProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title' | 'onClick'> {
    prefixCls?: string;
    style?: React.CSSProperties;
    styles?: Partial<Record<SemanticType, React.CSSProperties>>;
    className?: string;
    classNames?: Partial<Record<SemanticType, string>>;
    rootClassName?: string;
    inline?: boolean;
    items?: Array<SourcesItem>;
    title?: React.ReactNode;
    expandIconPosition?: 'start' | 'end';
    onClick?: (item: SourcesItem) => void;
    popoverOverlayWidth?: number | string;
    activeKey?: React.Key;
    expanded?: boolean;
    onExpand?: (expand: boolean) => void;
    defaultExpanded?: boolean;
}
type SourcesRef = {
    nativeElement: HTMLElement;
};
declare const ForwardSources: React.ForwardRefExoticComponent<SourcesProps & React.RefAttributes<SourcesRef>>;
export default ForwardSources;
