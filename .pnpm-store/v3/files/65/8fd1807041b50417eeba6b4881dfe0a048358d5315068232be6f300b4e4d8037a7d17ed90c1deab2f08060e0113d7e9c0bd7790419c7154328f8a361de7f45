import { type UploadProps } from 'antd';
import React from 'react';
import { SemanticType as FileCardSemanticType } from '../../file-card/FileCard';
import { SemanticType as FileCardListSemanticType } from '../../file-card/List';
import type { Attachment } from '..';
type SemanticType = 'list' | 'placeholder' | 'upload';
export interface FileListProps {
    prefixCls: string;
    items: Attachment[];
    style?: React.CSSProperties;
    onRemove: (item: Attachment) => void;
    overflow?: 'scrollX' | 'scrollY' | 'wrap';
    upload: UploadProps;
    className?: string;
    classNames?: Partial<Record<SemanticType | FileCardSemanticType | FileCardListSemanticType, string>>;
    styles?: Partial<Record<SemanticType | FileCardSemanticType | FileCardListSemanticType, React.CSSProperties>>;
}
export default function FileList(props: FileListProps): React.JSX.Element;
export {};
