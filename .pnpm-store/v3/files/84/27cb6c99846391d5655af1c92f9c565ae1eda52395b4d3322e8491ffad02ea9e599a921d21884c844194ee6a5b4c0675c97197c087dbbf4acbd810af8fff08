"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.OverrideProvider = void 0;
var React = _interopRequireWildcard(require("react"));
var _ref = require("@rc-component/util/lib/ref");
var _ContextIsolator = _interopRequireDefault(require("../_util/ContextIsolator"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const OverrideContext = /*#__PURE__*/React.createContext(null);
/** @internal Only used for Dropdown component. Do not use this in your production. */
const OverrideProvider = exports.OverrideProvider = /*#__PURE__*/React.forwardRef((props, ref) => {
  const {
    children,
    ...restProps
  } = props;
  const override = React.useContext(OverrideContext);
  const context = React.useMemo(() => ({
    ...override,
    ...restProps
  }), [override, restProps.prefixCls,
  // restProps.expandIcon, Not mark as deps since this is a ReactNode
  restProps.mode, restProps.selectable, restProps.rootClassName
  // restProps.validator, Not mark as deps since this is a function
  ]);
  const canRef = (0, _ref.supportNodeRef)(children);
  const mergedRef = (0, _ref.useComposeRef)(ref, canRef ? (0, _ref.getNodeRef)(children) : null);
  return /*#__PURE__*/React.createElement(OverrideContext.Provider, {
    value: context
  }, /*#__PURE__*/React.createElement(_ContextIsolator.default, {
    space: true
  }, canRef ? /*#__PURE__*/React.cloneElement(children, {
    ref: mergedRef
  }) : children));
});
/** @internal Only used for Dropdown component. Do not use this in your production. */
var _default = exports.default = OverrideContext;