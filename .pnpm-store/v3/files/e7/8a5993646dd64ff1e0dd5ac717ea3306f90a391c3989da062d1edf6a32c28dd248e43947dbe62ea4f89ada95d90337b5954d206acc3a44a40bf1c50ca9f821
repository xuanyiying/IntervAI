"use strict";
"use client";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _form = require("@rc-component/form");
var _warning = require("../_util/warning");
var _configProvider = require("../config-provider");
var _context = require("./context");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const FormList = ({
  prefixCls: customizePrefixCls,
  children,
  ...props
}) => {
  if (process.env.NODE_ENV !== 'production') {
    const warning = (0, _warning.devUseWarning)('Form.List');
    process.env.NODE_ENV !== "production" ? warning(typeof props.name === 'number' || (Array.isArray(props.name) ? !!props.name.length : !!props.name), 'usage', 'Miss `name` prop.') : void 0;
  }
  const {
    getPrefixCls
  } = React.useContext(_configProvider.ConfigContext);
  const prefixCls = getPrefixCls('form', customizePrefixCls);
  const contextValue = React.useMemo(() => ({
    prefixCls,
    status: 'error'
  }), [prefixCls]);
  return /*#__PURE__*/React.createElement(_form.List, {
    ...props
  }, (fields, operation, meta) => (/*#__PURE__*/React.createElement(_context.FormItemPrefixContext.Provider, {
    value: contextValue
  }, children(fields.map(field => ({
    ...field,
    fieldKey: field.key
  })), operation, {
    errors: meta.errors,
    warnings: meta.warnings
  }))));
};
var _default = exports.default = FormList;