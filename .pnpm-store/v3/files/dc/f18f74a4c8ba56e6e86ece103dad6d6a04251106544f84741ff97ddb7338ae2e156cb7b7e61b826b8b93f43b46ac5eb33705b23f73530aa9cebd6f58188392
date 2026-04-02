import React from 'react';
import { THOUGHT_CHAIN_ITEM_STATUS } from './Status';
declare enum VARIANT {
    SOLID = "solid",
    OUTLINED = "outlined",
    TEXT = "text"
}
export type SemanticType = 'root' | 'icon' | 'title' | 'description';
export interface ThoughtChainItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title' | 'content'> {
    /**
     * @desc 思维节点唯一标识符
     * @descEN Unique identifier
     */
    key?: string;
    /**
     * @desc 自定义前缀
     * @descEN Prefix
     */
    prefixCls?: string;
    /**
     * @desc 思维节点图标
     * @descEN Thought chain item icon
     */
    icon?: React.ReactNode;
    /**
     * @desc 思维节点标题
     * @descEN Thought chain item title
     */
    title?: React.ReactNode;
    /**
     * @desc 思维节点描述
     * @descEN Thought chain item description
     */
    description?: React.ReactNode;
    /**
     * @desc 根节点样式类
     * @descEN Root node style class.
     */
    rootClassName?: string;
    /**
     * @desc 思维节点状态
     * @descEN Thought chain item status
     */
    status?: `${THOUGHT_CHAIN_ITEM_STATUS}`;
    /**
     * @desc 思维节点变体
     * @descEN Thought chain item variant
     */
    variant?: `${VARIANT}`;
    /**
     * @desc 闪烁
     * @descEN blink
     */
    blink?: boolean;
    className?: string;
    classNames?: Partial<Record<SemanticType, string>>;
    style?: React.CSSProperties;
    styles?: Partial<Record<SemanticType, React.CSSProperties>>;
}
type ItemRef = {
    nativeElement: HTMLElement;
};
declare const Item: React.ForwardRefExoticComponent<ThoughtChainItemProps & React.RefAttributes<ItemRef>>;
export default Item;
