import type { BubbleAnimationOption, BubbleProps } from '../interface';
interface OutputData {
    text: string;
    taskId: number;
    id: string;
    done: boolean;
}
export declare function useTyping({ streaming, content, typing, onTyping, onTypingComplete, }: {
    streaming: boolean;
    content: string;
    typing: true | BubbleAnimationOption;
    onTyping?: BubbleProps['onTyping'];
    onTypingComplete?: BubbleProps['onTypingComplete'];
}): {
    renderedData: OutputData[];
    animating: boolean;
    memoedAnimationCfg: BubbleAnimationOption;
};
export {};
