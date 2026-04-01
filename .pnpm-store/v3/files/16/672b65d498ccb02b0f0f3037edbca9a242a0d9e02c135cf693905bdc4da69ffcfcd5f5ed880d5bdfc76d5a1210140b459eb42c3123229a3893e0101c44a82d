import type { XComponentsConfig } from '../../x-provider/context';
import type { ShortcutKeys } from '../type';
export type ShortcutKeyActionType = {
    actionShortcutKey: ShortcutKeys<number>;
    actionKeyCode: number;
    name: string;
    timeStamp: number;
    actionKeyCodeNumber: number | false;
    index?: number;
};
export type ShortcutKeyInfoType = {
    shortcutKeys: ShortcutKeys | ShortcutKeys[];
    shortcutKeysIcon: string[] | string[][];
};
type ShortcutKeysInfo = Record<string, ShortcutKeyInfoType>;
type Observer = (ShortcutKeyAction: ShortcutKeyActionType) => void;
type Subscribe = (fn: Observer) => void;
declare const useShortcutKeys: (component: keyof XComponentsConfig, shortcutKeys?: Record<string, ShortcutKeys | ShortcutKeys[]>) => [ShortcutKeyActionType | null, ShortcutKeysInfo, Subscribe];
export default useShortcutKeys;
