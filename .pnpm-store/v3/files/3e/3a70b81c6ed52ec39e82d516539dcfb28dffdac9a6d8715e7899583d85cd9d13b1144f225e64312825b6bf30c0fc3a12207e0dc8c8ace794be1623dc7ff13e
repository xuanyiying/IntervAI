"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _ = require(".");
var _empty = _interopRequireDefault(require("../empty"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const DefaultRenderEmpty = props => {
  const {
    componentName
  } = props;
  const {
    getPrefixCls
  } = (0, _react.useContext)(_.ConfigContext);
  const prefix = getPrefixCls('empty');
  switch (componentName) {
    case 'Table':
    case 'List':
      return /*#__PURE__*/_react.default.createElement(_empty.default, {
        image: _empty.default.PRESENTED_IMAGE_SIMPLE
      });
    case 'Select':
    case 'TreeSelect':
    case 'Cascader':
    case 'Transfer':
    case 'Mentions':
      return /*#__PURE__*/_react.default.createElement(_empty.default, {
        image: _empty.default.PRESENTED_IMAGE_SIMPLE,
        className: `${prefix}-small`
      });
    /**
     * This type of component should satisfy the nullish coalescing operator(??) on the left-hand side.
     * to let the component itself implement the logic.
     * For example `Table.filter`.
     */
    case 'Table.filter':
      // why `null`? legacy react16 node type `undefined` is not allowed.
      return null;
    default:
      // Should never hit if we take all the component into consider.
      return /*#__PURE__*/_react.default.createElement(_empty.default, null);
  }
};
var _default = exports.default = DefaultRenderEmpty;