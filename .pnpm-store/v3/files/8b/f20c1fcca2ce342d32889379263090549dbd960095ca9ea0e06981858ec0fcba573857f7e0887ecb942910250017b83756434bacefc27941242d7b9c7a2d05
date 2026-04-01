"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _CaretDownFilled = _interopRequireDefault(require("@ant-design/icons/CaretDownFilled"));
var _FileOutlined = _interopRequireDefault(require("@ant-design/icons/FileOutlined"));
var _LoadingOutlined = _interopRequireDefault(require("@ant-design/icons/LoadingOutlined"));
var _MinusSquareOutlined = _interopRequireDefault(require("@ant-design/icons/MinusSquareOutlined"));
var _PlusSquareOutlined = _interopRequireDefault(require("@ant-design/icons/PlusSquareOutlined"));
var _clsx = require("clsx");
var _reactNode = require("../../_util/reactNode");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const SwitcherIconCom = props => {
  const {
    prefixCls,
    switcherIcon,
    treeNodeProps,
    showLine,
    switcherLoadingIcon
  } = props;
  const {
    isLeaf,
    expanded,
    loading
  } = treeNodeProps;
  if (loading) {
    if (/*#__PURE__*/React.isValidElement(switcherLoadingIcon)) {
      return switcherLoadingIcon;
    }
    return /*#__PURE__*/React.createElement(_LoadingOutlined.default, {
      className: `${prefixCls}-switcher-loading-icon`
    });
  }
  let showLeafIcon;
  if (showLine && typeof showLine === 'object') {
    showLeafIcon = showLine.showLeafIcon;
  }
  if (isLeaf) {
    if (!showLine) {
      return null;
    }
    if (typeof showLeafIcon !== 'boolean' && !!showLeafIcon) {
      const leafIcon = typeof showLeafIcon === 'function' ? showLeafIcon(treeNodeProps) : showLeafIcon;
      const leafCls = `${prefixCls}-switcher-line-custom-icon`;
      if (/*#__PURE__*/React.isValidElement(leafIcon)) {
        return (0, _reactNode.cloneElement)(leafIcon, {
          className: (0, _clsx.clsx)(leafIcon.props?.className, leafCls)
        });
      }
      return leafIcon;
    }
    return showLeafIcon ? (/*#__PURE__*/React.createElement(_FileOutlined.default, {
      className: `${prefixCls}-switcher-line-icon`
    })) : (/*#__PURE__*/React.createElement("span", {
      className: `${prefixCls}-switcher-leaf-line`
    }));
  }
  const switcherCls = `${prefixCls}-switcher-icon`;
  const switcher = typeof switcherIcon === 'function' ? switcherIcon(treeNodeProps) : switcherIcon;
  if (/*#__PURE__*/React.isValidElement(switcher)) {
    return (0, _reactNode.cloneElement)(switcher, {
      className: (0, _clsx.clsx)(switcher.props?.className, switcherCls)
    });
  }
  if (switcher !== undefined) {
    return switcher;
  }
  if (showLine) {
    return expanded ? (/*#__PURE__*/React.createElement(_MinusSquareOutlined.default, {
      className: `${prefixCls}-switcher-line-icon`
    })) : (/*#__PURE__*/React.createElement(_PlusSquareOutlined.default, {
      className: `${prefixCls}-switcher-line-icon`
    }));
  }
  return /*#__PURE__*/React.createElement(_CaretDownFilled.default, {
    className: switcherCls
  });
};
var _default = exports.default = SwitcherIconCom;