"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.ANT_MARK = void 0;
Object.defineProperty(exports, "useLocale", {
  enumerable: true,
  get: function () {
    return _useLocale.default;
  }
});
var React = _interopRequireWildcard(require("react"));
var _warning = require("../_util/warning");
var _context = _interopRequireDefault(require("./context"));
var _useLocale = _interopRequireDefault(require("./useLocale"));
const ANT_MARK = exports.ANT_MARK = 'internalMark';
const LocaleProvider = props => {
  const {
    locale = {},
    children,
    _ANT_MARK__
  } = props;
  if (process.env.NODE_ENV !== 'production') {
    const warning = (0, _warning.devUseWarning)('LocaleProvider');
    warning(_ANT_MARK__ === ANT_MARK, 'deprecated', '`LocaleProvider` is deprecated. Please use `locale` with `XProvider` instead: https://x.ant.design/components/x-provider-cn#x-provider-demo-locale');
  }
  const getMemoizedContextValue = React.useMemo(() => ({
    ...locale,
    exist: true
  }), [locale]);
  return /*#__PURE__*/React.createElement(_context.default.Provider, {
    value: getMemoizedContextValue
  }, children);
};
if (process.env.NODE_ENV !== 'production') {
  LocaleProvider.displayName = 'LocaleProvider';
}
var _default = exports.default = LocaleProvider;