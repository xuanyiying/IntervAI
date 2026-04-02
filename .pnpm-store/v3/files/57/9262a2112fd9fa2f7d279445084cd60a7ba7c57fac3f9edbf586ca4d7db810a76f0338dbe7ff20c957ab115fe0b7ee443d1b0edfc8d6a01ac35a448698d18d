"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _clsx = require("clsx");
var _hooks = require("../_util/hooks");
var _context = require("../config-provider/context");
var _skeleton = _interopRequireDefault(require("../skeleton"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const DrawerPanel = props => {
  const {
    prefixCls,
    ariaId,
    title,
    footer,
    extra,
    closable,
    loading,
    onClose,
    headerStyle,
    bodyStyle,
    footerStyle,
    children,
    classNames: drawerClassNames,
    styles: drawerStyles
  } = props;
  const drawerContext = (0, _context.useComponentConfig)('drawer');
  const {
    classNames: contextClassNames,
    styles: contextStyles
  } = drawerContext;
  const [mergedClassNames, mergedStyles] = (0, _hooks.useMergeSemantic)([contextClassNames, drawerClassNames], [contextStyles, drawerStyles], {
    props
  });
  let closablePlacement;
  if (closable === false) {
    closablePlacement = undefined;
  } else if (closable === undefined || closable === true) {
    closablePlacement = 'start';
  } else {
    closablePlacement = closable?.placement === 'end' ? 'end' : 'start';
  }
  const customCloseIconRender = React.useCallback(icon => (/*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: (0, _clsx.clsx)(`${prefixCls}-close`, {
      [`${prefixCls}-close-${closablePlacement}`]: closablePlacement === 'end'
    })
  }, icon)), [onClose, prefixCls, closablePlacement]);
  const [mergedClosable, mergedCloseIcon] = (0, _hooks.useClosable)((0, _hooks.pickClosable)(props), (0, _hooks.pickClosable)(drawerContext), {
    closable: true,
    closeIconRender: customCloseIconRender
  });
  const renderHeader = () => {
    if (!title && !mergedClosable) {
      return null;
    }
    return /*#__PURE__*/React.createElement("div", {
      style: {
        ...mergedStyles.header,
        ...headerStyle
      },
      className: (0, _clsx.clsx)(`${prefixCls}-header`, mergedClassNames.header, {
        [`${prefixCls}-header-close-only`]: mergedClosable && !title && !extra
      })
    }, /*#__PURE__*/React.createElement("div", {
      className: `${prefixCls}-header-title`
    }, closablePlacement === 'start' && mergedCloseIcon, title && (/*#__PURE__*/React.createElement("div", {
      className: (0, _clsx.clsx)(`${prefixCls}-title`, mergedClassNames.title),
      style: mergedStyles.title,
      id: ariaId
    }, title))), extra && (/*#__PURE__*/React.createElement("div", {
      className: (0, _clsx.clsx)(`${prefixCls}-extra`, mergedClassNames.extra),
      style: mergedStyles.extra
    }, extra)), closablePlacement === 'end' && mergedCloseIcon);
  };
  const renderFooter = () => {
    if (!footer) {
      return null;
    }
    return /*#__PURE__*/React.createElement("div", {
      className: (0, _clsx.clsx)(`${prefixCls}-footer`, mergedClassNames.footer),
      style: {
        ...mergedStyles.footer,
        ...footerStyle
      }
    }, footer);
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, renderHeader(), /*#__PURE__*/React.createElement("div", {
    className: (0, _clsx.clsx)(`${prefixCls}-body`, mergedClassNames.body),
    style: {
      ...mergedStyles.body,
      ...bodyStyle
    }
  }, loading ? (/*#__PURE__*/React.createElement(_skeleton.default, {
    active: true,
    title: false,
    paragraph: {
      rows: 5
    },
    className: `${prefixCls}-body-skeleton`
  })) : children), renderFooter());
};
var _default = exports.default = DrawerPanel;