import React from 'react';
import XProviderContext from "../../x-provider/context";
const defaultXComponentStyleConfig = {
  classNames: {},
  styles: {},
  className: '',
  style: {},
  shortcutKeys: {}
};
const useXComponentConfig = component => {
  const xProviderContext = React.useContext(XProviderContext);
  return React.useMemo(() => ({
    ...defaultXComponentStyleConfig,
    ...xProviderContext[component]
  }), [xProviderContext[component]]);
};
export default useXComponentConfig;