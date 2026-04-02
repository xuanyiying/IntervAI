"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _ActionButton = _interopRequireDefault(require("../../_util/ActionButton"));
var _context = require("../context");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const ConfirmCancelBtn = () => {
  const {
    autoFocusButton,
    cancelButtonProps,
    cancelTextLocale,
    isSilent,
    mergedOkCancel,
    rootPrefixCls,
    close,
    onCancel,
    onConfirm,
    onClose
  } = (0, _react.useContext)(_context.ModalContext);
  return mergedOkCancel ? (/*#__PURE__*/_react.default.createElement(_ActionButton.default, {
    isSilent: isSilent,
    actionFn: onCancel,
    close: (...args) => {
      close?.(...args);
      onConfirm?.(false);
      onClose?.();
    },
    autoFocus: autoFocusButton === 'cancel',
    buttonProps: cancelButtonProps,
    prefixCls: `${rootPrefixCls}-btn`
  }, cancelTextLocale)) : null;
};
var _default = exports.default = ConfirmCancelBtn;