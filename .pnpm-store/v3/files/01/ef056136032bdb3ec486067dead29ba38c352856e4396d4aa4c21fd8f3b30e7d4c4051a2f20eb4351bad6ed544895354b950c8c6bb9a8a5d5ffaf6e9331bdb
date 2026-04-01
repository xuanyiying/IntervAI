"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _util = require("@rc-component/util");
var _warning = require("../_util/warning");
var _Base = _interopRequireDefault(require("./Base"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const Text = (props, ref) => {
  const {
    ellipsis,
    children,
    ...restProps
  } = props;
  const mergedEllipsis = React.useMemo(() => {
    if (ellipsis && typeof ellipsis === 'object') {
      return (0, _util.omit)(ellipsis, ['expandable', 'rows']);
    }
    return ellipsis;
  }, [ellipsis]);
  if (process.env.NODE_ENV !== 'production') {
    const warning = (0, _warning.devUseWarning)('Typography.Text');
    process.env.NODE_ENV !== "production" ? warning(typeof ellipsis !== 'object' || !ellipsis || !('expandable' in ellipsis) && !('rows' in ellipsis), 'usage', '`ellipsis` do not support `expandable` or `rows` props.') : void 0;
  }
  return /*#__PURE__*/React.createElement(_Base.default, {
    ref: ref,
    ...restProps,
    ellipsis: mergedEllipsis,
    component: "span"
  }, children);
};
var _default = exports.default = /*#__PURE__*/React.forwardRef(Text);