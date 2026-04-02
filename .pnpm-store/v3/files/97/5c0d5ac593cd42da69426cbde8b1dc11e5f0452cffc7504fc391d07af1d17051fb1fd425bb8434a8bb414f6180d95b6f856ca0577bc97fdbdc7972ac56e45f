import type { MenuProps } from 'antd';
import type { DirectionType } from 'antd/es/config-provider';
import React from 'react';
import type { ConversationsProps } from '.';
import type { ConversationItemType } from './interface';
export interface ConversationsItemProps extends Omit<React.HTMLAttributes<HTMLLIElement>, 'onClick'> {
    info: ConversationItemType;
    prefixCls?: string;
    direction?: DirectionType;
    menu?: MenuProps & {
        trigger?: React.ReactNode | ((conversation: ConversationItemType, info: {
            originNode: React.ReactNode;
        }) => React.ReactNode);
        getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
    };
    active?: boolean;
    onClick?: ConversationsProps['onActiveChange'];
}
declare const ConversationsItem: React.FC<ConversationsItemProps>;
export default ConversationsItem;
