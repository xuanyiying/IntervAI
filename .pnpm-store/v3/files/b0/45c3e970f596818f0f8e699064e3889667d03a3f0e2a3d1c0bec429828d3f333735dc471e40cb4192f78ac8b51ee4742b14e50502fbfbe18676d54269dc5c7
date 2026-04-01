"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _warning = require("../_util/warning");
var _Base = _interopRequireDefault(require("./Base"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const TITLE_ELE_LIST = [1, 2, 3, 4, 5];
const Title = /*#__PURE__*/React.forwardRef((props, ref) => {
  const {
    level = 1,
    children,
    ...restProps
  } = props;
  if (process.env.NODE_ENV !== 'production') {
    const warning = (0, _warning.devUseWarning)('Typography.Title');
    process.env.NODE_ENV !== "production" ? warning(TITLE_ELE_LIST.includes(level), 'usage', 'Title only accept `1 | 2 | 3 | 4 | 5` as `level` value. And `5` need 4.6.0+ version.') : void 0;
  }
  const component = TITLE_ELE_LIST.includes(level) ? `h${level}` : `h1`;
  return /*#__PURE__*/React.createElement(_Base.default, {
    ref: ref,
    ...restProps,
    component: component
  }, children);
});
var _default = exports.default = Title;