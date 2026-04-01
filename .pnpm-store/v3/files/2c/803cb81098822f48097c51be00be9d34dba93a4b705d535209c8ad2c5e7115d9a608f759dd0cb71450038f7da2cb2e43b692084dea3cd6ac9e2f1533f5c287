"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _configProvider = require("../config-provider");
var _context = require("./context");
var _radio = _interopRequireDefault(require("./radio"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const RadioButton = (props, ref) => {
  const {
    getPrefixCls
  } = React.useContext(_configProvider.ConfigContext);
  const {
    prefixCls: customizePrefixCls,
    ...radioProps
  } = props;
  const prefixCls = getPrefixCls('radio', customizePrefixCls);
  return /*#__PURE__*/React.createElement(_context.RadioOptionTypeContextProvider, {
    value: "button"
  }, /*#__PURE__*/React.createElement(_radio.default, {
    prefixCls: prefixCls,
    ...radioProps,
    type: "radio",
    ref: ref
  }));
};
var _default = exports.default = /*#__PURE__*/React.forwardRef(RadioButton);