import type { CollapsibleOptions } from '../../_util/hooks/use-collapsible';
import type { ConversationsProps } from '..';
import type { GroupableProps, ItemType } from '../interface';
export interface GroupInfoType {
    data: ItemType[];
    name: string;
    label: GroupableProps['label'];
    enableGroup: boolean;
    collapsible: boolean;
}
type GroupList = GroupInfoType[];
type KeyList = {
    key: string;
    disabled?: boolean;
}[];
declare const useGroupable: (groupable?: ConversationsProps['groupable'], items?: ItemType[]) => [groupList: GroupList, collapsibleOptions: CollapsibleOptions, keyList: KeyList];
export default useGroupable;
