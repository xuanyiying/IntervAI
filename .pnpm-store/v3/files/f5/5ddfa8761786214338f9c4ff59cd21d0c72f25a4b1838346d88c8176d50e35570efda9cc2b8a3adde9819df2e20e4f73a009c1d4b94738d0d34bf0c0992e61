"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.devUseWarning = exports.default = exports.WarningContext = void 0;
exports.noop = noop;
exports.resetWarned = resetWarned;
var React = _interopRequireWildcard(require("react"));
var _util = require("@rc-component/util");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function noop() {}
const {
  resetWarned: rcResetWarned
} = _util.warning;
let deprecatedWarnList = null;
function resetWarned() {
  deprecatedWarnList = null;
  rcResetWarned();
}
let _warning = noop;
if (process.env.NODE_ENV !== 'production') {
  _warning = (valid, component, message) => {
    (0, _util.warning)(valid, `[antd: ${component}] ${message}`);
    // StrictMode will inject console which will not throw warning in React 17.
    if (process.env.NODE_ENV === 'test') {
      resetWarned();
    }
  };
}
const warning = _warning;
const WarningContext = exports.WarningContext = /*#__PURE__*/React.createContext({});
/**
 * This is a hook but we not named as `useWarning`
 * since this is only used in development.
 * We should always wrap this in `if (process.env.NODE_ENV !== 'production')` condition
 */
const devUseWarning = exports.devUseWarning = process.env.NODE_ENV !== 'production' ? component => {
  const {
    strict
  } = React.useContext(WarningContext);
  const typeWarning = (valid, type, message) => {
    if (!valid) {
      if (strict === false && type === 'deprecated') {
        const existWarning = deprecatedWarnList;
        if (!deprecatedWarnList) {
          deprecatedWarnList = {};
        }
        deprecatedWarnList[component] = deprecatedWarnList[component] || [];
        if (!deprecatedWarnList[component].includes(message || '')) {
          deprecatedWarnList[component].push(message || '');
        }
        // Warning for the first time
        if (!existWarning) {
          console.warn('[antd] There exists deprecated usage in your code:', deprecatedWarnList);
        }
      } else {
        process.env.NODE_ENV !== "production" ? warning(valid, component, message) : void 0;
      }
    }
  };
  typeWarning.deprecated = (valid, oldProp, newProp, message = '') => {
    typeWarning(valid, 'deprecated', `\`${oldProp}\` is deprecated. Please use \`${newProp}\` instead.${message ? ` ${message}` : ''}`);
  };
  return typeWarning;
} : () => {
  const noopWarning = () => {};
  noopWarning.deprecated = noop;
  return noopWarning;
};
var _default = exports.default = warning;