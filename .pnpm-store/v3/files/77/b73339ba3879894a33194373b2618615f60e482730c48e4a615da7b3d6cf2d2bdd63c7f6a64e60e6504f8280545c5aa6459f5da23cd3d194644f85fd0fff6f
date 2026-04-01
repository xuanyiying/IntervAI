import type { ImageProps, SpinProps } from 'antd';
import React from 'react';
export type SemanticType = 'root' | 'file' | 'icon' | 'name' | 'description';
export type PresetIcons = 'default' | 'excel' | 'image' | 'markdown' | 'pdf' | 'ppt' | 'word' | 'zip' | 'video' | 'audio' | 'java' | 'javascript' | 'python';
export interface FileCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'content' | 'onAnimationStart' | 'onAnimationEnd'> {
    prefixCls?: string;
    style?: React.CSSProperties;
    styles?: Partial<Record<SemanticType, React.CSSProperties>>;
    className?: string;
    classNames?: Partial<Record<SemanticType, string>>;
    rootClassName?: string;
    key?: React.Key;
    name: string;
    byte?: number;
    size?: 'small' | 'default';
    description?: React.ReactNode;
    loading?: boolean;
    src?: string;
    mask?: React.ReactNode;
    icon?: React.ReactNode | PresetIcons;
    type?: 'file' | 'image' | 'audio' | 'video' | string;
    imageProps?: ImageProps;
    spinProps?: SpinProps & {
        showText?: boolean;
        icon?: React.ReactNode;
    };
    videoProps?: Partial<React.JSX.IntrinsicElements['video']>;
    audioProps?: Partial<React.JSX.IntrinsicElements['audio']>;
    onClick?: () => void;
}
declare const FileCard: React.FC<FileCardProps>;
export default FileCard;
