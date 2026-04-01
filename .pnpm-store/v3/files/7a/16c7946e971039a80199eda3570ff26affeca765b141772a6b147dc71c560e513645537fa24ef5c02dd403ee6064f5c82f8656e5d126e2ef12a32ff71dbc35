import React from 'react';
declare enum FEEDBACK_VALUE {
    like = "like",
    dislike = "dislike",
    default = "default"
}
export type SemanticType = 'like' | 'liked' | 'dislike' | 'disliked' | 'root';
export interface ActionsFeedbackProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
    /**
     * @desc 反馈状态值
     * @descEN Feedback status value
     */
    value?: `${FEEDBACK_VALUE}`;
    /**
     * @desc 反馈状态变化回调
     * @descEN Feedback status change callback
     */
    onChange?: (value: `${FEEDBACK_VALUE}`) => void;
    /**
     * @desc 自定义样式前缀
     * @descEN Customize the component's prefixCls
     */
    prefixCls?: string;
    /**
     * @desc 根节点样式类
     * @descEN Root node style class.
     */
    rootClassName?: string;
    /**
     * @desc 语义化结构 className
     * @descEN Semantic structure class names
     */
    classNames?: Partial<Record<SemanticType, string>>;
    /**
     * @desc 语义化结构 style
     * @descEN Semantic structure styles
     */
    styles?: Partial<Record<SemanticType, React.CSSProperties>>;
}
declare const ActionsFeedback: React.FC<ActionsFeedbackProps>;
export default ActionsFeedback;
