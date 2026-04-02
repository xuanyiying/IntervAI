"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _Cell = _interopRequireDefault(require("./Cell"));
var _DescriptionsContext = _interopRequireDefault(require("./DescriptionsContext"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
function renderCells(items, {
  colon,
  prefixCls,
  bordered
}, {
  component,
  type,
  showLabel,
  showContent,
  labelStyle: rootLabelStyle,
  contentStyle: rootContentStyle,
  styles: rootStyles
}) {
  return items.map(({
    label,
    children,
    prefixCls: itemPrefixCls = prefixCls,
    className,
    style,
    labelStyle,
    contentStyle,
    span = 1,
    key,
    styles,
    classNames
  }, index) => {
    if (typeof component === 'string') {
      return /*#__PURE__*/React.createElement(_Cell.default, {
        key: `${type}-${key || index}`,
        className: className,
        style: style,
        classNames: classNames,
        styles: {
          label: {
            ...rootLabelStyle,
            ...rootStyles?.label,
            ...labelStyle,
            ...styles?.label
          },
          content: {
            ...rootContentStyle,
            ...rootStyles?.content,
            ...contentStyle,
            ...styles?.content
          }
        },
        span: span,
        colon: colon,
        component: component,
        itemPrefixCls: itemPrefixCls,
        bordered: bordered,
        label: showLabel ? label : null,
        content: showContent ? children : null,
        type: type
      });
    }
    return [/*#__PURE__*/React.createElement(_Cell.default, {
      key: `label-${key || index}`,
      className: className,
      style: {
        ...rootLabelStyle,
        ...rootStyles?.label,
        ...style,
        ...labelStyle,
        ...styles?.label
      },
      span: 1,
      colon: colon,
      component: component[0],
      itemPrefixCls: itemPrefixCls,
      bordered: bordered,
      label: label,
      type: "label"
    }), /*#__PURE__*/React.createElement(_Cell.default, {
      key: `content-${key || index}`,
      className: className,
      style: {
        ...rootContentStyle,
        ...rootStyles?.content,
        ...style,
        ...contentStyle,
        ...styles?.content
      },
      span: span * 2 - 1,
      component: component[1],
      itemPrefixCls: itemPrefixCls,
      bordered: bordered,
      content: children,
      type: "content"
    })];
  });
}
const Row = props => {
  const descContext = React.useContext(_DescriptionsContext.default);
  const {
    prefixCls,
    vertical,
    row,
    index,
    bordered
  } = props;
  if (vertical) {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("tr", {
      key: `label-${index}`,
      className: `${prefixCls}-row`
    }, renderCells(row, props, {
      component: 'th',
      type: 'label',
      showLabel: true,
      ...descContext
    })), /*#__PURE__*/React.createElement("tr", {
      key: `content-${index}`,
      className: `${prefixCls}-row`
    }, renderCells(row, props, {
      component: 'td',
      type: 'content',
      showContent: true,
      ...descContext
    })));
  }
  return /*#__PURE__*/React.createElement("tr", {
    key: index,
    className: `${prefixCls}-row`
  }, renderCells(row, props, {
    component: bordered ? ['th', 'td'] : 'td',
    type: 'item',
    showLabel: true,
    showContent: true,
    ...descContext
  }));
};
var _default = exports.default = Row;