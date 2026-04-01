import * as React from 'react';
import { devUseWarning } from "../_util/warning";
import LocaleContext from "./context";
export { default as useLocale } from "./useLocale";
export const ANT_MARK = 'internalMark';
const LocaleProvider = props => {
  const {
    locale = {},
    children,
    _ANT_MARK__
  } = props;
  if (process.env.NODE_ENV !== 'production') {
    const warning = devUseWarning('LocaleProvider');
    warning(_ANT_MARK__ === ANT_MARK, 'deprecated', '`LocaleProvider` is deprecated. Please use `locale` with `XProvider` instead: https://x.ant.design/components/x-provider-cn#x-provider-demo-locale');
  }
  const getMemoizedContextValue = React.useMemo(() => ({
    ...locale,
    exist: true
  }), [locale]);
  return /*#__PURE__*/React.createElement(LocaleContext.Provider, {
    value: getMemoizedContextValue
  }, children);
};
if (process.env.NODE_ENV !== 'production') {
  LocaleProvider.displayName = 'LocaleProvider';
}
export default LocaleProvider;