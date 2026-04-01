"use strict";
"use client";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.VariantContext = exports.NoStyleItemContext = exports.NoFormStyle = exports.FormProvider = exports.FormItemPrefixContext = exports.FormItemInputContext = exports.FormContext = void 0;
var React = _interopRequireWildcard(require("react"));
var _form = require("@rc-component/form");
var _util = require("@rc-component/util");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const FormContext = exports.FormContext = /*#__PURE__*/React.createContext({
  labelAlign: 'right',
  layout: 'horizontal',
  itemRef: () => {}
});
const NoStyleItemContext = exports.NoStyleItemContext = /*#__PURE__*/React.createContext(null);
const FormProvider = props => {
  const providerProps = (0, _util.omit)(props, ['prefixCls']);
  return /*#__PURE__*/React.createElement(_form.FormProvider, {
    ...providerProps
  });
};
exports.FormProvider = FormProvider;
const FormItemPrefixContext = exports.FormItemPrefixContext = /*#__PURE__*/React.createContext({
  prefixCls: ''
});
const FormItemInputContext = exports.FormItemInputContext = /*#__PURE__*/React.createContext({});
if (process.env.NODE_ENV !== 'production') {
  FormItemInputContext.displayName = 'FormItemInputContext';
}
const NoFormStyle = ({
  children,
  status,
  override
}) => {
  const formItemInputContext = React.useContext(FormItemInputContext);
  const newFormItemInputContext = React.useMemo(() => {
    const newContext = {
      ...formItemInputContext
    };
    if (override) {
      delete newContext.isFormItemInput;
    }
    if (status) {
      delete newContext.status;
      delete newContext.hasFeedback;
      delete newContext.feedbackIcon;
    }
    return newContext;
  }, [status, override, formItemInputContext]);
  return /*#__PURE__*/React.createElement(FormItemInputContext.Provider, {
    value: newFormItemInputContext
  }, children);
};
exports.NoFormStyle = NoFormStyle;
const VariantContext = exports.VariantContext = /*#__PURE__*/React.createContext(undefined);