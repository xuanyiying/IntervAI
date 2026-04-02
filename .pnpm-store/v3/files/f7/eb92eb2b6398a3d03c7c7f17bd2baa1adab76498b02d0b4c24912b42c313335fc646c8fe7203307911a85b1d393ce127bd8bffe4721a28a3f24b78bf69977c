"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _confirm = _interopRequireWildcard(require("./confirm"));
var _destroyFns = _interopRequireDefault(require("./destroyFns"));
var _Modal = _interopRequireDefault(require("./Modal"));
var _PurePanel = _interopRequireDefault(require("./PurePanel"));
var _useModal = _interopRequireDefault(require("./useModal"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function modalWarn(props) {
  return (0, _confirm.default)((0, _confirm.withWarn)(props));
}
const Modal = _Modal.default;
Modal.useModal = _useModal.default;
Modal.info = function infoFn(props) {
  return (0, _confirm.default)((0, _confirm.withInfo)(props));
};
Modal.success = function successFn(props) {
  return (0, _confirm.default)((0, _confirm.withSuccess)(props));
};
Modal.error = function errorFn(props) {
  return (0, _confirm.default)((0, _confirm.withError)(props));
};
Modal.warning = modalWarn;
Modal.warn = modalWarn;
Modal.confirm = function confirmFn(props) {
  return (0, _confirm.default)((0, _confirm.withConfirm)(props));
};
Modal.destroyAll = function destroyAllFn() {
  while (_destroyFns.default.length) {
    const close = _destroyFns.default.pop();
    if (close) {
      close();
    }
  }
};
Modal.config = _confirm.modalGlobalConfig;
Modal._InternalPanelDoNotUseOrYouWillBeFired = _PurePanel.default;
if (process.env.NODE_ENV !== 'production') {
  Modal.displayName = 'Modal';
}
var _default = exports.default = Modal;