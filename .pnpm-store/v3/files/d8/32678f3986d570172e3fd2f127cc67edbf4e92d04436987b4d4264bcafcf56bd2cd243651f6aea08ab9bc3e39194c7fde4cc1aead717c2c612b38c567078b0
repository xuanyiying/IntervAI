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
var _warning = require("../_util/warning");
var _context = require("../config-provider/context");
var _locale = require("../locale");
var _empty = _interopRequireDefault(require("./empty"));
var _simple = _interopRequireDefault(require("./simple"));
var _style = _interopRequireDefault(require("./style"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const defaultEmptyImg = /*#__PURE__*/React.createElement(_empty.default, null);
const simpleEmptyImg = /*#__PURE__*/React.createElement(_simple.default, null);
const Empty = props => {
  const {
    className,
    rootClassName,
    prefixCls: customizePrefixCls,
    image,
    description,
    children,
    imageStyle,
    style,
    classNames,
    styles,
    ...restProps
  } = props;
  const {
    getPrefixCls,
    direction,
    className: contextClassName,
    style: contextStyle,
    classNames: contextClassNames,
    styles: contextStyles,
    image: contextImage
  } = (0, _context.useComponentConfig)('empty');
  const prefixCls = getPrefixCls('empty', customizePrefixCls);
  const [hashId, cssVarCls] = (0, _style.default)(prefixCls);
  const [mergedClassNames, mergedStyles] = (0, _hooks.useMergeSemantic)([contextClassNames, classNames], [contextStyles, styles], {
    props
  });
  const [locale] = (0, _locale.useLocale)('Empty');
  const des = typeof description !== 'undefined' ? description : locale?.description;
  const alt = typeof des === 'string' ? des : 'empty';
  const mergedImage = image ?? contextImage ?? defaultEmptyImg;
  let imageNode = null;
  if (typeof mergedImage === 'string') {
    imageNode = /*#__PURE__*/React.createElement("img", {
      draggable: false,
      alt: alt,
      src: mergedImage
    });
  } else {
    imageNode = mergedImage;
  }
  // ============================= Warning ==============================
  if (process.env.NODE_ENV !== 'production') {
    const warning = (0, _warning.devUseWarning)('Empty');
    [['imageStyle', 'styles.image']].forEach(([deprecatedName, newName]) => {
      warning.deprecated(!(deprecatedName in props), deprecatedName, newName);
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    className: (0, _clsx.clsx)(hashId, cssVarCls, prefixCls, contextClassName, {
      [`${prefixCls}-normal`]: mergedImage === simpleEmptyImg,
      [`${prefixCls}-rtl`]: direction === 'rtl'
    }, className, rootClassName, mergedClassNames.root),
    style: {
      ...mergedStyles.root,
      ...contextStyle,
      ...style
    },
    ...restProps
  }, /*#__PURE__*/React.createElement("div", {
    className: (0, _clsx.clsx)(`${prefixCls}-image`, mergedClassNames.image),
    style: {
      ...imageStyle,
      ...mergedStyles.image
    }
  }, imageNode), des && (/*#__PURE__*/React.createElement("div", {
    className: (0, _clsx.clsx)(`${prefixCls}-description`, mergedClassNames.description),
    style: mergedStyles.description
  }, des)), children && (/*#__PURE__*/React.createElement("div", {
    className: (0, _clsx.clsx)(`${prefixCls}-footer`, mergedClassNames.footer),
    style: mergedStyles.footer
  }, children)));
};
Empty.PRESENTED_IMAGE_DEFAULT = defaultEmptyImg;
Empty.PRESENTED_IMAGE_SIMPLE = simpleEmptyImg;
if (process.env.NODE_ENV !== 'production') {
  Empty.displayName = 'Empty';
}
var _default = exports.default = Empty;