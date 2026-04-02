import React, { useMemo } from 'react';
const useGroupable = (groupable, items = []) => {
  const [label, collapsibleHandle, collapsibleOptions] = useMemo(() => {
    let baseConfig = {
      label: '',
      collapsibleHandle: false,
      collapsibleOptions: {}
    };
    if (!groupable) {
      return ['', baseConfig.collapsibleHandle, baseConfig.collapsibleOptions];
    }
    if (typeof groupable === 'object') {
      const {
        collapsible,
        defaultExpandedKeys,
        expandedKeys,
        onExpand,
        ...other
      } = groupable;
      baseConfig = {
        ...baseConfig,
        ...other,
        collapsibleHandle: collapsible,
        collapsibleOptions: {
          defaultExpandedKeys,
          expandedKeys,
          onExpand
        }
      };
    }
    return [baseConfig.label, baseConfig.collapsibleHandle, baseConfig.collapsibleOptions];
  }, [groupable]);
  return React.useMemo(() => {
    const groupList = items.reduce((currentGroupList, item) => {
      if (item?.type === 'divider' || !item.group || !groupable) {
        currentGroupList.push({
          data: [item],
          name: '',
          label: '',
          enableGroup: false,
          collapsible: false
        });
        return currentGroupList;
      }
      const baseItem = item;
      const isSome = currentGroupList.some((group, index) => {
        if (group.name === baseItem?.group) {
          currentGroupList[index].data.push(baseItem);
          return true;
        }
        return false;
      });
      const collapsible = typeof collapsibleHandle === 'function' ? collapsibleHandle?.(baseItem?.group) : collapsibleHandle;
      if (!isSome) {
        currentGroupList.push({
          data: [baseItem],
          enableGroup: true,
          name: baseItem?.group,
          label,
          collapsible
        });
      }
      return currentGroupList;
    }, []);
    const keyList = groupList.reduce((currentKeyList, group) => {
      group.data.forEach(item => {
        if (item.type !== 'divider') {
          currentKeyList.push({
            key: item.key,
            disabled: item.disabled
          });
        }
      });
      return currentKeyList;
    }, []);
    return [groupList, collapsibleOptions, keyList];
  }, [items, collapsibleOptions]);
};
export default useGroupable;