"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _KeyCode = _interopRequireDefault(require("@rc-component/util/lib/KeyCode"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const onKeyDown = event => {
  const {
    keyCode
  } = event;
  if (keyCode === _KeyCode.default.ENTER) {
    event.stopPropagation();
  }
};
const FilterDropdownMenuWrapper = /*#__PURE__*/React.forwardRef((props, ref) => (/*#__PURE__*/React.createElement("div", {
  className: props.className,
  onClick: e => e.stopPropagation(),
  onKeyDown: onKeyDown,
  ref: ref
}, props.children)));
if (process.env.NODE_ENV !== 'production') {
  FilterDropdownMenuWrapper.displayName = 'FilterDropdownMenuWrapper';
}
var _default = exports.default = FilterDropdownMenuWrapper;