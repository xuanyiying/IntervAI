"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.InternalBreadcrumbItem = void 0;
var React = _interopRequireWildcard(require("react"));
var _DownOutlined = _interopRequireDefault(require("@ant-design/icons/DownOutlined"));
var _isNonNullable = _interopRequireDefault(require("../_util/isNonNullable"));
var _configProvider = require("../config-provider");
var _dropdown = _interopRequireDefault(require("../dropdown/dropdown"));
var _BreadcrumbContext = _interopRequireDefault(require("./BreadcrumbContext"));
var _BreadcrumbSeparator = _interopRequireDefault(require("./BreadcrumbSeparator"));
var _useItemRender = require("./useItemRender");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const InternalBreadcrumbItem = props => {
  const {
    prefixCls,
    separator = '/',
    children,
    menu,
    dropdownProps,
    href
  } = props;
  const breadcrumbContext = React.useContext(_BreadcrumbContext.default);
  const {
    classNames: mergedClassNames,
    styles: mergedStyles
  } = breadcrumbContext;
  /** If overlay is have Wrap a Dropdown */
  const renderBreadcrumbNode = breadcrumbItem => {
    if (menu) {
      const mergeDropDownProps = {
        ...dropdownProps
      };
      if (menu) {
        const {
          items,
          ...menuProps
        } = menu || {};
        mergeDropDownProps.menu = {
          ...menuProps,
          items: items?.map(({
            key,
            title,
            label,
            path,
            ...itemProps
          }, index) => {
            let mergedLabel = label ?? title;
            if (path) {
              mergedLabel = /*#__PURE__*/React.createElement("a", {
                href: `${href}${path}`
              }, mergedLabel);
            }
            return {
              ...itemProps,
              key: key ?? index,
              label: mergedLabel
            };
          })
        };
      }
      return /*#__PURE__*/React.createElement(_dropdown.default, {
        placement: "bottom",
        ...mergeDropDownProps
      }, /*#__PURE__*/React.createElement("span", {
        className: `${prefixCls}-overlay-link`
      }, breadcrumbItem, /*#__PURE__*/React.createElement(_DownOutlined.default, null)));
    }
    return breadcrumbItem;
  };
  // wrap to dropDown
  const link = renderBreadcrumbNode(children);
  if ((0, _isNonNullable.default)(link)) {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("li", {
      className: mergedClassNames?.item,
      style: mergedStyles?.item
    }, link), separator && /*#__PURE__*/React.createElement(_BreadcrumbSeparator.default, null, separator));
  }
  return null;
};
exports.InternalBreadcrumbItem = InternalBreadcrumbItem;
const BreadcrumbItem = props => {
  const {
    prefixCls: customizePrefixCls,
    children,
    href,
    ...restProps
  } = props;
  const {
    getPrefixCls
  } = React.useContext(_configProvider.ConfigContext);
  const prefixCls = getPrefixCls('breadcrumb', customizePrefixCls);
  return /*#__PURE__*/React.createElement(InternalBreadcrumbItem, {
    ...restProps,
    prefixCls: prefixCls
  }, (0, _useItemRender.renderItem)(prefixCls, restProps, children, href));
};
BreadcrumbItem.__ANT_BREADCRUMB_ITEM = true;
var _default = exports.default = BreadcrumbItem;