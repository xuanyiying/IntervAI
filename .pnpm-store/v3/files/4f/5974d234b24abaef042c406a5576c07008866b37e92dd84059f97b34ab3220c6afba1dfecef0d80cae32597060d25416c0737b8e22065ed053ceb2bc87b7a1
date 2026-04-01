import React from 'react';
export declare enum THOUGHT_CHAIN_ITEM_STATUS {
    /**
     * @desc 等待状态
     */
    LOADING = "loading",
    /**
     * @desc 成功状态
     */
    SUCCESS = "success",
    /**
     * @desc 错误状态
     */
    ERROR = "error",
    /**
     * @desc 中止状态
     */
    ABORT = "abort"
}
export interface StatusProps {
    /**
     * @desc 唯一标识符
     * @descEN Unique identifier
     */
    key?: string;
    /**
     * @desc 图标
     * @descEN Thought chain item icon
     */
    icon?: React.ReactNode;
    /**
     * @desc 状态
     * @descEN Thought chain item status
     */
    status?: `${THOUGHT_CHAIN_ITEM_STATUS}`;
    /**
     * @desc 自定义前缀
     * @descEN Prefix
     */
    prefixCls?: string;
    /**
     * @desc 语义化结构 className
     * @descEN Semantic structure class names
     */
    className?: string;
    /**
     * @desc 语义化结构 style
     * @descEN Semantic structure styles
     */
    style?: React.CSSProperties;
}
declare const Status: React.FC<StatusProps>;
export default Status;
