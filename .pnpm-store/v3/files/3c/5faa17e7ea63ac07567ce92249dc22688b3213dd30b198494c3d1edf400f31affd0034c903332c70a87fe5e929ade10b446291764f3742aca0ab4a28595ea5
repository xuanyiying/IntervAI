import React from 'react';
export type SemanticType = 'root' | 'status' | 'content';
export interface ThinkProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    prefixCls?: string;
    style?: React.CSSProperties;
    styles?: Partial<Record<SemanticType, React.CSSProperties>>;
    className?: string;
    classNames?: Partial<Record<SemanticType, string>>;
    rootClassName?: string;
    title?: React.ReactNode;
    icon?: React.ReactNode;
    loading?: boolean | React.ReactNode;
    defaultExpanded?: boolean;
    expanded?: boolean;
    onExpand?: (expand: boolean) => void;
    blink?: boolean;
}
type ThinkRef = {
    nativeElement: HTMLElement;
};
declare const Think: React.ForwardRefExoticComponent<ThinkProps & React.RefAttributes<ThinkRef>>;
export default Think;
