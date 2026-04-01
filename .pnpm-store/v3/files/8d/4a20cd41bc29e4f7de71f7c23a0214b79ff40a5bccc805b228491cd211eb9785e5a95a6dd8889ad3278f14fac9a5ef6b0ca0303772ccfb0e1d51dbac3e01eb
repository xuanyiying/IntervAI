import React from 'react';
import ActionsAudio from './ActionsAudio';
import ActionsCopy from './ActionsCopy';
import ActionsFeedback from './ActionsFeedback';
import ActionsItem from './ActionsItem';
import type { ActionsProps } from './interface';
type ActionsRef = {
    nativeElement: HTMLDivElement;
};
declare const ForwardActions: React.ForwardRefExoticComponent<ActionsProps & React.RefAttributes<ActionsRef>>;
type CompoundedActions = typeof ForwardActions & {
    Feedback: typeof ActionsFeedback;
    Copy: typeof ActionsCopy;
    Item: typeof ActionsItem;
    Audio: typeof ActionsAudio;
};
declare const Actions: CompoundedActions;
export default Actions;
