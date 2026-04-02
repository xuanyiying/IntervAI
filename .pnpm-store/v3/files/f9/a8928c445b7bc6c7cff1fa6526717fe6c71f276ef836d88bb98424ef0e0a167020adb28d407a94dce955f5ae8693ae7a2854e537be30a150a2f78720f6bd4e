import React from 'react';
import type { ShortcutKeys } from '../_util/type';
import type { CreationProps } from './Creation';
import Creation from './Creation';
import { type ConversationsItemProps } from './Item';
import type { ConversationItemType, DividerItemType, GroupableProps, ItemType } from './interface';
type SemanticType = 'root' | 'creation' | 'group' | 'item';
/**
 * @desc 会话列表组件参数
 * @descEN Props for the conversation list component
 */
export interface ConversationsProps extends React.HTMLAttributes<HTMLUListElement> {
    /**
     * @desc 会话列表数据源
     * @descEN Data source for the conversation list
     */
    items?: ItemType[];
    /**
     * @desc 当前选中的值
     * @descEN Currently selected value
     */
    activeKey?: ConversationItemType['key'];
    /**
     * @desc 默认选中值
     * @descEN Default selected value
     */
    defaultActiveKey?: ConversationItemType['key'];
    /**
     * @desc 选中变更回调
     * @descEN Callback for selection change
     */
    onActiveChange?: (value: ConversationItemType['key']) => void;
    /**
     * @desc 会话操作菜单
     * @descEN Operation menu for conversations
     */
    menu?: ConversationsItemProps['menu'] | ((value: ConversationItemType) => ConversationsItemProps['menu']);
    /**
     * @desc 是否支持分组, 开启后默认按 {@link Conversation.group} 字段分组
     * @descEN If grouping is supported, it defaults to the {@link Conversation.group} field
     */
    groupable?: boolean | GroupableProps;
    /**
     * @desc 语义化结构 style
     * @descEN Semantic structure styles
     */
    styles?: Partial<Record<SemanticType, React.CSSProperties>>;
    /**
     * @desc 语义化结构 className
     * @descEN Semantic structure class names
     */
    classNames?: Partial<Record<SemanticType, string>>;
    /**
     * @desc 自定义前缀
     * @descEN Prefix
     */
    prefixCls?: string;
    /**
     * @desc 自定义根类名
     * @descEN Custom class name
     */
    rootClassName?: string;
    /**
     * @desc 自定义快捷键
     * @descEN Custom Shortcut Keys
     */
    shortcutKeys?: {
        creation?: ShortcutKeys<number>;
        items?: ShortcutKeys<'number'> | ShortcutKeys<number>[];
    };
    /**
     * @desc 新建对话按钮的配置
     * @descEN  Config of the new chat button
     */
    creation?: CreationProps;
}
type CompoundedComponent = typeof ForwardConversations & {
    Creation: typeof Creation;
};
type ConversationsRef = {
    nativeElement: HTMLDivElement;
};
declare const ForwardConversations: React.ForwardRefExoticComponent<ConversationsProps & React.RefAttributes<ConversationsRef>>;
declare const Conversations: CompoundedComponent;
export type { ItemType, ConversationItemType, DividerItemType };
export default Conversations;
