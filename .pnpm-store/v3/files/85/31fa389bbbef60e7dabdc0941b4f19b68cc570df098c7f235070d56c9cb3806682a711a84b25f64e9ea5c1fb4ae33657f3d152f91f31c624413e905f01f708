"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
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
var _locale = require("../modal/locale");
var _context = _interopRequireDefault(require("./context"));
var _useLocale = _interopRequireDefault(require("./useLocale"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const ANT_MARK = exports.ANT_MARK = 'internalMark';
const LocaleProvider = props => {
  const {
    locale = {},
    children,
    _ANT_MARK__
  } = props;
  if (process.env.NODE_ENV !== 'production') {
    const warning = (0, _warning.devUseWarning)('LocaleProvider');
    process.env.NODE_ENV !== "production" ? warning(_ANT_MARK__ === ANT_MARK, 'deprecated', '`LocaleProvider` is deprecated. Please use `locale` with `ConfigProvider` instead: http://u.ant.design/locale') : void 0;
  }
  React.useEffect(() => {
    const clearLocale = (0, _locale.changeConfirmLocale)(locale?.Modal);
    return clearLocale;
  }, [locale]);
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