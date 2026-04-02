"use strict";
"use client";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.withPureRenderTheme = withPureRenderTheme;
var React = _interopRequireWildcard(require("react"));
var _util = require("@rc-component/util");
var _configProvider = _interopRequireWildcard(require("../config-provider"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function withPureRenderTheme(Component) {
  return props => (/*#__PURE__*/React.createElement(_configProvider.default, {
    theme: {
      token: {
        motion: false,
        zIndexPopupBase: 0
      }
    }
  }, /*#__PURE__*/React.createElement(Component, {
    ...props
  })));
}
/* istanbul ignore next */
const genPurePanel = (Component, alignPropName, postProps, defaultPrefixCls, getDropdownCls) => {
  const PurePanel = props => {
    const {
      prefixCls: customizePrefixCls,
      style
    } = props;
    const holderRef = React.useRef(null);
    const [popupHeight, setPopupHeight] = React.useState(0);
    const [popupWidth, setPopupWidth] = React.useState(0);
    const [open, setOpen] = (0, _util.useControlledState)(false, props.open);
    const {
      getPrefixCls
    } = React.useContext(_configProvider.ConfigContext);
    const prefixCls = getPrefixCls(defaultPrefixCls || 'select', customizePrefixCls);
    React.useEffect(() => {
      // We do not care about ssr
      setOpen(true);
      if (typeof ResizeObserver !== 'undefined') {
        const resizeObserver = new ResizeObserver(entries => {
          const element = entries[0].target;
          setPopupHeight(element.offsetHeight + 8);
          setPopupWidth(element.offsetWidth);
        });
        const interval = setInterval(() => {
          const dropdownCls = getDropdownCls ? `.${getDropdownCls(prefixCls)}` : `.${prefixCls}-dropdown`;
          const popup = holderRef.current?.querySelector(dropdownCls);
          if (popup) {
            clearInterval(interval);
            resizeObserver.observe(popup);
          }
        }, 10);
        return () => {
          clearInterval(interval);
          resizeObserver.disconnect();
        };
      }
    }, [prefixCls]);
    let mergedProps = {
      ...props,
      style: {
        ...style,
        margin: 0
      },
      open,
      getPopupContainer: () => holderRef.current
    };
    if (postProps) {
      mergedProps = postProps(mergedProps);
    }
    if (alignPropName) {
      Object.assign(mergedProps, {
        [alignPropName]: {
          overflow: {
            adjustX: false,
            adjustY: false
          }
        }
      });
    }
    const mergedStyle = {
      paddingBottom: popupHeight,
      position: 'relative',
      minWidth: popupWidth
    };
    return /*#__PURE__*/React.createElement("div", {
      ref: holderRef,
      style: mergedStyle
    }, /*#__PURE__*/React.createElement(Component, {
      ...mergedProps
    }));
  };
  return withPureRenderTheme(PurePanel);
};
var _default = exports.default = genPurePanel;