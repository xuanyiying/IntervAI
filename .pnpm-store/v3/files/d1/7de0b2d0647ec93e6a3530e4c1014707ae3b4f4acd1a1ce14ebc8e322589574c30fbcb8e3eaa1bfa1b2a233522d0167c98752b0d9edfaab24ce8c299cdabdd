import React from 'react';
import type { ThoughtChainItemProps } from './Item';
import Item from './Item';
import type { ThoughtChainItemType, ThoughtChainProps } from './interface';
type CompoundedComponent = typeof ForwardThoughtChain & {
    Item: typeof Item;
};
declare const ForwardThoughtChain: React.ForwardRefExoticComponent<ThoughtChainProps & React.RefAttributes<any>>;
declare const ThoughtChain: CompoundedComponent;
export type { ThoughtChainProps, ThoughtChainItemType, ThoughtChainItemProps };
export default ThoughtChain;
